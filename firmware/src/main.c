#include "pico/stdlib.h"
#include "pico/bootrom.h"
#include "hardware/adc.h"
#include "hardware/i2c.h"
#include "hardware/flash.h"
#include "hardware/watchdog.h"
#include "hardware/structs/adc.h"
#include "hardware/structs/watchdog.h"
#include "hardware/sync.h"
#include "tusb.h"
#include "command.h"
#include "profile.h"
#include "session.h"
#include "usb_identity.h"
#include "temperature.h"
#include <stdio.h>
#include <string.h>

#define FAULT_MAGIC 0x53414645u
#define FAULT_SCRATCH_INDEX 2u /* ROM USB uses0/1; SDK/ROM reboot uses4–7. */
#define I2C_TIMEOUT_US 10000u
#define PROFILE_OFFSET (PD_PROFILE_ADDRESS - XIP_BASE)
_Static_assert(PICO_FLASH_SIZE_BYTES == 16u * 1024u * 1024u, "W25Q128JVSIQ is 16 MiB");
_Static_assert(PROFILE_OFFSET + FLASH_SECTOR_SIZE == PICO_FLASH_SIZE_BYTES, "Profile reserves the final sector");

static pd_settings settings, saved_settings;
static pd_session session;
static pd_temperature hot_sensor, cold_sensor;
static bool running, constant_current, measurement_ok, saved_valid, usb_started, usb_attached, flash_valid;
static uint16_t measured_mv, measured_ma, input_mv, program_mv;
static uint8_t excessive_samples;
static const char *fault;
static uint32_t boot_deadline;
static bool boot_pending, program_present;
static uint32_t milliseconds(void) { return (uint32_t)to_ms_since_boot(get_absolute_time()); }
uint32_t tusb_time_millis_api(void) { return milliseconds(); }
static void kill(void) {
  gpio_put(PD_PERMISSION_PIN, false); gpio_put(PD_RUN_LED_PIN, false);
  running = false; constant_current = false;
}
static void fail(const char *reason, bool protective) {
  kill(); fault = reason; pd_session_fault(&session, protective);
  if (protective) watchdog_hw->scratch[FAULT_SCRATCH_INDEX] = FAULT_MAGIC;
  gpio_put(PD_FAULT_LED_PIN, true);
}
void isr_hardfault(void) {
  kill(); watchdog_hw->scratch[FAULT_SCRATCH_INDEX] = FAULT_MAGIC;
  while (1) tight_loop_contents();
}
static void gpio_init_safe(void) {
  const unsigned outputs[] = {PD_PERMISSION_PIN, PD_RUN_LED_PIN, PD_FAULT_LED_PIN};
  for (unsigned i = 0; i < count_of(outputs); ++i) {
    gpio_init(outputs[i]); gpio_put(outputs[i], false); gpio_set_dir(outputs[i], GPIO_OUT);
  }
  gpio_init(PD_DRIVER_FAULT_PIN); gpio_set_dir(PD_DRIVER_FAULT_PIN, GPIO_IN); gpio_pull_up(PD_DRIVER_FAULT_PIN);
  gpio_init(PD_PD_FAULT_PIN); gpio_set_dir(PD_PD_FAULT_PIN, GPIO_IN); gpio_disable_pulls(PD_PD_FAULT_PIN);
  i2c_init(i2c0, 100000);
  gpio_set_function(PD_I2C_SDA_PIN, GPIO_FUNC_I2C); gpio_set_function(PD_I2C_SCL_PIN, GPIO_FUNC_I2C);
  gpio_disable_pulls(PD_I2C_SDA_PIN); gpio_disable_pulls(PD_I2C_SCL_PIN); /* Board has external pull-ups. */
  adc_init();
  adc_gpio_init(PD_CURRENT_ADC_PIN); adc_gpio_init(PD_VOLTAGE_ADC_PIN);
  adc_gpio_init(PD_INPUT_ADC_PIN); adc_gpio_init(PD_PROGRAM_ADC_PIN);
}
static bool flash_identify(void) {
  uint8_t tx[] = {0x9F,0,0,0}, rx[4];
  uint32_t interrupts = save_and_disable_interrupts();
  flash_do_cmd(tx, rx, sizeof tx);
  restore_interrupts(interrupts);
  return rx[1] == 0xEF && rx[2] == 0x40 && rx[3] == 0x18;
}
static bool sample(unsigned channel, uint16_t *value) {
  adc_select_input(channel); *value = adc_read();
  return !(adc_hw->cs & ADC_CS_ERR_BITS); /* Inspect each conversion before selecting another. */
}
static bool measure(void) {
  uint16_t current, voltage, input, program;
  if (!sample(0, &current) || !sample(1, &voltage) || !sample(2, &input) || !sample(3, &program)) return false;
  measured_mv = (uint16_t)((uint32_t)voltage * PD_ADC_REFERENCE_MV * 6u / 4095u);
  measured_ma = (uint16_t)((uint32_t)current * PD_ADC_REFERENCE_MV * 5u / 4095u);
  input_mv = (uint16_t)((uint32_t)input * PD_ADC_REFERENCE_MV * 172u / (4095u * 22u));
  program_mv = (uint16_t)((uint32_t)program * PD_ADC_REFERENCE_MV * 7u / (4095u * 4u));
  if (program_mv >= PD_USB_ATTACH_MV) program_present = true;
  else if (program_mv <= PD_USB_DETACH_MV) program_present = false;
  return true;
}
static bool pd_ready(void) {
  return measurement_ok && input_mv >= 18000u && input_mv <= 22000u && !gpio_get(PD_PD_FAULT_PIN);
}
static bool driver_read(uint8_t reg, uint8_t *value) {
  return i2c_write_timeout_us(i2c0, TPS_ADDRESS, &reg, 1, true, I2C_TIMEOUT_US) == 1 &&
         i2c_read_timeout_us(i2c0, TPS_ADDRESS, value, 1, false, I2C_TIMEOUT_US) == 1;
}
static bool driver_write_verified(uint8_t reg, uint8_t value) {
  uint8_t data[] = {reg,value}, observed;
  return i2c_write_timeout_us(i2c0, TPS_ADDRESS, data, sizeof data, false, I2C_TIMEOUT_US) == sizeof data &&
         driver_read(reg, &observed) && observed == value;
}
static void start_output(void) {
  kill(); pd_session_cancel(&session); sleep_ms(2); /* EN low resets OE to zero. */
  measurement_ok = measure();
  if (!measurement_ok) { fail("ADC", true); return; }
  if (!pd_ready()) { fail("PD", false); return; }
  if (!pd_valid(&settings)) { fail("SETTINGS", true); return; }
  gpio_put(PD_PERMISSION_PIN, true); sleep_ms(5);
  uint16_t ref = pd_reference_code(settings.voltage_mv);
  if (!driver_write_verified(6, TPS_MODE_OFF) || !driver_write_verified(4, TPS_INTERNAL_FB) ||
      !driver_write_verified(0, (uint8_t)ref) || !driver_write_verified(1, (uint8_t)(ref >> 8)) ||
      !driver_write_verified(2, pd_current_code(settings.current_ma)) || !driver_write_verified(3, 0x00) ||
      !driver_write_verified(5, TPS_CDC_FAULTS)) { fail("BUS", true); return; }
  uint8_t status;
  measurement_ok = measure();
  if (!measurement_ok) { fail("ADC", true); return; }
  if (!pd_ready()) { fail("PD", false); return; }
  if (!driver_read(7, &status)) { fail("BUS", true); return; }
  if (status & TPS_FATAL_STATUS) { fail("LOAD", true); return; }
  if (!driver_write_verified(6, TPS_MODE_ON)) { fail("BUS", true); return; }
  running = true; fault = NULL; constant_current = false; excessive_samples = 0;
  pd_session_clear(&session); watchdog_hw->scratch[FAULT_SCRATCH_INDEX] = 0;
  gpio_put(PD_RUN_LED_PIN, true); gpio_put(PD_FAULT_LED_PIN, false);
}
static void stop_output(void) {
  pd_session_cancel(&session);
  if (running && !driver_write_verified(6, TPS_MODE_OFF)) { fail("BUS", true); return; }
  running = false; constant_current = false; gpio_put(PD_RUN_LED_PIN, false);
}
static void check_output(void) {
  if (!pd_ready()) { fail("PD", false); return; }
  if (!gpio_get(PD_DRIVER_FAULT_PIN)) { fail("LOAD", true); return; }
  uint8_t status, mode;
  if (!driver_read(7, &status) || !driver_read(6, &mode)) { fail("BUS", true); return; }
  if ((status & TPS_FATAL_STATUS) || mode != TPS_MODE_ON) { fail("LOAD", true); return; }
  constant_current = (status & 0x40u) != 0;
  if (measured_mv > settings.voltage_mv + 600u || measured_ma > settings.current_ma + 600u) {
    if (++excessive_samples >= 3) fail("LIMIT", true);
  } else excessive_samples = 0;
}
static bool save_profile(void) {
  if (running || !flash_valid) return false;
  pd_profile record; pd_profile_make(&record, &settings);
  const pd_profile *stored = (const pd_profile *)PD_PROFILE_ADDRESS;
  if (saved_valid && memcmp(&record, stored, sizeof record) == 0) return true;
  kill(); pd_session_cancel(&session); saved_valid = false;
  uint8_t page[FLASH_PAGE_SIZE]; memset(page, 0xFF, sizeof page); memcpy(page, &record, sizeof record);
  /* Core1 is never launched. SDK flash routines execute from RAM and restore
   * XIP; mask all core0 IRQs while flash is unavailable. Refresh before erase. */
  watchdog_update();
  uint32_t interrupts = save_and_disable_interrupts();
  flash_range_erase(PROFILE_OFFSET, FLASH_SECTOR_SIZE);
  flash_range_program(PROFILE_OFFSET, page, sizeof page);
  restore_interrupts(interrupts);
  watchdog_update();
  saved_valid = memcmp(page, stored, sizeof page) == 0 && pd_profile_read(stored, &saved_settings);
  return saved_valid;
}
static void reply(const char *text) { tud_cdc_write_str(text); tud_cdc_write_str("\r\n"); tud_cdc_write_flush(); }
static void status(void) {
  char response[480], hot[128], cold[128]; /* Plus CRLF fits the reserved 512-byte CDC space. */
  uint32_t now = milliseconds();
  pd_temp_json(&hot_sensor, now, "hot", hot, sizeof hot);
  pd_temp_json(&cold_sensor, now, "cold", cold, sizeof cold);
  snprintf(response, sizeof response,
    "{\"run\":%u,\"cc\":%u,\"pd\":%u,\"fault\":\"%s\",\"set_mv\":%u,\"limit_ma\":%u,\"approx_mv\":%u,\"approx_ma\":%u,\"input_mv\":%u,\"saved\":%u,\"boot_ready\":1,%s,%s}",
    (unsigned)running, (unsigned)constant_current, (unsigned)pd_ready(), fault ? fault : "NONE",
    (unsigned)settings.voltage_mv, (unsigned)settings.current_ma, (unsigned)measured_mv,
    (unsigned)measured_ma, (unsigned)input_mv, (unsigned)saved_valid, hot, cold);
  reply(response);
}
static void command(const char *line) {
  pd_command c;
  if (!pd_parse_command(line, &c)) { reply("ERR COMMAND_OR_LIMITS"); return; }
  switch (c.kind) {
  case CMD_SET:
    if (running) { reply("ERR STOP_FIRST"); return; }
    pd_set(&settings, c.voltage_mv, c.current_ma); pd_session_cancel(&session); reply("OK SET"); break;
  case CMD_RUN: if (!running) start_output(); reply(running ? "OK RUN" : "ERR RUN_CHECK_STATUS"); break;
  case CMD_STOP: stop_output(); reply(running ? "ERR STOP" : "OK STOP"); break;
  case CMD_SAVE:
    if (running) reply("ERR STOP_FIRST");
    else {
      pd_session_cancel(&session);
      bool ok = save_profile(); if (!ok) fail("SAVE", true);
      reply(ok ? "OK SAVE" : "ERR SAVE");
    }
    break;
  case CMD_CLEAR:
    kill(); pd_session_clear(&session); watchdog_hw->scratch[FAULT_SCRATCH_INDEX] = 0; fault = NULL;
    gpio_put(PD_FAULT_LED_PIN, false); reply("OK CLEAR"); break;
  case CMD_STATUS: status(); break;
  case CMD_BOOT:
    kill(); pd_session_cancel(&session); reply("OK BOOT");
    boot_pending = true; boot_deadline = milliseconds() + 50u; break;
  case CMD_HELP: reply("SET <mV> <mA> | SAVE | RUN | STOP | STATUS | CLEAR | BOOT"); break;
  default: reply("ERR COMMAND"); break;
  }
}
static void usb_task(void) {
  static char line[64]; static unsigned length; static bool overflow;
  if (program_present && !usb_started) {
    tusb_rhport_init_t init = {.role = TUSB_ROLE_DEVICE, .speed = TUSB_SPEED_FULL};
    usb_started = tusb_init(0, &init); usb_attached = usb_started;
  } else if (usb_started && program_present != usb_attached) {
    if (program_present) tud_connect(); else tud_disconnect();
    usb_attached = program_present;
  }
  if (!program_present) { length = 0; overflow = false; }
  if (!usb_started) return;
  tud_task(); /* USB detach does not change an operating PD output. */
  if (!program_present || !tud_cdc_connected()) { length = 0; overflow = false; return; }
  if (tud_cdc_write_available() < 512u || boot_pending) return;
  unsigned budget = 64;
  while (budget-- && tud_cdc_available()) {
    char ch; tud_cdc_read(&ch, 1);
    if (ch == '\r' || ch == '\n') {
      if (!length && !overflow) continue;
      if (overflow) reply("ERR LINE_TOO_LONG"); else { line[length] = 0; command(line); }
      length = 0; overflow = false; break;
    }
    if (ch >= 'a' && ch <= 'z') ch = (char)(ch - 'a' + 'A');
    if (ch < ' ' && ch != '\t') { overflow = true; continue; }
    if (length < sizeof line - 1) line[length++] = ch; else overflow = true;
  }
}
int main(void) {
  gpio_init_safe(); kill();
  pd_onewire_init(PD_HOT_SENSOR_PIN); pd_onewire_init(PD_COLD_SENSOR_PIN);
  pd_temp_init(&hot_sensor, PD_HOT_SENSOR_PIN, milliseconds());
  pd_temp_init(&cold_sensor, PD_COLD_SENSOR_PIN, milliseconds());
  bool latched = watchdog_enable_caused_reboot() || watchdog_hw->scratch[FAULT_SCRATCH_INDEX] == FAULT_MAGIC;
  if (latched) watchdog_hw->scratch[FAULT_SCRATCH_INDEX] = FAULT_MAGIC;
  watchdog_enable(500, false);
  flash_valid = flash_identify(); pd_usb_identity_init();
  pd_defaults(&settings);
  saved_valid = flash_valid && pd_profile_read((const pd_profile *)PD_PROFILE_ADDRESS, &saved_settings);
  if (saved_valid) settings = saved_settings;
  pd_session_init(&session, saved_valid, latched);
  if (latched) { fault = "RESET_OR_PROTECTION"; gpio_put(PD_FAULT_LED_PIN, true); }
  while (1) {
    measurement_ok = measure();
    if (!measurement_ok) fail("ADC", true);
    if (running) check_output();
    usb_task();
    if (boot_pending && (int32_t)(milliseconds() - boot_deadline) >= 0) {
      kill(); watchdog_disable(); reset_usb_boot(0, 0); /* No ROM activity GPIO. */
    }
    if (!boot_pending && pd_session_tick(&session, pd_ready(), saved_valid, milliseconds())) {
      settings = saved_settings; start_output();
    }
    if (!boot_pending) {
      pd_temp_tick(&hot_sensor, &pd_onewire_bus, milliseconds());
      pd_temp_tick(&cold_sensor, &pd_onewire_bus, milliseconds());
    }
    watchdog_update(); sleep_ms(10);
  }
}

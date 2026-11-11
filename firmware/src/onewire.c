#include "temperature.h"
#include "pico/stdlib.h"
#include "hardware/sync.h"

/* GPIO output latch is always LOW: direction controls the open-drain bus.
 * External 4.7 k pull-ups supply HIGH; never drive a probe line HIGH. */
static void low(unsigned pin) { gpio_set_dir(pin, GPIO_OUT); }
static void release(unsigned pin) { gpio_set_dir(pin, GPIO_IN); }
void pd_onewire_init(unsigned pin) {
  gpio_init(pin); gpio_put(pin, false); release(pin); gpio_disable_pulls(pin);
}
static pd_temp_status reset(unsigned pin) {
  release(pin); busy_wait_us_32(5);
  if (!gpio_get(pin)) return PD_TEMP_BUS;
  low(pin); busy_wait_us_32(500); /* IRQs remain enabled during reset LOW. */
  uint32_t interrupts = save_and_disable_interrupts();
  release(pin); busy_wait_us_32(70);
  bool presence = !gpio_get(pin);
  restore_interrupts(interrupts);
  busy_wait_us_32(410); /* At least 480 us HIGH before the next slot. */
  if (!gpio_get(pin)) return PD_TEMP_BUS;
  return presence ? PD_TEMP_OK : PD_TEMP_MISSING;
}
static void write_bit(unsigned pin, bool bit) {
  uint32_t interrupts = save_and_disable_interrupts();
  low(pin); busy_wait_us_32(bit ? 6u : 65u); release(pin);
  restore_interrupts(interrupts);
  busy_wait_us_32(bit ? 64u : 5u);
}
static bool read_bit(unsigned pin) {
  uint32_t interrupts = save_and_disable_interrupts();
  low(pin); busy_wait_us_32(2); release(pin); busy_wait_us_32(10);
  bool bit = gpio_get(pin);
  restore_interrupts(interrupts);
  busy_wait_us_32(58);
  return bit;
}
static void write(unsigned pin, uint8_t byte) {
  for (unsigned bit = 0; bit < 8; ++bit) { write_bit(pin, byte & 1u); byte >>= 1; }
}
static uint8_t read(unsigned pin) {
  uint8_t byte = 0;
  for (unsigned bit = 0; bit < 8; ++bit) if (read_bit(pin)) byte |= (uint8_t)(1u << bit);
  return byte;
}
const pd_temp_bus pd_onewire_bus = {.reset = reset, .write = write, .read = read, .read_bit = read_bit};

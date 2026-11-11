#include "temperature.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

typedef struct {
  uint8_t rom[8], data[9], command;
  unsigned position, reads, resets, writes, conversion_reads;
  pd_temp_status reset_status;
  bool powered, busy, complete;
} fake_sensor;
static fake_sensor probes[2];
static pd_temp_status reset(unsigned pin) {
  fake_sensor *p = &probes[pin];
  ++p->resets; p->command = 0; p->position = 0;
  return p->reset_status;
}
static void write(unsigned pin, uint8_t byte) {
  fake_sensor *p = &probes[pin];
  ++p->writes; p->command = byte; p->position = 0;
  if (byte == 0x44) p->conversion_reads = 0;
}
static uint8_t read(unsigned pin) {
  fake_sensor *p = &probes[pin]; ++p->reads;
  if (p->command == 0x33) { assert(p->position < 8); return p->rom[p->position++]; }
  assert(p->command == 0xBE && p->position < 9);
  return p->data[p->position++];
}
static bool read_bit(unsigned pin) {
  fake_sensor *p = &probes[pin];
  if (p->command == 0xB4) return p->powered;
  assert(p->command == 0x44);
  return p->conversion_reads++ == 0 ? !p->busy : p->complete;
}
static const pd_temp_bus bus = {.reset = reset, .write = write, .read = read, .read_bit = read_bit};
static void fixture(unsigned pin) {
  probes[pin] = (fake_sensor){.rom = {0x28,1,2,3,4,5,6,0},
    .data = {0x50,0x05,0x4B,0x46,0x7F,0xFF,0x0C,0x10,0x1C},
    .reset_status = PD_TEMP_OK, .powered = true, .busy = true, .complete = true};
  probes[pin].rom[7] = pd_temp_crc(probes[pin].rom, 7);
}
static void set_temperature(unsigned pin, int16_t value, unsigned resolution) {
  probes[pin].data[0] = (uint8_t)value;
  probes[pin].data[1] = (uint8_t)((uint16_t)value >> 8);
  probes[pin].data[4] = (uint8_t)(0x1F | (resolution << 5));
  probes[pin].data[8] = pd_temp_crc(probes[pin].data, 8);
}
static void decoding(void) {
  fixture(0);
  int16_t value = -999;
  /* Fixed Dallas/Maxim scratchpad golden CRC, independent of data generation. */
  assert(pd_temp_crc(probes[0].data, 8) == 0x1C);
  assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_OK && value == 85 * 16);
  const int16_t readings[] = {2000, 1360, 401, 162, 8, 0, -8, -162, -401, -880};
  for (unsigned i = 0; i < sizeof readings / sizeof readings[0]; ++i) {
    set_temperature(0, readings[i], 3);
    assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_OK && value == readings[i]);
  }
  for (unsigned resolution = 0; resolution < 4; ++resolution) {
    set_temperature(0, 407, resolution);
    assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_OK);
    assert(value == (int16_t)(407 & ~((1 << (3 - resolution)) - 1)));
    set_temperature(0, -401, resolution);
    assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_OK);
    assert(value == (int16_t)(-401 & ~((1 << (3 - resolution)) - 1)));
  }
  fixture(0);
  for (unsigned bit = 0; bit < 72; ++bit) {
    uint8_t corrupted[9]; memcpy(corrupted, probes[0].data, sizeof corrupted);
    corrupted[bit / 8] ^= (uint8_t)(1u << (bit % 8)); value = 321;
    assert(pd_temp_decode(corrupted, &value) == PD_TEMP_CRC && value == 321);
  }
  set_temperature(0, 2001, 3); assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_DATA);
  set_temperature(0, -881, 3); assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_DATA);
  uint8_t zero[9] = {0}; assert(pd_temp_decode(zero, &value) == PD_TEMP_DATA);
  fixture(0); probes[0].data[4] |= 0x80;
  probes[0].data[8] = pd_temp_crc(probes[0].data, 8);
  assert(pd_temp_decode(probes[0].data, &value) == PD_TEMP_DATA);
}
static void conversion_and_telemetry(void) {
  fixture(0); fixture(1);
  pd_temperature hot, cold; char text[160];
  pd_temp_init(&hot, 0, 0); pd_temp_init(&cold, 1, 0);
  assert(!hot.valid && hot.status == PD_TEMP_WARMUP);
  pd_temp_json(&hot, 0, "hot", text, sizeof text);
  assert(strstr(text, "\"hot_c\":null") && strstr(text, "\"hot_age_ms\":null"));
  pd_temp_tick(&hot, &bus, 0);
  assert(hot.converting && !hot.valid && hot.status == PD_TEMP_CONVERTING);
  unsigned reads = probes[0].reads, writes = probes[0].writes;
  for (uint32_t now = 1; now < 800; ++now) pd_temp_tick(&hot, &bus, now);
  assert(probes[0].reads == reads && probes[0].writes == writes); /* No conversion wait/poll loop. */
  pd_temp_tick(&hot, &bus, 800);
  assert(hot.valid && hot.ever_valid && hot.sixteenths_c == 1360 && hot.status == PD_TEMP_OK);
  pd_temp_json(&hot, 875, "hot", text, sizeof text);
  assert(strstr(text, "\"hot_c\":85.0000") && strstr(text, "\"hot_age_ms\":75"));
  pd_temp_tick(&hot, &bus, 1050); assert(hot.valid && hot.converting);
  probes[0].data[8] ^= 1;
  pd_temp_tick(&hot, &bus, 1850);
  assert(!hot.valid && hot.status == PD_TEMP_CRC && hot.sampled_at == 800);
  pd_temp_json(&hot, 1900, "hot", text, sizeof text);
  assert(strstr(text, "\"hot_c\":null") && strstr(text, "\"hot_age_ms\":1100"));
  set_temperature(1, -162, 3);
  pd_temp_tick(&cold, &bus, 1900); pd_temp_tick(&cold, &bus, 2700);
  assert(cold.valid && cold.sixteenths_c == -162 && !hot.valid); /* Independent ports. */
  pd_temp_json(&cold, 2700, "cold", text, sizeof text);
  assert(strstr(text, "\"cold_c\":-10.1250"));
  cold.deadline = 6000;
  pd_temp_tick(&cold, &bus, 4701);
  assert(!cold.valid && cold.status == PD_TEMP_STALE);
}
static void failures_and_rollover(void) {
  const pd_temp_status failures[] = {PD_TEMP_MISSING, PD_TEMP_BUS, PD_TEMP_ROM_CRC,
    PD_TEMP_FAMILY, PD_TEMP_PARASITE, PD_TEMP_CONVERSION};
  for (unsigned i = 0; i < sizeof failures / sizeof failures[0]; ++i) {
    fixture(0); pd_temperature sensor; pd_temp_init(&sensor, 0, 100);
    switch (failures[i]) {
    case PD_TEMP_MISSING: case PD_TEMP_BUS: probes[0].reset_status = failures[i]; break;
    case PD_TEMP_ROM_CRC: probes[0].rom[7] ^= 1; break;
    case PD_TEMP_FAMILY: probes[0].rom[0] = 0x10; probes[0].rom[7] = pd_temp_crc(probes[0].rom, 7); break;
    case PD_TEMP_PARASITE: probes[0].powered = false; break;
    default: probes[0].busy = false; break;
    }
    pd_temp_tick(&sensor, &bus, 100);
    assert(!sensor.valid && !sensor.converting && sensor.status == failures[i]);
    assert(probes[0].reads <= 8); /* In particular, never return startup +85 C. */
    unsigned resets = probes[0].resets;
    pd_temp_tick(&sensor, &bus, 1099); assert(probes[0].resets == resets);
    fixture(0); pd_temp_tick(&sensor, &bus, 1100); pd_temp_tick(&sensor, &bus, 1900);
    assert(sensor.valid); /* A properly reconnected probe recovers without affecting RUN. */
  }
  fixture(0); pd_temperature sensor; pd_temp_init(&sensor, 0, UINT32_MAX - 399u);
  pd_temp_tick(&sensor, &bus, UINT32_MAX - 399u);
  pd_temp_tick(&sensor, &bus, 399); assert(!sensor.valid);
  pd_temp_tick(&sensor, &bus, 400); assert(sensor.valid);
  fixture(0); pd_temp_init(&sensor, 0, 0); pd_temp_tick(&sensor, &bus, 0);
  probes[0].complete = false; pd_temp_tick(&sensor, &bus, 800);
  assert(!sensor.valid && sensor.status == PD_TEMP_CONVERSION);
}
int main(void) {
  decoding(); conversion_and_telemetry(); failures_and_rollover();
  puts("Temperature tests passed: golden CRC, 72 corruptions, signed/resolution decoding, nonblocking conversion, startup, faults, recovery, telemetry and rollover.");
  return 0;
}

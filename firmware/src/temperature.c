#include "temperature.h"
#include <stdio.h>

uint8_t pd_temp_crc(const uint8_t *bytes, size_t length) {
  uint8_t crc = 0;
  while (length--) {
    uint8_t byte = *bytes++;
    for (unsigned bit = 0; bit < 8; ++bit) {
      bool mix = (crc ^ byte) & 1u;
      crc >>= 1; if (mix) crc ^= 0x8Cu;
      byte >>= 1;
    }
  }
  return crc;
}
pd_temp_status pd_temp_decode(const uint8_t data[9], int16_t *sixteenths_c) {
  if (pd_temp_crc(data, 8) != data[8]) return PD_TEMP_CRC;
  if ((data[4] & 0x9Fu) != 0x1Fu || data[5] != 0xFFu || data[7] != 0x10u) return PD_TEMP_DATA;
  unsigned resolution = (data[4] >> 5) & 3u;
  uint16_t raw = (uint16_t)data[0] | ((uint16_t)data[1] << 8);
  raw &= (uint16_t)~((1u << (3u - resolution)) - 1u); /* Low bits are undefined below 12 bits. */
  int16_t value = (int16_t)raw;
  if (value < -55 * 16 || value > 125 * 16) return PD_TEMP_DATA;
  *sixteenths_c = value;
  return PD_TEMP_OK;
}
void pd_temp_init(pd_temperature *sensor, unsigned pin, uint32_t now) {
  *sensor = (pd_temperature){.pin = pin, .status = PD_TEMP_WARMUP, .deadline = now};
}
static void failed(pd_temperature *sensor, pd_temp_status status, uint32_t now) {
  sensor->valid = false; sensor->converting = false;
  sensor->status = status; sensor->deadline = now + 1000u;
}
void pd_temp_tick(pd_temperature *sensor, const pd_temp_bus *bus, uint32_t now) {
  if (sensor->valid && now - sensor->sampled_at > 2000u) {
    sensor->valid = false; sensor->status = PD_TEMP_STALE;
  }
  if ((int32_t)(now - sensor->deadline) < 0) return;
  unsigned pin = sensor->pin;
  if (!sensor->converting) {
    pd_temp_status result = bus->reset(pin);
    if (result != PD_TEMP_OK) { failed(sensor, result, now); return; }
    uint8_t rom[8]; bus->write(pin, 0x33); /* Single device per port: Read ROM. */
    for (unsigned i = 0; i < sizeof rom; ++i) rom[i] = bus->read(pin);
    if (pd_temp_crc(rom, 7) != rom[7]) { failed(sensor, PD_TEMP_ROM_CRC, now); return; }
    if (rom[0] != 0x28u) { failed(sensor, PD_TEMP_FAMILY, now); return; }
    result = bus->reset(pin);
    if (result != PD_TEMP_OK) { failed(sensor, result, now); return; }
    bus->write(pin, 0xCC); bus->write(pin, 0xB4); /* Require external VDD; no strong pull-up. */
    if (!bus->read_bit(pin)) { failed(sensor, PD_TEMP_PARASITE, now); return; }
    result = bus->reset(pin);
    if (result != PD_TEMP_OK) { failed(sensor, result, now); return; }
    bus->write(pin, 0xCC); bus->write(pin, 0x44);
    /* Withhold startup samples until Convert T has been observed busy, then
     * completed. A probe power loss during conversion is not detectable here. */
    if (bus->read_bit(pin)) { failed(sensor, PD_TEMP_CONVERSION, now); return; }
    sensor->converting = true; sensor->status = PD_TEMP_CONVERTING;
    /* now precedes this bounded GPIO transaction. Add 50 ms setup margin so
     * the actual conversion always receives at least its specified 750 ms. */
    sensor->deadline = now + 800u;
    return;
  }
  if (!bus->read_bit(pin)) { failed(sensor, PD_TEMP_CONVERSION, now); return; }
  pd_temp_status result = bus->reset(pin);
  if (result != PD_TEMP_OK) { failed(sensor, result, now); return; }
  uint8_t data[9]; bus->write(pin, 0xCC); bus->write(pin, 0xBE);
  for (unsigned i = 0; i < sizeof data; ++i) data[i] = bus->read(pin);
  result = pd_temp_decode(data, &sensor->sixteenths_c);
  if (result != PD_TEMP_OK) { failed(sensor, result, now); return; }
  sensor->valid = true; sensor->ever_valid = true; sensor->converting = false;
  sensor->sampled_at = now; sensor->status = PD_TEMP_OK; sensor->deadline = now + 250u;
}
const char *pd_temp_status_name(pd_temp_status status) {
  static const char *const names[] = {"WARMUP", "CONVERTING", "OK", "MISSING", "BUS", "ROM_CRC",
    "FAMILY", "PARASITE", "CONVERSION", "CRC", "DATA", "STALE"};
  return (unsigned)status < sizeof names / sizeof names[0] ? names[status] : "DATA";
}
void pd_temp_json(const pd_temperature *sensor, uint32_t now, const char *name, char *text, size_t size) {
  char temperature[16] = "null", age[16] = "null";
  if (sensor->valid) {
    int value = sensor->sixteenths_c;
    unsigned magnitude = (unsigned)(value < 0 ? -value : value);
    snprintf(temperature, sizeof temperature, "%s%u.%04u", value < 0 ? "-" : "", magnitude / 16u, (magnitude % 16u) * 625u);
  }
  if (sensor->ever_valid) snprintf(age, sizeof age, "%lu", (unsigned long)(now - sensor->sampled_at));
  snprintf(text, size, "\"%s_c\":%s,\"%s_valid\":%u,\"%s_age_ms\":%s,\"%s_status\":\"%s\"",
    name, temperature, name, (unsigned)sensor->valid, name, age, name, pd_temp_status_name(sensor->status));
}

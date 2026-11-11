#ifndef GENERAL_PD_TEMPERATURE_H
#define GENERAL_PD_TEMPERATURE_H
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef enum {
  PD_TEMP_WARMUP, PD_TEMP_CONVERTING, PD_TEMP_OK, PD_TEMP_MISSING,
  PD_TEMP_BUS, PD_TEMP_ROM_CRC, PD_TEMP_FAMILY, PD_TEMP_PARASITE,
  PD_TEMP_CONVERSION, PD_TEMP_CRC, PD_TEMP_DATA, PD_TEMP_STALE
} pd_temp_status;
typedef struct {
  pd_temp_status (*reset)(unsigned pin);
  void (*write)(unsigned pin, uint8_t byte);
  uint8_t (*read)(unsigned pin);
  bool (*read_bit)(unsigned pin);
} pd_temp_bus;
typedef struct {
  unsigned pin;
  pd_temp_status status;
  bool valid, ever_valid, converting;
  int16_t sixteenths_c;
  uint32_t sampled_at, deadline;
} pd_temperature;

uint8_t pd_temp_crc(const uint8_t *bytes, size_t length);
pd_temp_status pd_temp_decode(const uint8_t scratchpad[9], int16_t *sixteenths_c);
void pd_temp_init(pd_temperature *sensor, unsigned pin, uint32_t now);
void pd_temp_tick(pd_temperature *sensor, const pd_temp_bus *bus, uint32_t now);
const char *pd_temp_status_name(pd_temp_status status);
void pd_temp_json(const pd_temperature *sensor, uint32_t now, const char *name, char *text, size_t size);
void pd_onewire_init(unsigned pin);
extern const pd_temp_bus pd_onewire_bus;
#endif

#include "profile.h"
#include <stddef.h>
_Static_assert(sizeof(pd_profile) == 16 && offsetof(pd_profile, crc) == 12, "Flash record layout");
static uint32_t checksum(const pd_profile *profile) {
  uint32_t crc = 0xFFFFFFFFu;
  const uint8_t *bytes = (const uint8_t *)profile;
  for (unsigned i = 0; i < offsetof(pd_profile, crc); ++i) {
    crc ^= bytes[i];
    for (unsigned bit = 0; bit < 8; ++bit) crc = (crc >> 1) ^ ((crc & 1u) ? 0xEDB88320u : 0);
  }
  return ~crc;
}
void pd_profile_make(pd_profile *profile, const pd_settings *settings) {
  *profile = (pd_profile){0x50445031u, 1, settings->voltage_mv, settings->current_ma, 1, 0};
  profile->crc = checksum(profile);
}
bool pd_profile_read(const pd_profile *profile, pd_settings *settings) {
  if (profile->magic != 0x50445031u || profile->version != 1 || profile->flags != 1 ||
      profile->crc != checksum(profile)) return false;
  return pd_set(settings, profile->voltage_mv, profile->current_ma);
}

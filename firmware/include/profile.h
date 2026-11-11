#ifndef GENERAL_PD_PROFILE_H
#define GENERAL_PD_PROFILE_H
#include "policy.h"
typedef struct {
  uint32_t magic;
  uint16_t version, voltage_mv, current_ma, flags;
  uint32_t crc;
} pd_profile;
#define PD_PROFILE_ADDRESS 0x10FFF000u
void pd_profile_make(pd_profile *profile, const pd_settings *settings);
bool pd_profile_read(const pd_profile *profile, pd_settings *settings);
#endif

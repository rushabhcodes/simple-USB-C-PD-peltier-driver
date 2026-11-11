#include "policy.h"
void pd_defaults(pd_settings *s) { *s = (pd_settings){PD_DEFAULT_MV, PD_DEFAULT_MA}; }
bool pd_valid(const pd_settings *s) {
  return s->voltage_mv >= PD_MIN_MV && s->voltage_mv <= PD_MAX_MV &&
         s->current_ma >= PD_MIN_MA && s->current_ma <= PD_MAX_MA &&
         s->voltage_mv % 100u == 0u && s->current_ma % 50u == 0u &&
         (uint32_t)s->voltage_mv * s->current_ma <= PD_MAX_MW * 1000u;
}
bool pd_set(pd_settings *s, uint16_t mv, uint16_t ma) {
  pd_settings next = {mv, ma};
  if (!pd_valid(&next)) return false;
  *s = next;
  return true;
}
uint16_t pd_reference_code(uint16_t voltage_mv) {
  /* TI: Vref = 45 mV + code * 0.5645 mV; Vout = Vref / 0.0752.
   * Round down so quantization never exceeds the selected voltage. */
  return (uint16_t)(((uint32_t)voltage_mv * 752u - 450000u) / 5645u);
}
uint8_t pd_current_code(uint16_t current_ma) {
  /* A 10 mOhm shunt gives 0.05 A per LSB. Bit7 enables limiting. */
  return (uint8_t)(0x80u | current_ma / 50u);
}

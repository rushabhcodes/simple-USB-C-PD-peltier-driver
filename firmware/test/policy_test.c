#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "policy.h"
#include "command.h"
int main(void) {
  pd_settings s;
  pd_defaults(&s);
  assert(pd_valid(&s) && s.voltage_mv == 12000 && s.current_ma == 5500);
  assert(pd_reference_code(12000) == 1518 && pd_reference_code(15000) == 1918);
  assert(pd_current_code(5500) == 0xEE && pd_current_code(500) == 0x8A);
  assert((TPS_MODE_OFF & 0x80) == 0 && (TPS_MODE_ON & 0x80) != 0);
  assert((TPS_FATAL_STATUS & 0x40) == 0);
  for (unsigned mv = PD_MIN_MV; mv <= PD_MAX_MV; mv += 100) {
    for (unsigned ma = PD_MIN_MA; ma <= PD_MAX_MA; ma += 50) {
      pd_settings before = s;
      bool valid = (uint32_t)mv * ma <= PD_MAX_MW * 1000u;
      assert(pd_set(&s, (uint16_t)mv, (uint16_t)ma) == valid);
      if (!valid) { assert(memcmp(&s, &before, sizeof s) == 0); continue; }
      assert(pd_valid(&s));
      unsigned code = pd_reference_code(s.voltage_mv);
      assert(code <= 2047 && code * 5645 + 450000 <= mv * 752);
      assert((code + 1) * 5645 + 450000 > mv * 752);
    }
  }
  pd_command c;
  assert(pd_parse_command("SET 12000 5500", &c) && c.kind == CMD_SET && c.voltage_mv == 12000 && c.current_ma == 5500);
  assert(pd_parse_command(" \tSET\t15000 4800  ", &c));
  assert(pd_parse_command("RUN", &c) && c.kind == CMD_RUN);
  assert(pd_parse_command("STOP", &c) && c.kind == CMD_STOP);
  assert(pd_parse_command("STATUS", &c) && c.kind == CMD_STATUS);
  assert(pd_parse_command("BOOT", &c) && c.kind == CMD_BOOT);
  const char *invalid[] = {"SET 15000 6000","SET 2000 500","SET 12001 5500","SET 12000 5510",
    "SET -12000 5500","SET +12000 5500","SET 999999999999999999999 5500","SET 12000 65536",
    "SET 12000","SET 12000 5500 RUN","SET 12.0 5.5","RUNNOW","STOP 1","", "SET12000 5500"};
  for (unsigned i = 0; i < sizeof invalid / sizeof invalid[0]; ++i) assert(!pd_parse_command(invalid[i], &c));
  puts("Policy and command tests passed: bounds, quantization, atomic SET, malformed inputs.");
  return 0;
}

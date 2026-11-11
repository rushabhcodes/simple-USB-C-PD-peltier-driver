#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "profile.h"
#include "session.h"

static void rejects_atomically(const pd_profile *record) {
  pd_settings settings = {2700, 500}, before = settings;
  assert(!pd_profile_read(record, &settings));
  assert(memcmp(&settings, &before, sizeof settings) == 0);
}

static void profile_tests(void) {
  pd_settings settings = {12000, 5500}, restored = {2100, 500};
  pd_profile record;
  pd_profile_make(&record, &settings);
  /* Golden CRC generated independently by Python zlib over the wire bytes. */
  assert(sizeof record == 16 && record.crc == 0xEFE4420Bu);
  assert(pd_profile_read(&record, &restored));
  assert(restored.voltage_mv == 12000 && restored.current_ma == 5500);

  for (unsigned byte = 0; byte < sizeof record; ++byte) {
    for (unsigned bit = 0; bit < 8; ++bit) {
      pd_profile damaged = record;
      ((uint8_t *)&damaged)[byte] ^= (uint8_t)(1u << bit);
      rejects_atomically(&damaged);
    }
  }
  for (unsigned written = 0; written < sizeof record; ++written) {
    pd_profile interrupted;
    memset(&interrupted, 0xFF, sizeof interrupted);
    memcpy(&interrupted, &record, written);
    rejects_atomically(&interrupted);
  }
  /* These records have valid CRCs, but unsupported identifiers or semantics. */
  const pd_profile unsupported[] = {
    {0x50445032u, 1, 12000, 5500, 1, 0x987A90FBu},
    {0x50445031u, 2, 12000, 5500, 1, 0x616B45E8u},
    {0x50445031u, 1, 12000, 5500, 2, 0xC4C911C8u},
  };
  for (unsigned i = 0; i < sizeof unsupported / sizeof unsupported[0]; ++i)
    rejects_atomically(&unsupported[i]);
  const pd_settings invalid[] = {
    {2000, 500}, {15000, 6000}, {12000, 6050}, {2110, 500}, {12000, 501},
  };
  for (unsigned i = 0; i < sizeof invalid / sizeof invalid[0]; ++i) {
    pd_profile_make(&record, &invalid[i]);
    rejects_atomically(&record);
  }
  const pd_settings boundaries[] = {{2100, 500}, {15000, 4800}, {12000, 6000}};
  for (unsigned i = 0; i < sizeof boundaries / sizeof boundaries[0]; ++i) {
    pd_profile_make(&record, &boundaries[i]);
    assert(pd_profile_read(&record, &restored));
    assert(restored.voltage_mv == boundaries[i].voltage_mv);
    assert(restored.current_ma == boundaries[i].current_ma);
  }
}

static void session_tests(void) {
  pd_session session;
  pd_session_init(&session, false, false);
  assert(!pd_session_tick(&session, true, false, 0));
  assert(!pd_session_tick(&session, true, false, 10000));
  pd_session_init(&session, true, false);
  assert(!pd_session_tick(&session, false, true, 0));
  assert(!pd_session_tick(&session, true, true, 10));
  assert(!pd_session_tick(&session, true, true, 1009));
  assert(pd_session_tick(&session, true, true, 1010));
  assert(!pd_session_tick(&session, true, true, 100000));

  /* A short readiness interruption restarts the qualification interval. */
  pd_session_init(&session, true, false);
  assert(!pd_session_tick(&session, true, true, 0));
  assert(!pd_session_tick(&session, false, true, 900));
  assert(!pd_session_tick(&session, true, true, 950));
  assert(!pd_session_tick(&session, true, true, 1949));
  assert(pd_session_tick(&session, true, true, 1950));

  /* STOP/SET/SAVE cancellation holds within the existing PD session. */
  pd_session_cancel(&session);
  assert(!pd_session_tick(&session, true, true, 5000));
  assert(!pd_session_tick(&session, false, true, 6000));
  assert(!pd_session_tick(&session, false, true, 6499));
  assert(!pd_session_tick(&session, true, true, 6500));
  assert(!pd_session_tick(&session, true, true, 7500));
  assert(!pd_session_tick(&session, false, true, 8000));
  assert(!pd_session_tick(&session, false, true, 8999));
  assert(!session.pending);
  assert(!pd_session_tick(&session, false, true, 9000));
  assert(session.pending);
  assert(!pd_session_tick(&session, true, true, 9001));
  assert(pd_session_tick(&session, true, true, 10001));

  /* A source loss allows a later valid session; a protective fault does not. */
  pd_session_fault(&session, false);
  assert(!pd_session_tick(&session, false, true, 11000));
  assert(!pd_session_tick(&session, false, true, 12000));
  assert(!pd_session_tick(&session, true, true, 12001));
  assert(pd_session_tick(&session, true, true, 13001));
  pd_session_fault(&session, true);
  pd_session_fault(&session, false); /* Source loss cannot clear a safety latch. */
  assert(!pd_session_tick(&session, false, true, 14000));
  assert(!pd_session_tick(&session, false, true, 15000));
  assert(!pd_session_tick(&session, true, true, 15001));
  assert(!pd_session_tick(&session, true, true, 20000));
  assert(session.safety_latched && !session.pending);
  pd_session_clear(&session);
  assert(!session.safety_latched && !session.pending);
  assert(!pd_session_tick(&session, true, true, 22000));
  assert(!pd_session_tick(&session, false, true, 23000));
  assert(!pd_session_tick(&session, false, true, 24000));
  assert(!pd_session_tick(&session, true, true, 24001));
  assert(pd_session_tick(&session, true, true, 25001));
  pd_session_init(&session, true, true);
  assert(!pd_session_tick(&session, true, true, 0));
  assert(!pd_session_tick(&session, true, true, 10000));

  /* Unsigned millisecond rollover preserves both one-second boundaries. */
  uint32_t start = UINT32_MAX - 300u;
  pd_session_init(&session, true, false);
  assert(!pd_session_tick(&session, true, true, start));
  assert(!pd_session_tick(&session, true, true, start + 999u));
  assert(pd_session_tick(&session, true, true, start + 1000u));
  pd_session_init(&session, true, false);
  assert(!pd_session_tick(&session, true, true, start - 2000u));
  assert(pd_session_tick(&session, true, true, start - 1000u));
  pd_session_fault(&session, false);
  assert(!pd_session_tick(&session, false, true, start));
  assert(!pd_session_tick(&session, false, true, start + 999u));
  assert(!session.pending);
  assert(!pd_session_tick(&session, false, true, start + 1000u));
  assert(session.pending);
  assert(!pd_session_tick(&session, true, true, start + 1001u));
  assert(pd_session_tick(&session, true, true, start + 2001u));
}

int main(void) {
  profile_tests();
  session_tests();
  puts("Profile/session tests passed: corruption, bounds, session timing and safety latches.");
  return 0;
}

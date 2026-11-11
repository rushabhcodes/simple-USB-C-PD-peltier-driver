#ifndef GENERAL_PD_SESSION_H
#define GENERAL_PD_SESSION_H
#include <stdbool.h>
#include <stdint.h>
typedef struct {
  bool pending, safety_latched, ready_previous;
  uint32_t ready_since, absent_since;
} pd_session;
void pd_session_init(pd_session *session, bool has_profile, bool safety_latched);
void pd_session_cancel(pd_session *session);
void pd_session_fault(pd_session *session, bool protective);
void pd_session_clear(pd_session *session);
bool pd_session_tick(pd_session *session, bool ready, bool saved_valid, uint32_t now);
#endif

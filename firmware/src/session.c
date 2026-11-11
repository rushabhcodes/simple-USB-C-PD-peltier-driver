#include "session.h"
void pd_session_init(pd_session *s, bool has_profile, bool safety_latched) {
  *s = (pd_session){has_profile && !safety_latched, safety_latched, false, 0, 0};
}
void pd_session_cancel(pd_session *s) { s->pending = false; }
void pd_session_fault(pd_session *s, bool protective) {
  s->pending = false;
  s->safety_latched = s->safety_latched || protective;
}
void pd_session_clear(pd_session *s) { s->safety_latched = false; s->pending = false; }
bool pd_session_tick(pd_session *s, bool ready, bool saved_valid, uint32_t now) {
  if (!ready) {
    if (s->ready_previous) { s->absent_since = now; s->ready_previous = false; }
    if (!s->safety_latched && saved_valid && now - s->absent_since >= 1000u) s->pending = true;
    return false;
  }
  if (!s->ready_previous) { s->ready_since = now; s->ready_previous = true; }
  if (s->pending && !s->safety_latched && saved_valid && now - s->ready_since >= 1000u) {
    s->pending = false;
    return true;
  }
  return false;
}

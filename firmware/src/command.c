#include "command.h"
#include <string.h>

static void spaces(const char **p) { while (**p == ' ' || **p == '\t') ++*p; }
static bool integer(const char **p, uint16_t *value) {
  spaces(p);
  if (**p < '0' || **p > '9') return false;
  uint32_t number = 0;
  do {
    number = number * 10u + (unsigned)(*(*p)++ - '0');
    if (number > 65535u) return false;
  } while (**p >= '0' && **p <= '9');
  *value = (uint16_t)number;
  return true;
}
bool pd_parse_command(const char *line, pd_command *command) {
  spaces(&line);
  *command = (pd_command){CMD_INVALID, 0, 0};
  const struct { const char *name; pd_command_kind kind; } names[] = {
    {"RUN",CMD_RUN},{"STOP",CMD_STOP},{"STATUS",CMD_STATUS},{"BOOT",CMD_BOOT},{"SAVE",CMD_SAVE},{"CLEAR",CMD_CLEAR},{"HELP",CMD_HELP}
  };
  for (unsigned i = 0; i < sizeof names / sizeof names[0]; ++i) {
    size_t n = strlen(names[i].name);
    if (strncmp(line, names[i].name, n) != 0) continue;
    const char *tail = line + n; spaces(&tail);
    if (*tail) return false;
    command->kind = names[i].kind;
    return true;
  }
  if (strncmp(line, "SET", 3) != 0 || (line[3] != ' ' && line[3] != '\t')) return false;
  line += 3;
  if (!integer(&line, &command->voltage_mv) || (*line != ' ' && *line != '\t') ||
      !integer(&line, &command->current_ma)) return false;
  spaces(&line);
  if (*line) return false;
  pd_settings settings = {command->voltage_mv, command->current_ma};
  if (!pd_valid(&settings)) return false;
  command->kind = CMD_SET;
  return true;
}

#ifndef GENERAL_PD_COMMAND_H
#define GENERAL_PD_COMMAND_H
#include "policy.h"
typedef enum { CMD_INVALID, CMD_SET, CMD_RUN, CMD_STOP, CMD_STATUS, CMD_BOOT, CMD_SAVE, CMD_CLEAR, CMD_HELP } pd_command_kind;
typedef struct { pd_command_kind kind; uint16_t voltage_mv, current_ma; } pd_command;
bool pd_parse_command(const char *line, pd_command *command);
#endif

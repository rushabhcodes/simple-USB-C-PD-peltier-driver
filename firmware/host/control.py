#!/usr/bin/env python3
"""Configure the driver through its programming USB-C virtual serial port."""
import argparse
from decimal import Decimal, InvalidOperation
import json
import math
import sys
import time


def mill_units(text):
    try:
        value = Decimal(text) * 1000
        if not value.is_finite() or value != value.to_integral_value():
            raise ValueError
        return int(value)
    except (InvalidOperation, ValueError, OverflowError) as error:
        raise argparse.ArgumentTypeError("Use a finite value with at most three decimal places") from error


def configure_commands(voltage, current, run=False):
    if not 2100 <= voltage <= 15000 or voltage % 100:
        raise ValueError("Voltage must be 2.1–15 V in 0.1 V steps")
    if not 500 <= current <= 6000 or current % 50:
        raise ValueError("Current must be 0.5–6 A in 0.05 A steps")
    if voltage * current > 72_000_000:
        raise ValueError("Voltage × current must not exceed 72 W")
    result = ["STOP", f"SET {voltage} {current}", "SAVE"]
    if run:
        result.append("RUN")
    return result + ["STATUS"]


def exchange(connection, command):
    connection.write((command + "\n").encode("ascii"))
    connection.flush()
    line = connection.readline().decode("ascii", errors="replace").strip()
    if not line:
        raise RuntimeError(f"No response to {command}; check programming USB-C and firmware")
    if line.startswith("ERR"):
        raise RuntimeError(f"{command}: {line}")
    return line


def parse_status(text):
    result = json.loads(text)
    required = {"set_mv", "limit_ma", "input_mv", "saved", "boot_ready"}
    if not isinstance(result, dict) or not required <= result.keys():
        raise ValueError("The selected serial port is not a compatible PD driver")
    statuses = {"WARMUP", "CONVERTING", "OK", "MISSING", "BUS", "ROM_CRC",
                "FAMILY", "PARASITE", "CONVERSION", "CRC", "DATA", "STALE"}
    for name in ("hot", "cold"):
        temperature, valid, age, status = (result.get(name + suffix) for suffix in
                                          ("_c", "_valid", "_age_ms", "_status"))
        if valid not in (0, 1) or status not in statuses:
            raise ValueError(f"Invalid {name} probe status")
        if age is not None and (type(age) is not int or not 0 <= age <= 0xFFFFFFFF):
            raise ValueError(f"Invalid {name} probe age")
        if valid:
            if type(temperature) not in (int, float) or not math.isfinite(temperature) or not -55 <= temperature <= 125 or age is None:
                raise ValueError(f"Invalid {name} temperature")
        elif temperature is not None:
            raise ValueError(f"Invalid {name} probe must report null temperature")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="Serial port; detected automatically when exactly one driver is connected")
    commands = parser.add_subparsers(dest="action", required=True)
    configure = commands.add_parser("configure", help="Set and save an autonomous profile")
    configure.add_argument("voltage", type=mill_units, help="Volts, e.g. 12.0")
    configure.add_argument("current", type=mill_units, help="Amperes, e.g. 5.5")
    configure.add_argument("--run", action="store_true", help="Start now when PD power is qualified")
    for name in ("status", "run", "stop", "clear", "boot"):
        commands.add_parser(name)
    args = parser.parse_args()
    try:
        selected = configure_commands(args.voltage, args.current, args.run) if args.action == "configure" else [args.action.upper()]
        import serial
        from serial.tools import list_ports
        if args.port:
            port = args.port
        else:
            matches = [p.device for p in list_ports.comports() if p.vid == 0xCAFE and p.pid == 0x4001]
            if len(matches) != 1:
                raise RuntimeError("Connect one driver or select its programming port with --port")
            port = matches[0]
        with serial.Serial(port, 115200, timeout=2, write_timeout=2) as connection:
            time.sleep(0.15)  # Allow CDC line state to reach the device.
            connection.reset_input_buffer()
            identity = parse_status(exchange(connection, "STATUS"))
            if selected == ["STATUS"]:
                print(json.dumps(identity, indent=2))
                return 0
            for command in selected:
                response = exchange(connection, command)
                print(json.dumps(parse_status(response), indent=2) if response.startswith("{") else response)
        if args.action == "boot":
            print("Output disabled. The port now re-enumerates as RPI-RP2; copy general_pd.uf2 to its USB drive.")
    except (ImportError, OSError, ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

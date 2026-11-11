import unittest
import json
from control import configure_commands, mill_units, parse_status

class HostControlTests(unittest.TestCase):
    def test_decimal_exactness_and_command_order(self):
        self.assertEqual(mill_units("5.50"), 5500)
        self.assertEqual(configure_commands(mill_units("12"), mill_units("5.5")),
                         ["STOP", "SET 12000 5500", "SAVE", "STATUS"])
        self.assertEqual(configure_commands(15000, 4800, True)[-2:], ["RUN", "STATUS"])

    def test_invalid_profile_never_produces_commands(self):
        for mv, ma in ((2000, 500), (12001, 5500), (12000, 5510), (15000, 6000), (12000, 0)):
            with self.subTest(mv=mv, ma=ma), self.assertRaises(ValueError):
                configure_commands(mv, ma)
        for value in ("NaN", "Infinity", "1.0001", "bad"):
            with self.subTest(value=value), self.assertRaises(Exception):
                mill_units(value)

    def test_probe_status_validity_and_age(self):
        status = {"set_mv": 12000, "limit_ma": 5500, "input_mv": 20000, "saved": 1, "boot_ready": 1,
                  "hot_c": 25.0625, "hot_valid": 1, "hot_age_ms": 75, "hot_status": "CONVERTING",
                  "cold_c": None, "cold_valid": 0, "cold_age_ms": None, "cold_status": "MISSING"}
        self.assertEqual(parse_status(json.dumps(status)), status)
        status.update(cold_c=-10.125, cold_valid=1, cold_age_ms=0, cold_status="OK")
        self.assertEqual(parse_status(json.dumps(status))["cold_c"], -10.125)
        for changes in ({"cold_c": 126}, {"cold_c": float("nan")}, {"cold_c": "85"},
                        {"cold_valid": 0}, {"hot_age_ms": -1}, {"cold_age_ms": None},
                        {"cold_status": "unknown"}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                parse_status(json.dumps(status | changes))
        with self.assertRaises(ValueError):
            parse_status('{"set_mv":12000}')

if __name__ == "__main__":
    unittest.main()

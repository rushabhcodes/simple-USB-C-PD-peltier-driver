"""Verify the built UF2 targets RP2040 flash and cannot overwrite its profile sector."""
import struct
import sys
from pathlib import Path

path = Path(sys.argv[1])
image = path.read_bytes()
assert image and len(image) % 512 == 0, "UF2 block alignment"
count = len(image) // 512
seen = set()
for offset in range(0, len(image), 512):
    block = image[offset:offset + 512]
    first, second, flags, address, size, index, total, family = struct.unpack_from("<8I", block)
    assert (first, second, struct.unpack_from("<I", block, 508)[0]) == (0x0A324655, 0x9E5D5157, 0x0AB16F30)
    assert flags & 0x2000 and family == 0xE48BFF56, "RP2040 family ID"
    assert total == count and index not in seen and index < count, "Block sequence"
    assert 0 < size <= 476 and 0x10000000 <= address < address + size <= 0x10FFF000, "Reserved profile overlap"
    seen.add(index)
assert seen == set(range(count))
print(f"UF2 checks passed: {count} RP2040 blocks; profile sector excluded.")

"""Package the built board's Gerbers and drill files for JLCPCB CAM review."""

import argparse
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
LAYERS = {
    "F_Cu.gbr": "Peltier.GTL",
    "In1_Cu.gbr": "Peltier.G2L",
    "In2_Cu.gbr": "Peltier.G3L",
    "B_Cu.gbr": "Peltier.GBL",
    "F_Mask.gbr": "Peltier.GTS",
    "B_Mask.gbr": "Peltier.GBS",
    "Edge_Cuts.gbr": "Peltier.GKO",
    "drill-L1-L4.drl": "Peltier-PTH.XLN",
    "drill_npth.drl": "Peltier-NPTH.XLN",
}


def normalize_drill(contents, plated):
    # Excellon G85 takes the start and end on one line. A separate start
    # record can also be read as a round drill at the start of the slot.
    xy = r"X-?\d+\.\d+Y-?\d+\.\d+"
    contents = re.sub(rf"^({xy})\r?\n(G85{xy})$", r"\1\2", contents, flags=re.M)
    if re.search(r"^G85", contents, flags=re.M):
        raise ValueError("Unexpected split slot record in Excellon export")
    plating = "PLATED" if plated else "NON_PLATED"
    contents = contents.replace("M48\n", f"M48\n;TYPE={plating}\n", 1)
    return contents.replace("%\nG90\n", "G90\n%\n")


def via_fill_layer(circuit):
    arrays = json.loads((ROOT / "src/board/thermal-vias.json").read_text())
    vias = {
        (round(via["x"], 6), round(via["y"], 6)): via["hole_diameter"]
        for via in circuit if via["type"] == "pcb_via"
    }
    marks = ["G04 Epoxy fill and copper cap these vias*",
             "%FSLAX46Y46*%", "%MOMM*%", "%LPD*%", "%ADD10C,0.300000*%", "D10*"]
    for array in arrays:
        for x in array["x"]:
            for y in array["y"]:
                if vias.get((x, y)) != 0.3:
                    raise ValueError(f"Missing 0.30 mm POFV drill at ({x}, {y})")
                marks.append(f"X{round(x * 1e6)}Y{round(y * 1e6)}D03*")
    return "\n".join([*marks, "M02*", ""])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--circuit", type=Path, default=ROOT / "dist/index/circuit.json")
    parser.add_argument("--output", type=Path, default=ROOT / "dist/jlcpcb-dfm-review.zip")
    args = parser.parse_args()
    circuit_file = args.circuit.resolve(strict=True)
    output = args.output.resolve()
    if output == circuit_file:
        parser.error("The archive and the input circuit must use different paths")
    circuit_bytes = circuit_file.read_bytes()
    circuit = json.loads(circuit_bytes)
    boards = [element for element in circuit if element["type"] == "pcb_board"]
    if len(boards) != 1 or boards[0]["num_layers"] != 4:
        raise ValueError("Expected one four-layer PCB")
    if any(element["type"].endswith("_error") for element in circuit):
        raise ValueError("Resolve circuit build errors before exporting for CAM review")
    pofv = via_fill_layer(circuit)

    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent) as directory:
        snapshot = Path(directory) / "board.circuit.json"
        snapshot.write_bytes(circuit_bytes)
        raw = Path(directory) / "tscircuit.zip"
        subprocess.run(
            ["bunx", "--no-install", "tsci", "export", str(snapshot),
             "--format", "gerbers", "--output", str(raw)],
            cwd=ROOT, check=True,
        )
        packaged = Path(directory) / output.name
        with ZipFile(raw) as source, ZipFile(packaged, "w", ZIP_DEFLATED) as review:
            for original, target in LAYERS.items():
                contents = source.read(original)
                if original.endswith(".drl"):
                    drill = normalize_drill(contents.decode("ascii"), plated=original == "drill-L1-L4.drl")
                    contents = drill.encode("ascii")
                review.writestr(target, contents)
            review.writestr("Peltier-POFV.sk", pofv)
        packaged.replace(output)
    print(f"CAM review archive: {output}")


if __name__ == "__main__":
    main()

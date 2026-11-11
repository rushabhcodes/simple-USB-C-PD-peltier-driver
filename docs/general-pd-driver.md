# General USB-C PD Peltier driver

## Scope and limits

One two-wire output with adjustable constant-voltage and constant-current limits. **PD POWER** supplies the load; **USB PROGRAM** provides native USB configuration, firmware updates and logic power. There are no display, buttons or display headers. Three status LEDs and 16 bare copper debug pads support setup and development.

The bench assembly uses one Same Sky CP60440, a 40 × 40 × 4 mm TEC with 20 AWG leads. Use the initial 3.0 V / 1.0 A settings and qualify the installed heatsink and cold plate before increasing power. The CP60440 datasheet gives performance curves for heat pumped at a given hot-side temperature and temperature difference. [Assembly instructions](assembly.md) · [Same Sky CP60 datasheet](https://www.sameskydevices.com/product/resource/cp60.pdf)

| Setting | Prototype target |
| --- | --- |
| Factory defaults | 12.0 V / 5.50 A, OFF until saved or explicitly started |
| Saved profile | Starts after approximately 1 s of qualified PD input |
| Voltage ceiling | 2.1–15.0 V, 0.1 V steps |
| Current ceiling | 0.50–6.00 A, 0.05 A steps |
| Power ceiling | 72 W nominal selected V × I |
| Power input | Qualified 20 V / 5 A contract; 100 W source and 5 A e-marked cable |
| Programming input | USB 2.0 data and 5 V logic supply |
| Fan output | Fixed 12 V, 0.5 A / 6 W continuous budget; qualified PD only |
| Temperature ports | Two independent powered DS18B20 inputs on GPIO8 / GPIO9 |
| Board | 72.5 × 59 mm, nominal 1.6 mm, four layers, routed power/signals and ground pours |

Voltage is regulated **before the 10 mΩ shunt**, which drops approximately 55 mV at 5.5 A plus wiring losses. USB STATUS reports approximate voltage at the TEC terminal. The 2.1 V setting floor provides nominal margin above the converter's 2 V current-sense common-mode accuracy boundary after the shunt. Current regulation under overload can reduce output below that boundary; low-voltage accuracy and short-circuit behavior need bench validation. IC, shunt and divider tolerances remain uncalibrated.

For other modules, set ceilings within their allowed operating limits, allowing for tolerances. A two-wire Peltier provides no identity or ratings to the driver. This revision monitors both temperatures and powers a fan; it does not regulate temperature or reverse polarity.

## Power and control architecture

`100 W PD source → 5 A cable → qualified PFET path → TPS55289 CC/CV stage → 10 mΩ shunt → Peltier`

- **CYPD3177** requests MIN=MAX=20 V and COARSE=5 A/FINE=0. Two common-source AO4407A PFETs gate raw power into the qualified rail. Specify firmware 3.10D or later/date code after 2047 because [Infineon documents older minimum-voltage behavior](https://community.infineon.com/t5/Knowledge-Base-Articles/CYPD3177-EZ-PD-BCR-Device-Firmware-Updates/ta-p/251759). PD-port D+/D− are unconnected. VDDD has 1 µF and two 100 nF bypasses.
- **TPS55289** integrates its four power MOSFETs and an average-output-current loop using ISP/ISN and the shunt. MODE is grounded for I²C address 0x75. A 130 kΩ / 10 kΩ EN divider gives approximately 17.22 V UVLO; PD FAULT independently clamps EN.
- **Logic power:** LMR50410 supplies auxiliary 5 V from raw PD VBUS. TPS2116 selects the higher of that rail and programming USB 5 V, with reverse blocking between ports. Its output, `LOGIC_5V`, supplies converter VCC and the TLV75533 3.3 V regulator. Programming USB has no path to qualified PD VIN or the TEC. At qualified PD input, the auxiliary supply provides the converter's required external VCC operating voltage. Converter EN remains LOW during programming-only power.
- **USB PROGRAM:** RP2040 provides native USB CDC and ROM BOOTSEL/UF2 flashing. Both CC pins have separate 5.1 kΩ sink resistors; orientation pairs connect to USB_DP/USB_DM through USBLC6-2SC6 protection and separate 27 Ω series resistors at the MCU. The protection's VBUS bias uses local LOGIC_5V to avoid its steering diodes backfeeding the programming connector. Firmware detects that connector's VBUS separately and disconnects USB when absent. The Abracon ABM8-272-T3 12 MHz crystal uses two 15 pF loads and a 1 kΩ damping resistor. W25Q128JVSIQ supplies 16 MiB QSPI flash. These choices follow [Raspberry Pi’s hardware guide](https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf).
- **Attach capacitance:** raw PD has 7.1 µF nominal (4.7 µF USB, 2.2 µF auxiliary input and two 100 nF bypasses), or 8.52 µF with a blanket +20%. Raw PROGRAM has 1 µF. Both are below the [10 µF receptacle limit described by TI](https://www.ti.com/document-viewer/lit/html/SSZTB15/GUID-9C081873-D60C-462A-ABFB-9A4E87F564F0); downstream switched-bank inrush still needs measurement.
- **Reset safety:** an NPN clamps converter EN by default, biased from LOGIC_5V. An NMOS releases it only while MCU GPIO2 actively grants permission; its gate has a pull-down. GPIO2 is separate from the ROM USB/QSPI boot interface. MCU reset, blank firmware, lost control supply and watchdog reset remove permission.
- **Startup:** valid saved settings start after one second of qualified input. Before OE=1, firmware verifies PD, releases EN into reset-OFF state, writes and reads back voltage/current/protection registers, and checks PD again. A CRC/version-checked profile occupies the reserved final 4 KiB flash sector at XIP address 0x10FFF000, excluded by the linker; saving requires OFF and readback verification. No profile or invalid flash leaves output OFF. Unplugging USB PROGRAM does not stop an operating load.
- **Faults:** SC/OVP, ADC, measured-limit and converter-communication failures latch OFF. STOP cancels automatic start for the current PD session. Source detach stops output; after at least one second without PD, a new qualified connection can use the saved profile unless a protective fault remains latched. Explicit RUN retries all startup checks; CLEAR resets the latch while remaining OFF. [Firmware instructions](../firmware/README.md) explain watchdog/reset behavior.

Internal feedback ratio 0.0752 caps converter DAC full-scale at about 15.96 V. Software selects at most 15 V and enforces V × I ≤72 W. Allow a further 6 W for the fan plus both converters' losses and logic power under the 100 W input budget. This budget is not an independent input-current limit; the PD controller requests current but does not itself measure/enforce it.

The switching network uses approximately 395 kHz, a 4.7 µH coil, four 10 µF / 50 V input MLCCs plus 100 µF / 35 V bulk, four 22 µF / 25 V pre-shunt MLCCs, and 100 µF / 25 V post-shunt bulk. Sense filtering is 10 Ω per tap plus 220 nF differential. Compensation starts with TI EVM values of 27.4 kΩ / 4.7 nF / 100 pF. Validate these over the full range and actual capacitor DC bias. At assumed 90% efficiency, 72 W output requires 80 W before auxiliary/connector losses; continuous capability is unmeasured. Lower-power PD contracts are rejected.

## Temperature probes and fan power

The bench assembly uses two DFRobot DFR0198 DS18B20 probes. Their Ø6 × 35 mm tubes fit the bores specified in the assembly guide. [DFRobot specifications](https://wiki.dfrobot.com/dfr0198) · [Assembly instructions](assembly.md)

Both XY302V-3.5-3P terminals use **pin1=3V3/red, pin2=DATA/yellow, pin3=GND/black**. Separate 4.7 kΩ pull-ups and 100 Ω series resistors connect HOT to RP2040 GPIO8 (physical pin11) and COLD to GPIO9 (physical pin12), with local bypassing and USBLC6-2SC6 data-line protection. The selected terminal accepts 16–26 AWG wire. Use one externally powered probe per port; parasite power is unsupported. Check the wire assignments when substituting another seller's probe.

The [DS18B20 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/ds18b20.pdf) specifies the 1-Wire protocol, ROM and scratchpad CRC, and up to 750 ms conversion time. Firmware schedules conversions in the background and reports `hot_c`, `cold_c`, validity, age and status through USB. Missing or invalid probes report null values and do not block saved-profile startup. This is temperature monitoring, with no thermal cutoff or setpoint control. Other 3.3 V digital probes can use the GPIO ports with appropriate firmware; compatible I²C devices can use the existing SDA/SCL/3V3/GND debug pads. The I²C converter uses address 0x75.

A dedicated [TI LMR50410XDBVR](https://www.ti.com/lit/ds/symlink/lmr50410.pdf) buck converts qualified PD to fixed 12 V. Its 1 V feedback reference and 110 kΩ / 10 kΩ divider set nominal 12.0 V. A 33 µH coil and two 22 µF / 25 V output capacitors follow the manufacturer's 12 V reference topology. VIN and EN both use `VBUS_QUALIFIED`, so programming-only power cannot run the fan. The fan stays powered when the TEC output is stopped. The regulator is rated 1 A; the user-facing continuous fan budget is 0.5 A and is not a precision hardware current clamp.

The keyed **Molex 47053-1000** header connects **pin1=GND, pin2=12V, pin3=tach NC, pin4=PWM NC**. [Noctua's primary PC fan specification](https://noctua.at/pub/media/wysiwyg/Noctua_PWM_specifications_white_paper.pdf) identifies this header and describes compatible fans' full-speed behavior without a PWM signal. Use a 12 V fan within the continuous and startup supply ratings; 24 V fans and high-current server fans are outside this output's intended range.

The selected fan is the standard beige/brown **Noctua NF-A8 PWM 12 V** with a **0.08 A maximum** input, factory four-pin plug and 200 mm sleeved cable. It plugs into J_FAN and runs at full speed with PWM unconnected. The model shows the 81 × 81 × 27 mm frame with its anti-vibration pads attached to the inlet duct. [Noctua specifications](https://www.noctua.at/en/products/nf-a8-pwm/specifications) · [Amazon B00NEMG62M](https://www.amazon.com/dp/B00NEMG62M)

## Parts, cables and debug

| Role | Selected source |
| --- | --- |
| Peltier | [Same Sky CP60440, DigiKey 102-1678-ND](https://www.digikey.in/en/products/detail/same-sky-formerly-cui-devices/CP60440/1747370) |
| Both temperature probes | Two [DFRobot DFR0198, DigiKey 1738-1311-ND](https://www.digikey.in/en/products/detail/dfrobot/DFR0198/7597054) |
| Fan and factory cable | [Noctua NF-A8 PWM 12 V, Amazon B00NEMG62M](https://www.amazon.com/dp/B00NEMG62M); one used, 200 mm factory cable, 0.08 A maximum |
| Both probe terminals | Xinlaiya XY302V-3.5-3P, C784941; three positions, 3.5 mm pitch, 16–26 AWG |
| Fixed 12 V fan supply | TI LMR50410XDBVR, C2841056 / Sunlord SWPA8040S330MT, C83467 |
| PC fan header | Molex 47053-1000, C240840; [manufacturer drawing](https://www.molex.com/content/dam/molex/molex-dot-com/products/automated/en-us/salesdrawingpdf/470/47053/470531000_sd.pdf) |
| PD sink | CYPD3177-24LQXQT, C2952489; [Infineon datasheet](https://www.infineon.com/assets/row/public/documents/24/49/infineon-cypd3177-24lqxq-datasheet-en.pdf) |
| Both USB receptacles | GCT **USB4110-GF-A**, USB 2.0 and 5 A across VBUS. [JLCPCB C5143397](https://jlcpcb.com/partdetail/5762033-USB4110_GFA/C5143397) · [DigiKey India](https://www.digikey.in/en/products/detail/gct/USB4110-GF-A/10384548) |
| PD PFET pair | AO4407A, C16072; [AOS datasheet](https://www.aosmd.com/sites/default/files/res/datasheets/AO4407A.pdf) |
| CC/CV converter | TPS55289RYQR, C5942077; [TI datasheet](https://www.ti.com/lit/ds/symlink/tps55289.pdf), [EVM](https://www.ti.com/tool/TPS55289EVM) |
| Main inductor | Bourns SRP1265A-4R7M, C780205; [manufacturer drawing](https://www.bourns.com/docs/product-datasheets/srp1265a.pdf) |
| Current shunt | TA-I RLM25FEER010, C192580; 10 mΩ, 1%, 2 W |
| Native USB MCU | Raspberry Pi RP2040, C2040; [datasheet](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf) |
| MCU flash / crystal | Winbond W25Q128JVSIQ, C97521 / Abracon ABM8-272-T3, C20625731; [official reference design](https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf) |
| Reverse-blocking logic mux | TPS2116DRLR, C3235557; [TI datasheet](https://www.ti.com/lit/ds/symlink/tps2116.pdf) |
| USB data protection | USBLC6-2SC6, C7519; [ST datasheet](https://www.st.com/resource/en/datasheet/cd00050750.pdf) |
| Auxiliary 5 V / logic 3.3 V | LMR50410Y5FQDBVRQ1, C2871822 / TLV75533PDBVR, C404027; [buck](https://www.ti.com/lit/ds/symlink/lmr50410-q1.pdf), [LDO](https://www.ti.com/lit/ds/symlink/tlv755p.pdf) |
| Output terminal | KEFA KF301-5.0-2P, C474881; catalog 17 A, 14–22 AWG; sustained-current temperature needs qualification |
| POWER / RUN / FAULT | Yellow KT-0603Y C2287 / green KT-0603YG C2289 / red KT-0603R C2286 |
| Both USB cables | [Cable Matters 201440](https://www.cablematters.com/pc-1532-123-usb-c-20-charging-cable-with-240w-power-delivery.aspx), 1 m, 5 A, e-marked, USB 2.0 data |

The current inventory records **134 purchased placements across 55 exact JLCPCB SKUs**. The October stock snapshot predates the USB4110 swap and the C960916 capacitor. Check both added SKUs in the assembly order's current inventory. [Current parts list](component-sourcing.csv) · [October stock snapshot](jlc-stock-audit.json)

Use factory Peltier leads in the terminal; seller lengths/gauges vary. Cable extensions require their own current/temperature qualification. Both selected USB cables support data, although PD POWER uses only power/CC. The model distinguishes their roles by color and labels; these are illustrative cable shapes.

POWER indicates 3.3 V logic supply, RUN indicates enabled output and FAULT indicates a latched fault. The **16 debug pads** expose SWDIO, SWCLK, BOOTSEL, RUN/reset, 3V3, GND, raw PD, qualified PD, LOGIC5V, TEC terminal, pre-shunt output, driver EN, ISP, ISN, SCL and SDA. They are 1.5 mm copper pads, with no fitted component or JLC SKU. BOOTSEL connects to QSPI chip-select through 1 kΩ; hold it to GND during reset to enter the ROM loader without buttons. All silkscreen is intentionally omitted; identify these pads, port roles and polarity using the schematic and a separate assembly/wiring guide, not board markings.

## PCB routing and fabrication

The four-layer layout combines broad top power copper, local inner2 power areas, a whole-board inner1 ground plane and a separate inner2 ground reference beneath USB. Capacitor ground banks and nearby ground stitches connect the return copper. Separate Kelvin branches leave the inner edges of the shunt lands; power-pour notches keep load current out of those branches. USB, QSPI, clock, control, fan and sensor signals retain their original logical connections and no-connect assignments.

Physical checks inspect rendered pads, wires, plated holes, vias and pours, alongside the original electrical net partition. They cover missing connections, shorts, floating copper, clearances, minimum widths and drills; narrowly identified thermal via-in-pad exceptions require the specified fabrication process. Validation results belong to the final rendered artifact and do not substitute for electrical or thermal measurements.

Specify **JLC041621-7628**, nominal **1.6 mm**, **2 oz outer / 1 oz inner copper**, and **epoxy-filled, planarized, copper-capped POFV** for exposed-pad thermal vias. [PCB fabrication requirements](pcb-fabrication.md) contain the exact layer thicknesses, 90 Ω USB geometry, local power-width exceptions and acceptance checks. The 6 A / 72 W setting remains a design target until the assembled board is qualified at the intended ambient and airflow.

## Assembly and qualification

Open `assembly.tsx` in the tscircuit 3D view or run `bun run build:assembly` for the offline viewer. The export checks each fitted PCB component for a mesh and includes the external wiring, heatsink, cold plate, clamp, probes and fan duct. Use the [bench assembly guide](assembly.md) for the pin-by-pin wiring, purchases, machining dimensions and first power-up. [Model sources](../assets/assembly/provenance.json)

Before manufacture, review the generated copper and drill files against the [fabrication requirements](pcb-fabrication.md), including stackup, exposed-pad via treatment, power transitions and USB references. Bench-check USB enumeration/UF2/recovery; both orientations and simultaneous supplies; backfeed/inrush; saved-profile startup and corrupt/interrupted saves; PD detach/reset; current/voltage tolerances and compensation; short circuit and output-off discharge; watchdog/control-supply loss; and sustained connector/cable/board temperatures. Native tests and a firmware cross-build do not establish these measurements.

import { connectorPlacements, connectorPoint, tecPinLocal, usbFaceLocal } from "../../src/assembly/connector-placement"
import { coldProbeCable, hotProbeCable } from "../../src/assembly/models"

const wireColors: Record<string, string> = { red: "#d63832", black: "#1d2937", yellow: "#bd8700", green: "#298353", blue: "#2a67ba" }

export function assemblyWiringSvg() {
  // Top-side PCB frame, with the USB receptacles on the left.
  const sx = (x: number) => 267 + (x + 40) * 5.45
  const sy = (y: number) => 92 + (29 - y) * 5.45
  const terminal = (name: string, centerY: number, pins: { y: number; label: string; color: string }[]) =>
    '<g>' +
    '<rect class="terminal" x="626" y="' + sy(centerY + (pins.length === 3 ? 5.1 : 4.4)) + '" width="38" height="' +
    (pins.length === 3 ? 55.6 : 48) + '" rx="3"/>' +
    '<text class="port" x="610" y="' + sy(centerY) + '" text-anchor="end">' + name + '</text>' +
    pins.map(({ y, label, color }) => {
      const py = sy(y)
      return '<path d="M644 ' + py + ' H705" stroke="' + wireColors[color] + '" stroke-width="3"/>' +
        '<circle cx="644" cy="' + py + '" r="4.5" fill="' + wireColors[color] + '" stroke="white" stroke-width="1.5"/>' +
        '<text class="wire" x="717" y="' + py + '">' + label + '</text>'
    }).join("") + '</g>'

  const tecPins = (["pin1", "pin2"] as const).map((pin, i) => ({
    y: connectorPoint(connectorPlacements.J_TEC, tecPinLocal[pin])[1],
    label: i === 0 ? "1 · Red · TEC+" : "2 · Black · GND",
    color: i === 0 ? "red" : "black",
  }))
  const sensorPins = (cable: typeof hotProbeCable) => cable.conductors.map(({ boardPoint, colorName }, i) => ({
    y: boardPoint[1], color: colorName,
    label: [ "1 · Red · 3.3 V", "2 · Yellow · DATA", "3 · Black · GND" ][i]!,
  }))
  const usb = (connector: "J_USB" | "J_PROGRAM", label: string, detail: string) => {
    const y = sy(connectorPoint(connectorPlacements[connector], usbFaceLocal)[1])
    return '<path d="M215 ' + y + ' H270" stroke="#526e81" stroke-width="3"/>' +
      '<rect class="terminal" x="262" y="' + (y - 21) + '" width="45" height="42" rx="5"/>' +
      '<text class="port" x="193" y="' + (y - 9) + '" text-anchor="end">' + label + '</text>' +
      '<text class="detail" x="193" y="' + (y + 14) + '" text-anchor="end">' + detail + '</text>'
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="940" height="550" viewBox="0 0 940 550" role="img" aria-labelledby="title desc">' +
    '<title id="title">Peltier driver wiring, component-side view</title>' +
    '<desc id="desc">USB ports at left. On the right from top to bottom are TEC, HOT and COLD. ' +
    'TEC lower terminal is positive. Both sensor ports read ground, data, 3.3 volts from top to bottom.</desc>' +
    '<style>text{font-family:system-ui,sans-serif;fill:#14242d;dominant-baseline:middle}' +
    '.heading{font-size:28px;font-weight:700}.detail{font-size:14px;fill:#526570}.port{font-size:16px;font-weight:700}' +
    '.wire{font-size:15px}.terminal{fill:#e6edf0;stroke:#4a6573;stroke-width:1.5}.board{fill:#deebe7;stroke:#39615c;stroke-width:2}</style>' +
    '<rect width="940" height="550" fill="#f8faf9"/>' +
    '<text class="heading" x="37" y="39">Peltier driver wiring</text>' +
    '<text class="detail" x="37" y="68">Component side · orient the two USB-C ports to your left</text>' +
    '<rect class="board" x="' + sx(-40) + '" y="' + sy(29) + '" width="' + (sx(32.5) - sx(-40)) +
    '" height="' + (sy(-30) - sy(29)) + '" rx="4"/>' +
    '<text class="detail" x="431" y="247" text-anchor="middle">72.5 × 59 mm PCB</text>' +
    usb("J_USB", "J_USB · PD IN", "20 V / 5 A USB-C PD") +
    usb("J_PROGRAM", "J_PROGRAM", "USB data to computer") +
    terminal("J_TEC", connectorPlacements.J_TEC.pcbY, tecPins) +
    terminal("J_HOT_SENSOR", connectorPlacements.J_HOT_SENSOR.pcbY, sensorPins(hotProbeCable)) +
    terminal("J_COLD_SENSOR", connectorPlacements.J_COLD_SENSOR.pcbY, sensorPins(coldProbeCable)) +
    '<rect class="terminal" x="602" y="377" width="58" height="23" rx="3"/>' +
    '<text class="port" x="583" y="388" text-anchor="end">J_FAN</text>' +
    '<text class="wire" x="610" y="389">1 2 3 4</text>' +
    '<text class="port" x="267" y="454">J_FAN · keyed factory plug</text>' +
    '<text class="detail" x="267" y="483">Left to right · 1 black GND · 2 yellow +12 V · 3 green tach NC · 4 blue PWM NC</text>' +
    '<text class="detail" x="267" y="513">DFRobot DFR0198 probe colors shown. HOT is GP8 and COLD is GP9.</text></svg>\n'
}

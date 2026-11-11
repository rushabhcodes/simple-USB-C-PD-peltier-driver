// Shared by the real PCB and its native CAD-only accessories. Millimetres / degrees.
export const connectorPlacements = {
  J_USB: { pcbX: -33, pcbY: 10, pcbRotation: 270 },
  J_PROGRAM: { pcbX: -33, pcbY: -20, pcbRotation: 270 },
  J_TEC: { pcbX: 28.5, pcbY: 23, pcbRotation: 90 },
  J_HOT_SENSOR: { pcbX: 28.5, pcbY: 11, pcbRotation: 90 },
  J_COLD_SENSOR: { pcbX: 28.5, pcbY: -8, pcbRotation: 90 },
  J_FAN: { pcbX: 26.8, pcbY: -25, pcbRotation: 180 },
} as const

export type Point3 = [number, number, number]
export type ConnectorPlacement = { pcbX: number; pcbY: number; pcbRotation: number }

export function connectorPoint(placement: ConnectorPlacement, local: readonly [number, number, number]): Point3 {
  const angle = placement.pcbRotation * Math.PI / 180
  return [placement.pcbX + Math.cos(angle) * local[0] - Math.sin(angle) * local[1],
    placement.pcbY + Math.sin(angle) * local[0] + Math.cos(angle) * local[1], local[2]]
}

// The USB face offset is the insertion centre inferred from the exact C7095263
// imported footprint, relative to its authored placement anchor (not its pad bounds).
// Retain this face contract without silkscreen: the renderer's outline-based
// insertion inference is not reliable for the intentionally unmarked board.
export const usbFaceLocal: Point3 = [0, -7.237483112, 2.5]
// Exact C474881 / KF301 footprint pin centres. Z=6 is an illustrative wire channel.
export const tecPinLocal = { pin1: [-2.499995, 0, 6], pin2: [2.499995, 0, 6] } as const
// Exact C784941 plated-hole centres; Z=3 approximates the visible wire channel.
export const sensorPinLocal = { pin1: [-3.499993, 0, 3], pin2: [0, 0, 3], pin3: [3.499993, 0, 3] } as const
// Exact C240840 contacts/locator. Mating/contact Z is illustrative.
export const fanPinLocal = { pin1: [3.81, 0.98001455, 6.8], pin2: [1.27, 0.98001455, 6.8],
  pin3: [-1.27, 0.98001455, 6.8], pin4: [-3.81, 0.98001455, 6.8] } as const
export const fanLocatorLocal = [-1.27, -1.18000145, 0] as const

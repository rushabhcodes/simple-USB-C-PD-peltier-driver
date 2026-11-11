import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

function startViewer() {
const canvas = document.querySelector("canvas")
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor("#f3f6fa")
renderer.toneMapping = THREE.ACESFilmicToneMapping
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xffffff, 0x73808f, 1.9))
const light = new THREE.DirectionalLight(0xffffff, 2.5)
light.position.set(-70, 160, 100)
scene.add(light)
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 3000)
const picker = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let model
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
const fit = () => {
  const rect = canvas.getBoundingClientRect()
  renderer.setSize(rect.width, rect.height, false)
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
}
window.addEventListener("resize", fit)
fit()
const bytes = Uint8Array.from(atob(document.querySelector("#model").textContent.trim()), c => c.charCodeAt(0))
new GLTFLoader().parse(bytes.buffer, "", gltf => {
  scene.add(gltf.scene)
  model = gltf.scene
  const explode = document.querySelector("#explode")
  // GLB uses Y for height and reverses the PCB X axis.
  const offsets = {
    HOT_SIDE_HEATSINK: [0, 28, 0], FAN_DUCT: [0, 28, 26], FAN_DEFAULT: [0, 28, 52],
    HOT_PROBE: [-49, 28, 0], COLD_PLATE: [0, -24, 0], COLD_PROBE: [0, -24, -47],
    TEC_CLAMP: [0, -60, 0],
  }
  const stack = Object.entries(offsets).flatMap(([name, offset]) => {
    const part = model.getObjectByName(name)
    return part ? [{ part, offset: new THREE.Vector3(...offset), installed: part.position.clone() }] : []
  })
  const harness = ["TEC_POS_LEAD", "TEC_NEG_LEAD", "HOT_PROBE_CABLE", "COLD_PROBE_CABLE", "FAN_CABLE"]
    .map(name => model.getObjectByName(name)).filter(Boolean)
  explode.disabled = stack.length !== Object.keys(offsets).length
  let exploded = false
  const frame = direction => {
    const visible = exploded ? [...stack.map(item => item.part), model.getObjectByName("TEC_DEFAULT")] : [model]
    const bounds = new THREE.Box3()
    for (const part of visible.filter(Boolean)) bounds.expandByObject(part)
    const center = bounds.getCenter(new THREE.Vector3())
    const view = new THREE.Vector3(...direction).normalize()
    const right = new THREE.Vector3().crossVectors(camera.up, view).normalize()
    const up = new THREE.Vector3().crossVectors(view, right)
    const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    let distance = 0
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(center)
        distance = Math.max(distance, view.dot(point) + Math.max(Math.abs(right.dot(point)) / camera.aspect, Math.abs(up.dot(point))) / tanY)
      }
    }
    camera.position.copy(center).addScaledVector(view, distance * 1.07)
    controls.target.copy(center)
    controls.update()
  }
  const reset = () => frame(exploded ? [-0.52, 0.23, -0.82] : [-0.48, 0.83, 0.72])
  document.querySelector("#reset").onclick = reset
  document.querySelector("#top").onclick = () => frame([0, 1, 0.001])
  reset()
  explode.onclick = () => {
    exploded = !exploded
    explode.setAttribute("aria-pressed", String(exploded))
    for (const { part, offset, installed } of stack) {
      part.position.copy(installed)
      if (exploded) part.position.add(offset)
    }
    for (const wire of harness) wire.visible = !exploded
    reset()
    document.querySelector("#status").textContent = exploded ? "Stack exploded · probes withdrawn from bores" : "Installed assembly · drag to rotate"
  }
  document.querySelector("#status").textContent = "Drag to rotate · Scroll to zoom"
  document.querySelector("#fallback").style.display = "none"
}, error => { document.querySelector("#status").textContent = "3D unavailable; static assembly shown."; console.error(error) })
canvas.addEventListener("click", event => {
  if (!model) return
  const bounds = canvas.getBoundingClientRect()
  pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
  picker.setFromCamera(pointer, camera)
  const selected = picker.intersectObject(model, true)[0]
  if (selected) document.querySelector("#status").textContent = selected.object.name || selected.object.parent?.name || "Assembly component"
})
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera) })
}
try { startViewer() } catch (error) { document.querySelector("#status").textContent = "3D unavailable; static assembly shown."; console.error(error) }

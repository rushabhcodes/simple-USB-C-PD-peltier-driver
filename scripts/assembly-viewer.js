import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

function startViewer() {
const canvas = document.querySelector("canvas")
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor("#f3f6fa")
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xffffff, 0x73808f, 3))
const light = new THREE.DirectionalLight(0xffffff, 3)
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
  const bounds = new THREE.Box3().setFromObject(gltf.scene), center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3()), distance = Math.max(size.x, size.z) * 1.05
  const reset = () => { camera.position.set(center.x - distance * 0.36, distance * 0.74, center.z + distance * 0.7); controls.target.copy(center); controls.update() }
  reset()
  document.querySelector("#reset").onclick = reset
  document.querySelector("#top").onclick = () => { camera.position.set(center.x, distance * 1.1, center.z + 0.1); controls.target.copy(center); controls.update() }
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

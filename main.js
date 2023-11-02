import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// import sample from './sample.json' assert {type: 'json'}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  20
);
var bodyModel;

window.updateMorphTargets = (values) => {
  // for (let i = 0; i < values.length; i++) {
  //   bodyModel.morphTargetInfluences[ i ] = values[i];
  // }
  bodyModel.morphTargetInfluences = values;
};

window.loadModel = () => {
  const objData = JSON.stringify({
    asset: {
      generator: "Khronos glTF Blender I/O v3.6.27",
      version: "2.0",
    },
    scene: 0,
    scenes: [{ name: "Scene", nodes: [0] }],
    nodes: [{ mesh: 0, name: "Plane" }],
    meshes: [
      {
        name: "Plane",
        primitives: [{ attributes: { POSITION: 0 }, indices: 1 }],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 4,
        max: [1, 0, 1],
        min: [-1, 0, -1],
        type: "VEC3",
      },
      { bufferView: 1, componentType: 5123, count: 6, type: "SCALAR" },
    ],
    bufferViews: [
      { buffer: 0, byteLength: 48, byteOffset: 0, target: 34962 },
      { buffer: 0, byteLength: 12, byteOffset: 48, target: 34963 },
    ],
    buffers: [
      {
        byteLength: 60,
        uri: "data:application/octet-stream;base64,AACAvwAAAAAAAIA/AACAPwAAAAAAAIA/AACAvwAAAAAAAIC/AACAPwAAAAAAAIC/AAABAAMAAAADAAIA",
      },
    ],
  });

  camera.position.z = 10;
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
  scene.add(directionalLight);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 15;
  controls.addEventListener("change", render);

  window.addEventListener("resize", onWindowResize);

  const loader = new GLTFLoader();
  const onLoad = (result) => {
    result.scene.traverse((child) => {
      if (child.material) child.material.metalness = 0;
    });
    const model = result.scene.children[0];
    bodyModel = model;
    console.log(model);
    console.log(model.morphTargetDictionary);
    model.scale.set(3, 3, 3);
    model.translateZ(2.2);
    scene.add(model);
    animate();
  };

  loader.parse(objData, null, onLoad);
};

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  renderer.render(scene, camera);
}

function onWindowResize() {
  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

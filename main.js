import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import modelData from './body.json' assert {type: 'json'}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );
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

window.loadModel = (initialMorphTargets) => {
  const objData = JSON.stringify(modelData);

  camera.position.z = 10;
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  scene.add(directionalLight);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 15;
  controls.addEventListener("change", render);

  window.addEventListener("resize", onWindowResize);
  //dracoLoader loader
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/'); // use a full url path

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const onLoad = (result) => {
    result.scene.traverse((child) => {
      if (child.material) child.material.metalness = 0;
    });
    const model = result.scene.children[0];
    bodyModel = model;
    bodyModel.rotateZ(-(Math.PI / 2.5));
    console.log(model);
    console.log(model.morphTargetDictionary);
    model.scale.set(3, 3, 3);
    model.translateZ(2.2);
    if (initialMorphTargets) {
      bodyModel.morphTargetInfluences = initialMorphTargets;
    }
    
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

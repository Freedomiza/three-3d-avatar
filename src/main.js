import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import modelData from "./assets/body.json" assert { type: "json" };

import maleBody from "./assets/male-body.txt?raw";
import femaleBody from "./assets/female-body.txt?raw";

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
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

export const loadModel = (isMale, initialMorphTargets) => {
  const objData = JSON.stringify(modelData);
  camera.position.z = 10;
  // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  // scene.add(ambientLight);

  // const frontLight = new THREE.DirectionalLight(0xeeeeee, 1.5);
  // frontLight.position.set(150, 150 , 50);
  // scene.add(frontLight);

  // const rightFrontLight = new THREE.DirectionalLight(0xeeeeee, 0.5);
  // rightFrontLight.position.set(0, 150 , 0);
  // scene.add(rightFrontLight);

  // const backLight = new THREE.DirectionalLight(0xdddddd, 2);
  // backLight.position.set(-150, 150, -50);
  // scene.add(backLight);

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
  dracoLoader.setDecoderPath(
    "https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/"
  ); // use a full url path

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const onLoad = (result) => {
    // result.scene.traverse((child) => {
    //   if (child.material) {
    //     child.material.metalness = 0.4;
    //     child.material.roughness = 0.7;
    //   }
    //   // console.log(child.material);
    // });

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

    //skin
    const skinTexture = loadTextures(isMale);
    skinTexture.mapping = THREE.UVMapping;
    skinTexture.flipY = false;
    const me0 = new THREE.MeshStandardMaterial({
      // map: skinTexture
    });
    me0.emissive = new THREE.Color(0xffffff);
    me0.emissiveMap = skinTexture;
    // const geometry = new BoxBufferGeometry(2, 2, 2);
    // const material = new MeshStandardMaterial({ color: 'purple' });
    // const cube = new Mesh(geometry, material);
    model.material = me0;

    scene.add(model);
    animate();
  };

  loader.parse(objData, null, onLoad);
};

function animate() {
  requestAnimationFrame(animate);
  render();
}

export function render() {
  renderer.render(scene, camera);
}

export function onWindowResize() {
  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function createMaterials(skins) {
  var materials = [];

  for (var i = 0; i < skins.length; i++) {
    materials[i] = new THREE.MeshLambertMaterial({
      color: 0xeeeeee,
      specular: 10.0,
      map: skins[i],
      skinning: false,
      morphTargets: true,
      wrapAround: true,
    });
  }

  return materials;
}

export function loadTextures(isMale) {
  if (isMale) {
    return new THREE.TextureLoader().load(maleBody);
  }

  return new THREE.TextureLoader().load(femaleBody);
}

document.addEventListener("DOMContentLoaded", () =>
  loadModel(
    true,
    [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      0.5, 1, 0,
    ]
  )
);

// import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export class LabelModel {
  // sprite: THREE.Sprite;
  label: CSS2DObject;

  constructor(
    label: CSS2DObject
    // sprite: THREE.Sprite
  ) {
    this.label = label;
    // this.sprite = sprite;
  }
}

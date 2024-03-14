import * as THREE from "three";

import { BaseModel } from "./base-model";

export class BodyIndicator extends BaseModel {
  // _mat?: THREE.Material | THREE.Material[];

  constructor(
    public mesh: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  ) {
    super(mesh);
  }

  loadTextures = (color: number) => {
    const material = new THREE.MeshBasicMaterial({
      color: color,
      // wireframe: true,
    });

    this.mesh.material = material;
    this._mat = material;
  };
}

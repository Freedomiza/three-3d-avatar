import * as THREE from "three";
import { BaseModel } from "./base-model";
import { loadTextures } from "../model-helper";

// console.log({
//   meshBody,
// });

export enum BodyType {
  male,
  female,
  mesh,
}

export default class BodyModel extends BaseModel {
  bodyType = BodyType.male;

  // declare morphTargetDictionary?: any;

  toggleWireFrame = (value: boolean) => {
    if (this.mesh?.material) {
      const material = this.mesh?.material as THREE.MeshStandardMaterial;

      // material.wireframe = value;
      if (value) {
        const mat = loadTextures(BodyType.mesh);
        this.applySkinTexture(mat);
      } else {
        this.applySkinTexture(loadTextures(this.bodyType));
      }
      material.needsUpdate = true;
    }
  };

  setGender = (isMale: boolean) => {
    this.bodyType = isMale ? BodyType.male : BodyType.female;
    const mat = loadTextures(this.bodyType);
    this.applySkinTexture(mat);
  };

  clone: () => BodyModel = () => {
    return new BodyModel(this.mesh.clone());
  };
}

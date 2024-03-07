import * as THREE from "three";
import { BaseModel } from "./base-model";
import { LabelModel } from "./label-model";

export class AnnotationModel extends BaseModel {
  label?: LabelModel;
  constructor(
    mesh: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  ) {
    super(mesh);
  }
}

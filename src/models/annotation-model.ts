import * as THREE from "three";
import { BaseModel } from "./base-model";
import { LabelModel } from "./label-model";
import { TranslationLabel } from "./translation-label";
import { updateHTMLLabel } from "../html-helper";

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

  hideLabel = () => {
    if (this.label) {
      this.label.label.visible = false;
    }
  };

  showLabel = () => {
    if (this.label) {
      this.label.label.visible = true;
    }
  };
  showEye = () => {
    if (this.label) {
      this.label.sprite.visible = true;
    }
  };
  hideEye = () => {
    if (this.label) {
      this.label.sprite.visible = false;
    }
  };
  updateLabelContent = (data: TranslationLabel) => {
    if (this.label) {
      updateHTMLLabel(this.label.label.element, data);
    }
  };
}

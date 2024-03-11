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
      this.label.label.classList.add("hidden");
      this.label.arrowEl.classList.add("hidden");
    }
  };

  showLabel = () => {
    if (this.label) {
      this.label.label.classList.remove("hidden");
      this.label.arrowEl.classList.remove("hidden");
    }
  };
  showEye = () => {
    if (this.label) {
      this.label.eyeSprite.visible = true;
    }
  };
  hideEye = () => {
    if (this.label) {
      this.label.eyeSprite.visible = false;
    }
  };
  updateLabelContent = (data: TranslationLabel) => {
    if (this.label) {
      updateHTMLLabel(this.label.label, data);
    }
  };
}

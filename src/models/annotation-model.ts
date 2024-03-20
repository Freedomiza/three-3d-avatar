import * as THREE from "three";
import { BaseModel } from "./base-model";
import { LabelModel } from "./label-model";
import { TranslationLabel } from "./translation-label";
import { formatMeasurement, updateHTMLLabel } from "../html-helper";
// import { StaticGeometryGenerator } from "three-mesh-bvh";
import { calculateMeshPosition } from "../model-helper";
import { IMeasurementData, MetricsType } from "./base";
import { postJSMessage } from "../js-channel-helper";

export class AnnotationModel extends BaseModel {
  label?: LabelModel;
  camera: THREE.Mesh;
  target: THREE.Mesh;
  targetPosition?: THREE.Vector3;
  cameraPosition?: THREE.Vector3;
  measurement?: IMeasurementData;

  constructor(
    mesh: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >,
    cameraMesh: THREE.Mesh,
    targetMesh: THREE.Mesh
  ) {
    super(mesh);
    this.camera = cameraMesh;
    this.target = targetMesh;
  }

  remove = () => {
    this.label?.remove();
    this.camera?.remove();
    this.target?.remove();
  };

  hideLabel = () => {
    this.label?.hide();
  };

  showLabel = () => {
    this.label?.show();
  };
  showEye = () => {
    this.label?.toggleEye(true);
  };
  hideEye = () => {
    this.label?.toggleEye(false);
  };
  updateLabelContent = (data: TranslationLabel) => {
    if (this.label) {
      updateHTMLLabel(this.label.label, data);
    }
  };

  calculatePosition = (): THREE.Vector3 => {
    const globalVector = calculateMeshPosition(this.mesh);

    this.position = globalVector;
    this.mesh.visible = false;

    //* Calculate camera and target
    if (this.target) {
      this.targetPosition = calculateMeshPosition(this.target);
      this.target.visible = false;
    }
    if (this.camera) {
      this.cameraPosition = calculateMeshPosition(this.camera);
      this.camera.visible = false;
    }

    return globalVector;
  };

  applyMorph = (data: number[]): void => {
    this.mesh.morphTargetInfluences = data;
    this.mesh.geometry.computeBoundingBox();
    this.mesh.geometry.computeBoundingSphere();

    if (this.target) {
      this.target.morphTargetInfluences = data;
      this.target.geometry.computeBoundingBox();
      this.target.geometry.computeBoundingSphere();
    }
  };

  updateAnnotationOpacity = (camera: THREE.Camera, bodyDistance: number) => {
    if (!this.position) return;

    const pos = this.position;

    const spriteDistance = camera?.position.distanceTo(pos!) ?? 0;

    const spriteBehindObject = spriteDistance >= bodyDistance;

    this.label?.updateVisibility(!spriteBehindObject);
  };
  showTooltips = () => {
    console.log("show Tooltips:" + this.title);
    postJSMessage("AnnotationChannel", this.title);
  };

  updateLabelMeasurement = (measurement: IMeasurementData) => {
    this.measurement = measurement;
    const value = formatMeasurement(measurement);
    this.label?.updateValue(value);
  };

  updateMetrics = (metric: MetricsType) => {
    const newValue = formatMeasurement(this.measurement, metric);
    this.label?.updateValue(newValue);
  };
}

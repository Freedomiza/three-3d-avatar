import * as THREE from "three";

export class BaseModel {
  mesh: THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.Material | THREE.Material[],
    THREE.Object3DEventMap
  >;

  title: string;
  position?: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;

  constructor(
    mesh: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  ) {
    this.mesh = mesh;
    // this.position = this._calculatePosition(mesh);
    this.rotation = mesh.rotation;
    this.scale = mesh.scale;
    this.title = mesh.name;
  }

  applyMorph = (data: number[]): void => {
    this.mesh.morphTargetInfluences = data;
    this.mesh.geometry.computeBoundingBox();
    this.mesh.geometry.computeBoundingSphere();

    // this.position = this._calculatePosition(this.mesh);
  };
  setVisible(visible: boolean) {
    this.mesh.visible = visible;
  }

  applySkinTexture = (mat: THREE.Material | THREE.Material[]): void => {
    this.mesh.material = mat;
  };
}

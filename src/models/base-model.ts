import * as THREE from "three";
import { StaticGeometryGenerator } from "three-mesh-bvh";

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

  calculatePosition = (): THREE.Vector3 => {
    const generator = new StaticGeometryGenerator(this.mesh);
    const geometry = generator.generate();
    (geometry as any).computeBoundsTree();

    const position = geometry.attributes.position;
    const vector = new THREE.Vector3();

    vector.fromBufferAttribute(position, 0);
    const globalVector = this.mesh.localToWorld(vector);

    this.position = globalVector;
    return globalVector;
  };
}

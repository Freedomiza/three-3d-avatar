import * as THREE from "three";

declare module "three" {
  export interface BufferGeometry extends THREE.BufferGeometry {
    computeBoundsTree(): void;
    disposeBoundsTree(): void;
  }
}

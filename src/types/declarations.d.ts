declare module "*?raw" {
  const content: string;
  export default content;
}

// If in a module:
module THREE {
  export interface BufferGeometry {
    computeBoundsTree(): void;
    disposeBoundsTree(): void;
  }

  export interface Mesh {
    raycast(...args: any[]): THREE.Intersection[]; // Adjust argument types if needed
  }
}

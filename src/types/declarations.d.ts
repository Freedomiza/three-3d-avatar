declare module "*?raw" {
  const content: string;
  export default content;
}

// If in a module:
// declare module "three" {
//   module THREE {
//     export interface BufferGeometry extends THREE.BufferGeometry {
//       computeBoundsTree(): void;
//       disposeBoundsTree(): void;
//     }

//     export interface Mesh extends THREE.Mesh {
//       raycast(...args: any[]): THREE.Intersection[]; // Adjust argument types if needed
//     }
//   }
// }

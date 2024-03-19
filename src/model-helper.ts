import * as THREE from "three";
import BodyModel, { BodyType } from "./models/body-model";
import { ModelTargetMapper } from "./models/model-mapper";
import { AnnotationModel } from "./models/annotation-model";
import { BodyIndicator } from "./models/body-indicator";
import maleBody from "./assets/male-body.txt?raw";
import femaleBody from "./assets/female-body.txt?raw";
// import meshBody from "./assets/mesh-body-alpha.txt?raw";
import meshBody from "./assets/mesh-body.txt?raw";

import { LINE_COLOR } from "./config";
import {
  StaticGeometryGenerator,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import { IMeasurementData, IModelTargetMapper } from "./models/base";
//* Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
// THREE.Mesh.prototype.raycast = acceleratedRaycast;

export const filterBodyModelFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
) => {
  return new BodyModel(
    list.find((el) => el.name?.toLowerCase() == "body") as THREE.Mesh
  );
};

export type FilterAnnotationFromListResult = {
  model: THREE.Mesh;
  camera: THREE.Mesh;
  target: THREE.Mesh;
};

/*
 * return a 2 dimension list following [model, camera, target]
 */
export const filterAnnotationFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
): FilterAnnotationFromListResult[] => {
  const models = list.filter((child) =>
    child.name?.toLowerCase().endsWith("annotation")
  ) as THREE.Mesh[];

  const result: FilterAnnotationFromListResult[] = models.map((model) => {
    //*get name
    const name = model.name.toLowerCase().split("annotation")[0];

    const camera = list.find(
      (child) =>
        child.name?.toLowerCase().endsWith("camera") &&
        child.name?.toLowerCase().startsWith(name)
    ) as THREE.Mesh;

    const target = list.find(
      (child) =>
        child.name?.toLowerCase().endsWith("target") &&
        child.name?.toLowerCase().startsWith(name)
    ) as THREE.Mesh;

    return {
      camera,
      target,
      model,
    };
  });

  return result ?? [];
};

export const updateMorphTargets = (
  params: IModelTargetMapper,
  {
    bodyModel,
    annotationModels,
    indicator,
  }: {
    bodyModel?: BodyModel;
    annotationModels?: AnnotationModel[];
    indicator?: BodyIndicator;
  }
) => {
  const values = new ModelTargetMapper(params).toArray();
  // console.log("===> updateMorphTargets");
  // console.log(values.toString());
  if (values) {
    bodyModel?.applyMorph(values);
    indicator?.applyMorph(values);
    annotationModels &&
      annotationModels.forEach((el) => {
        el.applyMorph(values);
      });
  }
};

export const getAvg = (...arg: number[]): number => {
  return arg.reduce((a, b) => a + b) / arg.length;
};

export function getConfigPosition(
  position: { x: number; y: number; z: number } | undefined,
  fallbackVector: THREE.Vector3
): THREE.Vector3 {
  return position
    ? new THREE.Vector3(position.x, position.y, position.z)
    : fallbackVector;
}

export const findCameraFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
) => {
  // debugger;
  return list.find((el) => el.name?.toLowerCase() == "camera") as THREE.Mesh;
};

export const findBodyIndicatorFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
): THREE.Mesh | undefined => {
  const found = list.find((el) => el.name?.toLowerCase() == "bodyindicator");

  if (!found) {
    return undefined;
  }

  return found as THREE.Mesh;
};

export const loadTextures = (bodyType = BodyType.male): THREE.Material => {
  let skinTexture: THREE.Texture;
  console.log("Load body texture:" + bodyType);
  switch (bodyType) {
    case BodyType.male:
      skinTexture = new THREE.TextureLoader().load(maleBody);
      skinTexture.mapping = THREE.UVMapping;
      skinTexture.flipY = false;

      return new THREE.MeshStandardMaterial({
        map: skinTexture,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: skinTexture,
      });

    case BodyType.female:
      skinTexture = new THREE.TextureLoader().load(femaleBody);
      skinTexture.mapping = THREE.UVMapping;
      skinTexture.flipY = false;

      return new THREE.MeshStandardMaterial({
        map: skinTexture,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: skinTexture,
      });

    default:
      skinTexture = new THREE.TextureLoader().load(meshBody);
      skinTexture.mapping = THREE.UVMapping;
      skinTexture.flipY = false;

      return new THREE.MeshLambertMaterial({
        transparent: true,
        alphaTest: 0.1,
        emissive: 0xffffff,
        emissiveMap: skinTexture,
        alphaMap: skinTexture,
        color: LINE_COLOR,
      });
  }
};

export const calculateMeshPosition = (obj: THREE.Mesh) => {
  const generator = new StaticGeometryGenerator(obj);
  const geometry = generator.generate();
  (geometry as any).computeBoundsTree();

  const position = geometry.attributes.position;
  const vector = new THREE.Vector3();

  vector.fromBufferAttribute(position, 0);
  const globalVector = obj.localToWorld(vector);
  return globalVector;
};

export function findMeasurementByTitle(
  measurementData: IMeasurementData[],
  title: string
) {
  const matchStr = title?.toLowerCase().split("annotation")?.[0] ?? title;
  if (matchStr) {
    // console.log(matchStr);
    return measurementData.find((el) =>
      el.name?.toLowerCase()?.startsWith(matchStr)
    );
  }
}

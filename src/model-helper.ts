import * as THREE from "three";
import BodyModel from "./models/body-model";
import { IModelTargetMapper, ModelTargetMapper } from "./models/model-mapper";
import { AnnotationModel } from "./models/annotation-model";

export const filterBodyModelFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
) => {
  return new BodyModel(list.find((el) => el.name === "body") as THREE.Mesh);
};

export const filterAnnotationFromList = (
  list: THREE.Object3D<THREE.Object3DEventMap>[]
) => {
  const models = list.filter((child) => child.name !== "body") as THREE.Mesh[];
  return models;
};

export const updateMorphTargets = (
  params: IModelTargetMapper,
  {
    bodyModel,
    annotationModels,
  }: {
    bodyModel?: BodyModel;
    annotationModels?: AnnotationModel[];
  }
) => {
  const values = new ModelTargetMapper(params).toArray();
  if (bodyModel && values) {
    bodyModel.applyMorph(values);
    annotationModels &&
      annotationModels.forEach((el) => {
        el.applyMorph(values);
      });
  }
};

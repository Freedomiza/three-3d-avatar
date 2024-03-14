import * as THREE from "three";
import { BaseModel } from "./base-model";
import { loadTextures } from "../model-helper";

// console.log({
//   meshBody,
// });

export enum BodyType {
  male,
  female,
  mesh,
}

export default class BodyModel extends BaseModel {
  bodyType: BodyType = BodyType.male;

  declare morphTargetDictionary?: BodyMeasurementIndices;

  toggleWireFrame = (value: boolean) => {
    if (this.mesh?.material) {
      const material = this.mesh?.material as THREE.MeshStandardMaterial;

      // material.wireframe = value;
      if (value) {
        const mat = loadTextures(BodyType.mesh);
        this.applySkinTexture(mat);
      } else {
        this.applySkinTexture(loadTextures(this.bodyType));
      }
      material.needsUpdate = true;
    }
  };

  setGender = (isMale: boolean) => {
    this.bodyType = isMale ? BodyType.male : BodyType.female;
    const mat = loadTextures(this.bodyType);
    this.applySkinTexture(mat);
  };

  clone: () => BodyModel = () => {
    return new BodyModel(this.mesh.clone());
  };
}

enum MeasurementKeys {
  Muscular = "muscular",
  BodyFat = "bodyFat",
  Skinny = "skinny",
  NeckGirth = "neckGirth",
  BaseNeckGirth = "baseNeckGirth",
  AcrossBackShoulderWidth = "acrossBackShoulderWidth",
  BreastSize = "BreastSize",
  UnderBustGirth = "underBustGirth",
  WaistGirth = "waistGirth",
  BellyWaistGirth = "bellyWaistGirth",
  TopHipGirth = "topHipGirth",
  HipGirth = "hipGirth",
  ThighGirthR = "thighGirthR",
  MidThighGirthR = "midThighGirthR",
  KneeGirthR = "kneeGirthR",
  CalfGirthR = "calfGirthR",
  UpperArmGirthR = "upperArmGirthR",
  ForearmGirthR = "forearmGirthR",
  WristGirthR = "wristGirthR",
  ShoulderToElbowR = "shoulderToElbowR",
  ForearmLength = "forearmLength",
  TopToBackNeck = "topToBackNeck",
  BackNeckToBust = "backNeckToBust",
  BustToWaist = "bustToWaist",
  WaistToBellyWaist = "waistToBellyWaist",
  BellyWaistToTopHip = "bellyWaistToTopHip",
  TopHiptoHip = "topHiptoHip",
  HipToInsideLeg = "hipToInsideLeg",
  InsideLegToKnee = "insideLegToKnee",
  KneeHeight = "kneeHeight",
  OuterAnkleHeightR = "outerAnkleHeightR",
  Male = "male",
  Female = "female",
  TopHipIndicatorDisable = "topHipIndicatorDisable",
  WaistIndicatorDisable = "waistIndicatorDisable",
  AcrossBackShoulderWidthIndicatorDisable = "acrossBackShoulderWidthIndicatorDisable",
}

export type BodyMeasurementIndices =
  | {
      [key in MeasurementKeys]: number;
    }
  | {
      [key: string]: number;
    };

import * as THREE from "three";
import { BaseModel } from "./base-model";
import maleBody from "../assets/male-body.txt?raw";
import femaleBody from "../assets/female-body.txt?raw";

export default class BodyModel extends BaseModel {
  declare morphTargetDictionary?: BodyMeasurementIndices;

  toggleWireFrame = (value: boolean) => {
    if (this.mesh?.material) {
      (this.mesh?.material as THREE.MeshStandardMaterial).wireframe = value;
      (this.mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }
  };

  loadTextures = (isMale: boolean): THREE.MeshStandardMaterial => {
    let skinTexture: THREE.Texture;
    if (isMale) {
      skinTexture = new THREE.TextureLoader().load(maleBody);
    } else {
      skinTexture = new THREE.TextureLoader().load(femaleBody);
    }

    skinTexture.mapping = THREE.UVMapping;
    // skinTexture.flipY = false;
    const me0 = new THREE.MeshStandardMaterial({
      map: skinTexture,
      // wireframe: true,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: skinTexture,
    });

    return me0;
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

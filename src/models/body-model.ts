import * as THREE from "three";
import { BaseModel } from "./base-model";

export default class BodyModel extends BaseModel {
  declare morphTargetDictionary?: BodyMeasurementIndices;
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

export interface IModelTargetMapper {
  muscular: number;
  bodyFat: number;
  skinny: number;
  neckGirth: number;
  neckBaseGirth: number;

  acrossBackShoulderWidth: number;
  breastSize: number;
  underBustGirth: number;
  waistGirth: number;
  bellyWaistGirth: number;
  topHipGirth: number;
  hipGirth: number;
  thighGirthR: number;
  midThighGirthR: number;
  kneeGirthR: number;
  calfGirthR: number;
  upperArmGirthR: number;
  forearmGirthR: number;
  wristGirthR: number;
  shoulderToElbowR: number;
  forearmLength: number;
  topToBackNeck: number;
  backNeckToBust: number;
  bustToWaist: number;
  waistToBellyWaist: number;
  bellyWaistToTopHip: number;
  topHipToHip: number;
  hipToInsideLeg: number;
  insideLegToKnee: number;
  kneeHeight: number;
  outerAnkleHeightR: number;
  male: number;
  female: number;

  neckIndicatorDisable: number;
  shoulderIndicatorDisable: number;
  backLengthIndicatorDisable: number;
  bustIndicatorDisable: number;
  underBustIndicatorDisable: number;
  waistIndicatorDisable: number;
  hipIndicatorDisable: number;
  thighIndicatorDisable: number;
  calfIndicatorDisable: number;
  upperArmIndicatorDisable: number;
  foreArmIndicatorDisable: number;
  outerArmLengthIndicatorDisable: number;
  sleeveLengthIndicatorDisable: number;
  insideLegHeightIndicatorDisable: number;
  outsideLegHeightIndicatorDisable: number;
  backNeckHeightIndicatorDisable: number;
}

export interface IMeasurementData {
  name: string;
  unit: string;
  value: number;
}

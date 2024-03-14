export interface IModelTargetMapper {
  muscular: number;
  bodyFat: number;
  skinny: number;
  neckGirth: number;
  baseNeckGirth: number;
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

  //* for initial camera purpose
  heightInM: number;
}

export class ModelTargetMapper implements IModelTargetMapper {
  muscular: number = 0;
  bodyFat: number = 0;
  skinny: number = 0;
  neckGirth: number = 0;
  baseNeckGirth: number = 0;
  acrossBackShoulderWidth: number = 0;
  breastSize: number = 0;
  underBustGirth: number = 0;
  waistGirth: number = 0;
  bellyWaistGirth: number = 0;
  topHipGirth: number = 0;
  hipGirth: number = 0;
  thighGirthR: number = 0;
  midThighGirthR: number = 0;
  kneeGirthR: number = 0;
  calfGirthR: number = 0;
  upperArmGirthR: number = 0;
  forearmGirthR: number = 0;
  wristGirthR: number = 0;
  shoulderToElbowR: number = 0;
  forearmLength: number = 0;
  topToBackNeck: number = 0;
  backNeckToBust: number = 0;
  bustToWaist: number = 0;
  waistToBellyWaist: number = 0;
  bellyWaistToTopHip: number = 0;
  topHipToHip: number = 0;
  hipToInsideLeg: number = 0;
  insideLegToKnee: number = 0;
  kneeHeight: number = 0;
  outerAnkleHeightR: number = 0;
  male: number = 0;
  female: number = 0;

  neckIndicatorDisable: number = 0;
  shoulderIndicatorDisable: number = 0;
  backLengthIndicatorDisable: number = 0;
  bustIndicatorDisable: number = 0;
  underBustIndicatorDisable: number = 0;
  waistIndicatorDisable: number = 0;
  hipIndicatorDisable: number = 0;
  thighIndicatorDisable: number = 0;
  calfIndicatorDisable: number = 0;
  upperArmIndicatorDisable: number = 0;
  foreArmIndicatorDisable: number = 0;
  outerArmLengthIndicatorDisable: number = 0;
  sleeveLengthIndicatorDisable: number = 0;
  insideLegHeightIndicatorDisable: number = 0;
  outsideLegHeightIndicatorDisable: number = 0;
  backNeckHeightIndicatorDisable: number = 0;

  heightInM: number = 0;

  constructor(data: IModelTargetMapper) {
    Object.assign(this, data);
  }

  toArray(): number[] {
    return [
      this.muscular,
      this.bodyFat,
      this.skinny,
      this.neckGirth,
      this.baseNeckGirth,
      this.acrossBackShoulderWidth,
      this.breastSize,
      this.underBustGirth,
      this.waistGirth,
      this.bellyWaistGirth,
      this.topHipGirth,
      this.hipGirth,
      this.thighGirthR,
      this.midThighGirthR,
      this.kneeGirthR,
      this.calfGirthR,
      this.upperArmGirthR,
      this.forearmGirthR,
      this.wristGirthR,
      this.shoulderToElbowR,
      this.forearmLength,
      this.topToBackNeck,
      this.backNeckToBust,
      this.bustToWaist,
      this.waistToBellyWaist,
      this.bellyWaistToTopHip,
      this.topHipToHip,
      this.hipToInsideLeg,
      this.insideLegToKnee,
      this.kneeHeight,
      this.outerAnkleHeightR,
      this.male,
      this.female,
      this.neckIndicatorDisable,
      this.shoulderIndicatorDisable,
      this.backLengthIndicatorDisable,
      this.bustIndicatorDisable,
      this.underBustIndicatorDisable,
      this.waistIndicatorDisable,
      this.hipIndicatorDisable,
      this.thighIndicatorDisable,
      this.calfIndicatorDisable,
      this.upperArmIndicatorDisable,
      this.foreArmIndicatorDisable,
      this.outerArmLengthIndicatorDisable,
      this.sleeveLengthIndicatorDisable,
      this.insideLegHeightIndicatorDisable,
      this.outsideLegHeightIndicatorDisable,
      this.backNeckHeightIndicatorDisable,
    ];
  }
}

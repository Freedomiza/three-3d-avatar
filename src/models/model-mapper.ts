import { IModelTargetMapper } from "./base";

export class ModelTargetMapper implements IModelTargetMapper {
  muscular: number = 0;
  bodyFat: number = 0;
  skinny: number = 0;
  neckGirth: number = 0;
  neckBaseGirth: number = 0;
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

  constructor(data: IModelTargetMapper) {
    this.muscular = data.muscular;
    this.bodyFat = data.bodyFat;
    this.skinny = data.skinny;
    this.neckGirth = data.neckGirth;
    this.neckBaseGirth = data.neckBaseGirth;
    this.acrossBackShoulderWidth = data.acrossBackShoulderWidth;
    this.breastSize = data.breastSize;
    this.underBustGirth = data.underBustGirth;
    this.waistGirth = data.waistGirth;
    this.bellyWaistGirth = data.bellyWaistGirth;
    this.topHipGirth = data.topHipGirth;
    this.hipGirth = data.hipGirth;
    this.thighGirthR = data.thighGirthR;
    this.midThighGirthR = data.midThighGirthR;
    this.kneeGirthR = data.kneeGirthR;
    this.calfGirthR = data.calfGirthR;
    this.upperArmGirthR = data.upperArmGirthR;
    this.forearmGirthR = data.forearmGirthR;
    this.wristGirthR = data.wristGirthR;
    this.shoulderToElbowR = data.shoulderToElbowR;
    this.forearmLength = data.forearmLength;
    this.topToBackNeck = data.topToBackNeck;
    this.backNeckToBust = data.backNeckToBust;
    this.bustToWaist = data.bustToWaist;
    this.waistToBellyWaist = data.waistToBellyWaist;
    this.bellyWaistToTopHip = data.bellyWaistToTopHip;
    this.topHipToHip = data.topHipToHip;
    this.hipToInsideLeg = data.hipToInsideLeg;
    this.insideLegToKnee = data.insideLegToKnee;
    this.kneeHeight = data.kneeHeight;
    this.outerAnkleHeightR = data.outerAnkleHeightR;
    this.male = data.male;
    this.female = data.female;

    this.neckIndicatorDisable = data.neckIndicatorDisable;
    this.shoulderIndicatorDisable = data.shoulderIndicatorDisable;
    this.backLengthIndicatorDisable = data.backLengthIndicatorDisable;
    this.bustIndicatorDisable = data.bustIndicatorDisable;
    this.underBustIndicatorDisable = data.underBustIndicatorDisable;
    this.waistIndicatorDisable = data.waistIndicatorDisable;
    this.hipIndicatorDisable = data.hipIndicatorDisable;
    this.thighIndicatorDisable = data.thighIndicatorDisable;
    this.calfIndicatorDisable = data.calfIndicatorDisable;
    this.upperArmIndicatorDisable = data.upperArmIndicatorDisable;
    this.foreArmIndicatorDisable = data.foreArmIndicatorDisable;
    this.outerArmLengthIndicatorDisable = data.outerArmLengthIndicatorDisable;
    this.sleeveLengthIndicatorDisable = data.sleeveLengthIndicatorDisable;
    this.insideLegHeightIndicatorDisable = data.insideLegHeightIndicatorDisable;
    this.outsideLegHeightIndicatorDisable =
      data.outsideLegHeightIndicatorDisable;
    this.backNeckHeightIndicatorDisable = data.backNeckHeightIndicatorDisable;
  }

  toArray(): number[] {
    return [
      this.muscular,
      this.bodyFat,
      this.skinny,
      this.neckGirth,
      this.neckBaseGirth,
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

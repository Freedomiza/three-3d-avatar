import modelData from "./assets/body-annotation-2.json" assert { type: "json" };

import { ThreeJSHelper } from "./three-helper.ts";
const threeHelper = new ThreeJSHelper(document);

document.addEventListener(
  "DOMContentLoaded",
  () => {
    threeHelper.loadModel(
      true,
      {
        muscular: 0.5,
        bodyFat: 0.5,
        skinny: 0.5,
        neckGirth: 0.5,
        baseNeckGirth: 0.5,
        acrossBackShoulderWidth: 0.5,
        breastSize: 0.5,
        underBustGirth: 0.5,
        waistGirth: 0.5,
        bellyWaistGirth: 0.5,
        topHipGirth: 0.5,
        hipGirth: 0.5,
        thighGirthR: 0.5,
        midThighGirthR: 0.5,
        kneeGirthR: 0.5,
        calfGirthR: 0.5,
        upperArmGirthR: 0.5,
        forearmGirthR: 0.5,
        wristGirthR: 0.5,
        shoulderToElbowR: 0.5,
        forearmLength: 0.5,
        topToBackNeck: 0.5,
        backNeckToBust: 0.5,
        bustToWaist: 0.5,
        waistToBellyWaist: 0.5,
        bellyWaistToTopHip: 0.5,
        topHiptoHip: 0.5,
        hipToInsideLeg: 0.5,
        insideLegToKnee: 2,
        kneeHeight: 2,
        outerAnkleHeightR: 1,
        male: 1,
        female: 0,
        topHipIndicatorDisable: 0,
        waistIndicatorDisable: 0,
        acrossBackShoulderWidthIndicatorDisable: 0,
      },
      modelData
    );
    window.addEventListener("resize", threeHelper.onWindowResize);
  }
  // [
  //   0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
  //   0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1,
  //   0.5, 1, 0,
  //   // Optional render dot
  //   0, 0, 0,
  // ]
);

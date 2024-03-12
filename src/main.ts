import modelData from "./assets/body-annotation.json?raw";
import "./assets/style.scss";
import { IModelTargetMapper } from "./models/model-mapper";
import { ThreeJSHelper } from "./three-helper";
import { DualModelHelper } from "./dual-model-helper";

document.addEventListener("DOMContentLoaded", async () => {
  const singleView: ThreeJSHelper = new ThreeJSHelper();
  const dualView: DualModelHelper = new DualModelHelper();

  const onLoadModelCompeted = () => {
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler("onModelLoaded");
    }
  };
  const onLoadModelError = (error: Error) => {
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler("onModelError", error);
    }
  };

  window.addEventListener("resize", singleView.onWindowResize);

  window.loadDualModel = async (isMale, param1, param2) => {
    await dualView.init(document);
    dualView.loadDualModel(
      isMale,
      param1,
      param2,
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };
  window.loadModel = async (isMale: boolean, params: IModelTargetMapper) => {
    await singleView.init(document);
    singleView.loadModel(
      isMale,
      params,
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };
  const resetAll = () => {
    singleView.unloadModel();
    dualView.unloadModel();
  };
  const loadDualDummyModel = async () => {
    resetAll();
    await dualView.init(document);
    const param1 = {
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
      insideLegToKnee: 1,
      kneeHeight: 1,
      outerAnkleHeightR: 1,
      male: 1,
      female: 0,
      topHipIndicatorDisable: 0,
      waistIndicatorDisable: 0,
      acrossBackShoulderWidthIndicatorDisable: 0,
      heightInM: 1.7,
    };
    const param2 = structuredClone(param1);
    param2.kneeHeight = 1;
    param2.insideLegToKnee = 2;
    dualView.loadDualModel(true, param1, param2, modelData);
  };

  const loadDummyModel = async () => {
    resetAll();
    await await singleView.init(document);
    singleView.loadModel(
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
        insideLegToKnee: 1,
        kneeHeight: 1,
        outerAnkleHeightR: 1,
        male: 1,
        female: 0,
        topHipIndicatorDisable: 0,
        waistIndicatorDisable: 0,
        acrossBackShoulderWidthIndicatorDisable: 0,
        heightInM: 1.7,
      },
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };

  if (window.flutter_inappwebview) {
    window.flutter_inappwebview.callHandler("onReady");
  }

  if (window.FlutterChannelReady) {
    window.FlutterChannelReady.postMessage("Hello from JavaScript!");
  }

  // loadDummyModel();

  // loadDualDummyModel();

  // window.loadDummyModel = loadDummyModel;
  // window.loadDualDummyModel = loadDualDummyModel;

  // window.updateMorphTargets = threeHelper.updateMorphTargets;

  // window.hideAllLabels = threeHelper.hideAllLabels;

  // window.showAllLabels = threeHelper.showAllLabels;

  // window.resetView = threeHelper.resetView;

  // window.showWireFrame = threeHelper.showWireFrame;
  // window.hideWireFrame = threeHelper.hideWireFrame;

  // window.moveCamera = (pos: IPosition, target: IPosition) => {
  //   threeHelper.moveCamera(
  //     new THREE.Vector3(pos.x, pos.y, pos.z),
  //     new THREE.Vector3(target.x, target.y, target.z)
  //   );
  // };

  window.singleView = singleView;
  window.dualView = dualView;
});

declare global {
  interface IPosition {
    x: number;
    y: number;
    z: number;
  }
  interface Window {
    flutter_inappwebview: any;
    loadModel: (isMale: boolean, params: IModelTargetMapper) => void;
    loadDualModel: (
      isMale: boolean,
      params1: IModelTargetMapper,
      params2: IModelTargetMapper
    ) => void;
    FlutterChannelReady: any;
    singleView: ThreeJSHelper;
    dualView: DualModelHelper;
    loadDummyModel: () => void;
    loadDualDummyModel: () => void;
  }
}

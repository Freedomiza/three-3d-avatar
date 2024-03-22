import modelData from "./assets/avatar.json?raw";
import "./assets/style.scss";
import {
  IMeasurementData,
  IModelTargetMapper,
  ITimelineData,
  MetricsType,
} from "./models/base";
import { DualModelHelper } from "./dual-model-helper";
import { ThreeJSHelper } from "./three-helper";
import testParams from "./assets/test-params.json";
import testMeasurementData from "./assets/test-measurement.json";
import { callFlutterHandler, postJSMessage } from "./js-channel-helper";
import { isInApp } from "./html-helper";
import { initConfig, updateTranslation } from "./model-helper";
import { AnnotationConfig } from "./models/annotation-config";

document.addEventListener("DOMContentLoaded", async () => {
  initConfig();
  const singleView: ThreeJSHelper = new ThreeJSHelper();
  const dualView: DualModelHelper = new DualModelHelper();

  const onLoadModelCompeted = () => {
    callFlutterHandler("onModelLoaded");
  };
  const onLoadModelError = (error: Error) => {
    callFlutterHandler("onModelError", error);
  };

  window.addEventListener("resize", singleView.onWindowResize);

  window.loadDualModel = async (isMale, param1, param2) => {
    await dualView.init(document);
    setTimeout(() => {
      dualView.loadDualModel(
        isMale,
        param1,
        param2,
        modelData,
        onLoadModelCompeted,
        onLoadModelError
      );
    }, 200);
  };

  window.loadModel = async (
    isMale: boolean,
    params: IModelTargetMapper,
    rawData: IMeasurementData[]
  ) => {
    // debugger;
    const baseParams = {
      neckIndicatorDisable: 1,
      shoulderIndicatorDisable: 1,
      backLengthIndicatorDisable: 1,
      bustIndicatorDisable: 1,
      underBustIndicatorDisable: 1,
      topHipIndicatorDisable: 1,
      waistIndicatorDisable: 1,
      hipIndicatorDisable: 1,
      thighIndicatorDisable: 1,
      calfIndicatorDisable: 1,
      upperArmIndicatorDisable: 1,
      foreArmIndicatorDisable: 1,
      outerArmLengthIndicatorDisable: 1,
      sleeveLengthIndicatorDisable: 1,
      insideLegHeightIndicatorDisable: 1,
      outsideLegHeightIndicatorDisable: 1,
      backNeckHeightIndicatorDisable: 1,
    };
    await singleView.init(document);
    // console.log({
    //   rawData,
    // });
    const request = {
      ...baseParams,
      ...params,
    };
    // console.log({ request });

    singleView.loadModel(
      isMale,
      // height,
      request,
      rawData,
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };

  window.updateMorphTargets = async (
    param: IModelTargetMapper,
    measurement: IMeasurementData[]
  ) => {
    singleView.updateMorphTargets(param, measurement);
  };

  window.updateMetrics = (metrics) => {
    singleView.updateMetrics(metrics);
  };

  window.updateTranslation = async (translation: Record<string, string>) => {
    updateTranslation(translation);

    singleView.updateUI();
  };

  const resetAll = () => {
    singleView.unloadModel();
    dualView.unloadModel();
  };

  const loadDualDummyModel = async () => {
    resetAll();
    await dualView.init(document);
    const param1 = structuredClone(testParams);
    const param2 = structuredClone(param1);
    param2.kneeHeight = 1;
    param2.insideLegToKnee = 2;
    dualView.loadDualModel(true, param1, param2, modelData);
  };

  const loadDummyModel = async () => {
    resetAll();
    await singleView.init(document);
    singleView.loadModel(
      false,
      // 1700,
      testParams,
      testMeasurementData,
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };

  if (window.flutter_inappwebview) {
    window.flutter_inappwebview.callHandler("onReady");
    console.log("DOM ready");
  }

  if (window.FlutterChannelReady) {
    console.log("FlutterChannelReady ready");
    postJSMessage("FlutterChannelReady", "Hello from JavaScript!");
    // window.FlutterChannelReady.postMessage("Hello from JavaScript!");
  }

  window.loadDummyModel = loadDummyModel;
  window.loadDualDummyModel = loadDualDummyModel;
  window.singleView = singleView;
  window.dualView = dualView;
  window.resetAll = resetAll;

  function applyRandomVariation(currentValue: number) {
    const randomMultiplier = 0.9 + Math.random() * 0.2; // Between 0.9 and 1.1
    const newVal = currentValue * randomMultiplier;
    return newVal > 1 ? 1 : newVal;
  }

  const generateDummyTimeline = () => {
    const timeline: ITimelineData[] = [];
    for (var i = 0; i < 10; i++) {
      const newMeasurement = {
        muscular: applyRandomVariation(testParams.muscular),
        bodyFat: applyRandomVariation(testParams.bodyFat),
        skinny: 0.0,
        neckGirth: applyRandomVariation(testParams.neckGirth),
        neckBaseGirth: applyRandomVariation(testParams.neckBaseGirth),
        acrossBackShoulderWidth: applyRandomVariation(
          testParams.acrossBackShoulderWidth
        ),
        breastSize: applyRandomVariation(testParams.breastSize),
        underBustGirth: applyRandomVariation(testParams.underBustGirth),
        waistGirth: applyRandomVariation(testParams.waistGirth),
        bellyWaistGirth: applyRandomVariation(testParams.bellyWaistGirth),
        topHipGirth: applyRandomVariation(testParams.topHipGirth),
        hipGirth: applyRandomVariation(testParams.hipGirth),
        thighGirthR: applyRandomVariation(testParams.thighGirthR),
        midThighGirthR: applyRandomVariation(testParams.midThighGirthR),
        kneeGirthR: applyRandomVariation(testParams.kneeGirthR),
        calfGirthR: applyRandomVariation(testParams.calfGirthR),
        upperArmGirthR: applyRandomVariation(testParams.upperArmGirthR),
        forearmGirthR: applyRandomVariation(testParams.forearmGirthR),
        wristGirthR: applyRandomVariation(testParams.wristGirthR),
        shoulderToElbowR: applyRandomVariation(testParams.shoulderToElbowR),
        forearmLength: applyRandomVariation(testParams.forearmLength),
        topToBackNeck: applyRandomVariation(testParams.topToBackNeck),
        backNeckToBust: applyRandomVariation(testParams.backNeckToBust),
        bustToWaist: applyRandomVariation(testParams.bustToWaist),
        waistToBellyWaist: applyRandomVariation(testParams.waistToBellyWaist),
        bellyWaistToTopHip: applyRandomVariation(testParams.bellyWaistToTopHip),
        topHipToHip: applyRandomVariation(testParams.topHipToHip),
        hipToInsideLeg: applyRandomVariation(testParams.hipToInsideLeg),
        insideLegToKnee: applyRandomVariation(testParams.insideLegToKnee),
        kneeHeight: applyRandomVariation(testParams.kneeHeight),
        outerAnkleHeightR: applyRandomVariation(testParams.outerAnkleHeightR),

        male: 1,
        female: 0,

        neckIndicatorDisable: 1,
        shoulderIndicatorDisable: 1,
        backLengthIndicatorDisable: 1,
        bustIndicatorDisable: 1,
        underBustIndicatorDisable: 1,
        topHipIndicatorDisable: 1,
        waistIndicatorDisable: 1,
        hipIndicatorDisable: 1,
        thighIndicatorDisable: 1,
        calfIndicatorDisable: 1,
        upperArmIndicatorDisable: 1,
        foreArmIndicatorDisable: 1,
        outerArmLengthIndicatorDisable: 1,
        sleeveLengthIndicatorDisable: 1,
        insideLegHeightIndicatorDisable: 1,
        outsideLegHeightIndicatorDisable: 1,
        backNeckHeightIndicatorDisable: 1,
      };

      timeline.push({
        date: 10000 + i * 1000,
        measurements: newMeasurement,
      });
    }

    return timeline;
  };

  window.playDummyTimeline = () => {
    const timeline = generateDummyTimeline();
    return singleView.playTimeline(timeline, 10);
  };

  // window.playTimeLine = (timeline: ITimelineData[], duration: number = 10) => {
  //   return singleView.playTimeline(timeline, duration);
  // };

  // window.pauseTimeLine = () => {
  //   singleView.pauseTimeLine();
  // };

  if (isInApp()) {
    console.log("is in app");
  } else {
    loadDummyModel();
    // loadDualDummyModel();
  }
});

declare global {
  interface IPosition {
    x: number;
    y: number;
    z: number;
  }
  interface Window {
    loadModel: (
      isMale: boolean,
      params: IModelTargetMapper,
      rawData: IMeasurementData[]
    ) => void;
    updateMorphTargets: (
      param: IModelTargetMapper,
      measurement: IMeasurementData[]
    ) => void;
    resetAll: () => void;
    loadDualModel: (
      isMale: boolean,
      params1: IModelTargetMapper,
      params2: IModelTargetMapper
    ) => void;
    singleView: ThreeJSHelper;
    dualView: DualModelHelper;
    loadDummyModel: () => void;
    loadDualDummyModel: () => void;
    updateMetrics: (metric: MetricsType) => void;
    updateTranslation: (translation: Record<string, string>) => void;
    _annotationConfig?: AnnotationConfig[];
    playDummyTimeline: () => void;
    // playTimeLine: (timeline: ITimelineData[], duration: number) => void;
    // pauseTimeLine: () => void;
  }
}

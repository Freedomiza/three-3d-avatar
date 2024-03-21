import modelData from "./assets/avatar.json?raw";
import "./assets/style.scss";
import {
  IMeasurementData,
  IModelTargetMapper,
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
  // const dualView: DualModelHelper = new DualModelHelper();

  const onLoadModelCompeted = () => {
    callFlutterHandler("onModelLoaded");
  };
  const onLoadModelError = (error: Error) => {
    callFlutterHandler("onModelError", error);
  };

  window.addEventListener("resize", singleView.onWindowResize);

  // window.loadDualModel = async (isMale, h1, param1, h2, param2) => {
  //   await dualView.init(document);
  //   setTimeout(() => {
  //     dualView.loadDualModel(
  //       isMale,
  //       param1,
  //       param2,
  //       modelData,
  //       onLoadModelCompeted,
  //       onLoadModelError
  //     );
  //   }, 500);
  // };

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
    // dualView.unloadModel();
  };
  // const loadDualDummyModel = async () => {
  //   resetAll();
  //   await dualView.init(document);
  //   const param1 = structuredClone(testParams);
  //   const param2 = structuredClone(param1);
  //   param2.kneeHeight = 1;
  //   param2.insideLegToKnee = 2;
  //   dualView.loadDualModel(true, param1, param2, modelData);
  // };

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
  // window.loadDualDummyModel = loadDualDummyModel;
  window.singleView = singleView;
  // window.dualView = dualView;

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
      height1: number,
      params1: IModelTargetMapper,
      height2: number,
      params2: IModelTargetMapper
    ) => void;
    singleView: ThreeJSHelper;
    dualView: DualModelHelper;
    loadDummyModel: () => void;
    loadDualDummyModel: () => void;
    updateMetrics: (metric: MetricsType) => void;
    updateTranslation: (translation: Record<string, string>) => void;
    _annotationConfig?: AnnotationConfig[];
  }
}

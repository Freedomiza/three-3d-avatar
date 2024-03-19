import modelData from "./assets/avatar.json?raw";
import "./assets/style.scss";
import { IMeasurementData, IModelTargetMapper } from "./models/base";
import { DualModelHelper } from "./dual-model-helper";
import { ThreeJSHelper } from "./three-helper";
import testParams from "./assets/test-params.json";

document.addEventListener("DOMContentLoaded", async () => {
  const singleView: ThreeJSHelper = new ThreeJSHelper();
  // const dualView: DualModelHelper = new DualModelHelper();

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
    console.log({
      rawData,
    });
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
      [],
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
    window.FlutterChannelReady.postMessage("Hello from JavaScript!");
  }

  // loadDummyModel();

  // loadDualDummyModel();

  window.loadDummyModel = loadDummyModel;
  // window.loadDualDummyModel = loadDualDummyModel;
  window.singleView = singleView;
  // window.dualView = dualView;
});

declare global {
  interface IPosition {
    x: number;
    y: number;
    z: number;
  }
  interface Window {
    flutter_inappwebview: any;
    loadModel: (
      isMale: boolean,
      // height: number,
      params: IModelTargetMapper,
      rawData: IMeasurementData[]
    ) => void;
    loadDualModel: (
      isMale: boolean,
      height1: number,
      params1: IModelTargetMapper,
      height2: number,
      params2: IModelTargetMapper
    ) => void;
    FlutterChannelReady: any;
    singleView: ThreeJSHelper;
    dualView: DualModelHelper;
    loadDummyModel: () => void;
    loadDualDummyModel: () => void;
  }
}

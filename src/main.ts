import modelData from "./assets/avatar.json?raw";
import "./assets/style.scss";
import { IModelTargetMapper } from "./models/model-mapper";
import { DualModelHelper } from "./dual-model-helper";
import { ThreeJSHelper } from "./three-helper";
import testParams from "./assets/test-params.json";

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
    const param1 = structuredClone(testParams);
    const param2 = structuredClone(param1);
    param2.kneeHeight = 1;
    param2.insideLegToKnee = 2;
    dualView.loadDualModel(true, param1, param2, modelData);
  };

  const loadDummyModel = async () => {
    resetAll();
    await await singleView.init(document);
    singleView.loadModel(
      false,
      testParams,
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

  loadDummyModel();

  // loadDualDummyModel();

  window.loadDummyModel = loadDummyModel;
  window.loadDualDummyModel = loadDualDummyModel;
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

import modelData from "./assets/body-annotation.json?raw";
import * as THREE from "three";
import "./assets/style.scss";
import { IModelTargetMapper } from "./models/model-mapper";
import { TranslationLabel } from "./models/translation-label";
import { ThreeJSHelper } from "./three-helper";

const threeHelper = new ThreeJSHelper(document);

document.addEventListener("DOMContentLoaded", async () => {
  await threeHelper.ensureInit();
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

  window.addEventListener("resize", threeHelper.onWindowResize);

  window.loadModel = (isMale: boolean, params: IModelTargetMapper) => {
    threeHelper.loadModel(
      isMale,
      params,
      modelData,
      onLoadModelCompeted,
      onLoadModelError
    );
  };
  const loadDummyModel = () => {
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
        insideLegToKnee: 1,
        kneeHeight: 1,
        outerAnkleHeightR: 1,
        male: 1,
        female: 0,
        topHipIndicatorDisable: 0,
        waistIndicatorDisable: 0,
        acrossBackShoulderWidthIndicatorDisable: 0,
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

  loadDummyModel();

  window.loadDummyModel = loadDummyModel;

  window.updateMorphTargets = threeHelper.updateMorphTargets;

  window.hideAllLabels = threeHelper.hideAllLabels;

  window.showAllLabels = threeHelper.showAllLabels;

  window.resetView = threeHelper.resetView;

  window.showWireFrame = threeHelper.showWireFrame;
  window.hideWireFrame = threeHelper.hideWireFrame;
  window.moveCamera = (pos: IPosition, target: IPosition) => {
    threeHelper.moveCamera(
      new THREE.Vector3(pos.x, pos.y, pos.z),
      new THREE.Vector3(target.x, target.y, target.z)
    );
  };
  window.zoomToAnnotation = threeHelper.zoomToAnnotation;

  window.hideLabel = threeHelper.hideLabel;

  window.showLabel = threeHelper.showLabel;

  window.hideEye = threeHelper.hideEye;

  window.showEye = threeHelper.showEye;

  window.hideAllEyes = threeHelper.hideAllEyes;

  window.showAllEyes = threeHelper.showAllEyes;

  window.updateLabelContent = threeHelper.updateLabelContent;

  window.lockCamera = threeHelper.lockCamera;

  window.unlockCamera = threeHelper.unlockCamera;
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
    loadDummyModel: () => void;
    FlutterChannelReady: any;
    updateMorphTargets: (params: IModelTargetMapper) => void;

    resetView: () => void;
    showWireFrame: () => void;
    hideWireFrame: () => void;
    moveCamera: (pos: IPosition, target: IPosition) => void;
    zoomToAnnotation: (annotation: string) => void;

    hideAllLabels: () => void;
    showAllLabels: () => void;
    hideLabel: (annotation: string) => void;
    showLabel: (annotation: string) => void;

    hideAllEyes: () => void;
    showAllEyes: () => void;

    hideEye: (annotation: string) => void;
    showEye: (annotation: string) => void;

    updateLabelContent: (annotation: string, data: TranslationLabel) => void;

    lockCamera: () => void;

    unlockCamera: () => void;
  }
}

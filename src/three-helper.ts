import { gsap } from "gsap";
import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

import {
  IMeasurementData,
  IModelTargetMapper,
  ITimelineData,
  MetricsType,
} from "./models/base";
import BodyModel from "./models/body-model";
import { LabelModel } from "./models/label-model";
import { AnnotationModel } from "./models/annotation-model";
import {
  createDomNode,
  createHTMLEyeBox,
  createHTMLLabel,
  createHTMLTooltips,
  formatMeasurement,
  hideElement,
  showElement,
} from "./html-helper";

import {
  ANIMATION_DURATION,
  INITIAL_CAMERA_POSITION,
  INITIAL_CAMERA_TARGET,
  LINE_COLOR,
  CAMERA_CONFIG,
} from "./config";
import { TranslationLabel } from "./models/translation-label";
import {
  FilterAnnotationFromListResult,
  filterAnnotationFromList,
  filterBodyModelFromList,
  findAnnotationConfig,
  findBodyIndicatorFromList,
  findMeasurementByTitle,
  findWaistPosition,
  getConfigPosition,
  updateMorphTargets,
} from "./model-helper";
import { BodyIndicator } from "./models/body-indicator";
import { postJSMessage } from "./js-channel-helper";

declare global {
  interface Window {
    camera: THREE.Camera;
  }
}

enum RenderMode {
  FullBody,
  Detail,
  Wireframe,
}

export class ThreeJSHelper {
  private _renderer?: THREE.WebGLRenderer;
  private _scene?: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraMaxZoomableDistance = CAMERA_CONFIG.maxZoomable;
  private _cameraHideLabelDistance = CAMERA_CONFIG.hideLabelDistance;
  private _bodyModel?: BodyModel;
  private _renderMode: RenderMode = RenderMode.FullBody;
  private _labelRenderer?: CSS2DRenderer;

  private _domNode?: HTMLDivElement;

  // private meshHelper?: THREE.Mesh;

  // private staticGeometryGenerator?: StaticGeometryGenerator;
  // private bvhHelper?: MeshBVHHelper;
  private _controls?: OrbitControls;
  annotationModels: AnnotationModel[] = [];
  bodyIndicator?: BodyIndicator;

  private _cameraHeight: number = INITIAL_CAMERA_TARGET.y;
  private _morphs?: IModelTargetMapper;

  get cameraHeight() {
    return this._cameraHeight;
  }

  set cameraHeight(value: number) {
    this._cameraHeight = value;
    this._controls?.target.set(0, value, 0);
    this._camera!.position.set(
      INITIAL_CAMERA_POSITION.x,
      this._cameraHeight,
      INITIAL_CAMERA_POSITION.z
    );

    this._controls?.update();
  }

  dispose = () => {
    this._controls?.removeEventListener("change", this.onControlChanged);
    this._renderer?.dispose();
    this._labelRenderer?.domElement.remove();
  };

  init = async (document: Document) => {
    // this.document = document;
    // gsap.ticker.fps(24);
    return new Promise((res, rej) => {
      try {
        // Already initialized
        if (this._domNode) {
          res(true);
          return;
        }
        this._domNode = createDomNode(document);
        document.body.appendChild(this._domNode);

        // Setup render
        this._renderer = this.setUpRenderer(this._domNode);

        // Set up scene
        this._scene = this.setUpScene();
        // Set up camera
        this._camera = this.setUpCamera();
        this._scene.add(this._camera);

        // Set up label Renderer
        this._labelRenderer = this.setupLabelRenderer(this._domNode);
        // Setup controls
        this._controls = this.setUpOrbitControl(
          this._camera,
          this._labelRenderer
        );

        this._controls.addEventListener("change", this.onControlChanged);

        window.camera = this._camera;
        this._renderMode = RenderMode.FullBody;
        // this.domNode.classList.add(HIDDEN_CSS_CLASS);
        setTimeout(() => {
          console.log("Delaying render...");
          res(true);
        }, 300);
      } catch (err) {
        rej(err);
      }
    });
  };

  getCenterTarget = () => {
    return new THREE.Vector3(0, this.cameraHeight, 0);
  };

  _isMovingId?: number;
  _startZoom?: number;

  onControlChanged = () => {
    if (!this._camera) return;
    // TODO: add more controller here if possible
    // const meshDistance = this.camera.position.distanceTo(
    //   this.getCenterTarget()
    // );
    // // console.log(meshDistance);
    // if (meshDistance < 2) {
    //   this.hideAllLabels();
    // } else {
    //   if (meshDistance > 2.5 && this._renderMode == RenderMode.FullBody) {
    //     this.showAllLabels();
    //   }
    // }

    // this.updateAnnotationOpacity();

    if (this._isMovingId) {
      clearTimeout(this._isMovingId);
    } else {
      // this.hideAllLabels();
      this._startZoom = this._camera.position.distanceTo(
        this.getCenterTarget()
      );
    }

    this._isMovingId = setTimeout(() => {
      this._isMovingId = undefined;
      this.updateAnnotationOpacity();
      this.checkLabelShouldVisible();
      this._startZoom = undefined;
      this.render();
    }, 10);
  };

  checkLabelShouldVisible = () => {
    if (!this._camera) return;
    const camera = this._camera!;
    const meshDistance = camera.position.distanceTo(this.getCenterTarget());
    if (meshDistance < this._cameraHideLabelDistance) {
      this.hideAllLabels();
    } else {
      this.showAllEyes();
      if (meshDistance >= this._cameraMaxZoomableDistance) {
        this._renderMode = RenderMode.FullBody;
        this.showAllLabels();

        if (this._startZoom && this._startZoom < meshDistance - 0.15) {
          this.resetCameraCenter();
          // this.resetView();
        }
      }
    }
  };

  setUpScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    return scene;
  };

  generateAnnotations: (
    models: FilterAnnotationFromListResult[]
  ) => AnnotationModel[] = (mesh) => {
    const result: AnnotationModel[] = [];
    mesh.forEach((el) => {
      const annotation = new AnnotationModel(el.model, el.camera, el.target);
      // console.log({ annotation });
      result.push(annotation);
    });

    return result;
  };

  setUpRenderer = (div: HTMLDivElement): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    div.appendChild(renderer.domElement);
    return renderer;
  };

  setUpCamera = () => {
    let camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );

    return camera;
  };

  moveCamera(
    position: THREE.Vector3,
    target: THREE.Vector3,
    callBack?: () => void | null
  ) {
    if (!this._camera || !this._controls) return;

    const controls = this._controls;

    // Animate the camera
    gsap.to(this._camera.position, {
      duration: ANIMATION_DURATION, // Animation duration in seconds
      x: position.x,
      y: position.y,
      z: position.z,
      onUpdate: () => {
        controls.update(); // Important: Update OrbitControls
      },
    });

    // Animate the camera
    gsap.to(controls.target, {
      duration: ANIMATION_DURATION, // Animation duration in seconds
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        // controls.update(); // Important: Update OrbitControls
      },
      onComplete: callBack,
    });
  }

  zoomToAnnotation = (label: string) => {
    const foundAnnotation = this.findAnnotationByName(label);
    if (!foundAnnotation) return;
    this.moveToPart(foundAnnotation);

    // const foundConfig = findAnnotationConfig(foundAnnotation);

    // if (foundConfig) {
    //   const position = foundAnnotation!.position!;

    //   const cameraPos =
    //     foundAnnotation.cameraPosition ??
    //     getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());
    //   const targetPos =
    //     foundAnnotation.targetPosition ?? position ?? new THREE.Vector3();
    //   this.moveCamera(cameraPos, targetPos);
    // }
  };

  render = () => {
    if (
      !this._renderer ||
      !this._labelRenderer ||
      !this._scene ||
      !this._camera
    )
      return;
    this._renderer.render(this._scene, this._camera);
    this._labelRenderer.render(this._scene, this._camera);
  };

  // Update all eye annotation which is behind and which is in front of the camera
  updateAnnotationOpacity = () => {
    this.annotationModels.forEach((el) => {
      el.label?.updatePosition();
    });

    // const meshDistance =
    //   this.camera?.position.distanceTo(this.bodyModel!.mesh!.position) ?? 0;

    // this.annotationModels.forEach((el) => {
    //   el.updateAnnotationOpacity(this.camera!, meshDistance);
    // });
  };

  updateMorphTargets = (
    params: IModelTargetMapper,
    measurement: IMeasurementData[] = []
  ) => {
    this._morphs = this._selectedClone(params);

    updateMorphTargets(params, {
      bodyModel: this._bodyModel,
      annotationModels: this.annotationModels,
      indicator: this.bodyIndicator,
    });

    this.updateMeasurements(measurement);
  };

  _selectedClone = (params: IModelTargetMapper) => {
    return {
      muscular: params.muscular,
      bodyFat: params.bodyFat,
      skinny: params.skinny,
      neckGirth: params.neckGirth,
      neckBaseGirth: params.neckBaseGirth,
      acrossBackShoulderWidth: params.acrossBackShoulderWidth,

      breastSize: params.breastSize,
      underBustGirth: params.underBustGirth,
      waistGirth: params.waistGirth,
      bellyWaistGirth: params.bellyWaistGirth,
      topHipGirth: params.topHipGirth,
      hipGirth: params.hipGirth,
      thighGirthR: params.thighGirthR,
      midThighGirthR: params.midThighGirthR,
      kneeGirthR: params.kneeGirthR,
      calfGirthR: params.calfGirthR,
      upperArmGirthR: params.upperArmGirthR,
      forearmGirthR: params.forearmGirthR,
      wristGirthR: params.wristGirthR,
      shoulderToElbowR: params.shoulderToElbowR,
      forearmLength: params.forearmLength,
      topToBackNeck: params.topToBackNeck,
      backNeckToBust: params.backNeckToBust,
      bustToWaist: params.bustToWaist,
      waistToBellyWaist: params.waistToBellyWaist,
      bellyWaistToTopHip: params.bellyWaistToTopHip,
      topHipToHip: params.topHipToHip,
      hipToInsideLeg: params.hipToInsideLeg,
      insideLegToKnee: params.insideLegToKnee,
      kneeHeight: params.kneeHeight,
      outerAnkleHeightR: params.outerAnkleHeightR,
      male: params.male,
      female: params.female,

      neckIndicatorDisable: params.neckIndicatorDisable,
      shoulderIndicatorDisable: params.shoulderIndicatorDisable,
      backLengthIndicatorDisable: params.backLengthIndicatorDisable,
      bustIndicatorDisable: params.bustIndicatorDisable,
      underBustIndicatorDisable: params.underBustIndicatorDisable,
      waistIndicatorDisable: params.waistIndicatorDisable,
      hipIndicatorDisable: params.hipIndicatorDisable,
      thighIndicatorDisable: params.thighIndicatorDisable,
      calfIndicatorDisable: params.calfIndicatorDisable,
      upperArmIndicatorDisable: params.upperArmIndicatorDisable,
      foreArmIndicatorDisable: params.foreArmIndicatorDisable,
      outerArmLengthIndicatorDisable: params.outerArmLengthIndicatorDisable,
      sleeveLengthIndicatorDisable: params.sleeveLengthIndicatorDisable,
      insideLegHeightIndicatorDisable: params.insideLegHeightIndicatorDisable,
      outsideLegHeightIndicatorDisable: params.outsideLegHeightIndicatorDisable,
      backNeckHeightIndicatorDisable: params.backNeckHeightIndicatorDisable,
    };
  };

  unloadModel: () => void = () => {
    const scene = this._scene;
    if (!scene) return;
    const labelModels = this.annotationModels;

    for (let i = 0; i < labelModels.length; i++) {
      const label = labelModels[i];
      label?.remove();
    }

    this.bodyIndicator?.dispose();
    this._bodyModel?.dispose();
    this._bodyModel = undefined;
    this.bodyIndicator = undefined;

    // for (let i = scene.children.length - 1; i >= 0; i--) {
    //   const object = scene.children[i] as THREE.Mesh;
    //   scene.remove(object);

    //   // Dispose of geometries, materials, textures (if applicable)
    //   if (object.geometry) object.geometry.dispose();
    //   if (object.material) {
    //     if (object.material instanceof THREE.Material) {
    //       object.material.dispose();
    //     } else {
    //       // For multi-materials
    //       for (const material of object.material) {
    //         material.dispose();
    //       }
    //     }
    //   }
    // }

    scene.clear();

    hideElement(this._domNode);
  };

  loadModel = (
    isMale: boolean,
    params: IModelTargetMapper,
    measurementData: IMeasurementData[],
    objData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
    if (this._bodyModel != null) this.unloadModel();
    showElement(this._domNode);

    this._morphs = params;
    // console.log("morph: " + JSON.stringify(params));
    try {
      //dracoLoader loader
      // const dracoLoader = new DRACOLoader();
      // dracoLoader.setDecoderPath(
      //   "https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/"
      // ); // use a full url path

      const loader = new GLTFLoader();
      // loader.setDRACOLoader(dracoLoader);

      const onLoad = (result: GLTF) => {
        if (!this._scene || !this._domNode) return;

        this._bodyModel = filterBodyModelFromList(result.scene.children);
        const modelsPairs = filterAnnotationFromList(result.scene.children);

        this.annotationModels = this.generateAnnotations(modelsPairs);
        const indicator = findBodyIndicatorFromList(result.scene.children);
        if (indicator) {
          this.bodyIndicator = new BodyIndicator(indicator);
          this.bodyIndicator.calculatePosition();
          this.bodyIndicator.loadTextures(LINE_COLOR);
        }
        // console.log("Update model morph");

        updateMorphTargets(params, {
          bodyModel: this._bodyModel,
          annotationModels: this.annotationModels,
          indicator: this.bodyIndicator,
        });

        //* Skin
        this._bodyModel.setGender(isMale);

        this.annotationModels.forEach((el) => {
          el.calculatePosition();

          const measurement = findMeasurementByTitle(measurementData, el.title);

          if (measurement) el.measurement = measurement;

          el.label = this.createLabel(el, el.position!, this._scene!);
        });

        const waistPosition = findWaistPosition(this.annotationModels);

        if (waistPosition) {
          const y = waistPosition?.position?.y ?? 0;
          this.cameraHeight = y - 0.4;
        }

        // const axesHelper = new THREE.AxesHelper(2);
        // axesHelper.visible = false;
        // this.scene.add(axesHelper);
        this._scene.add(...result.scene.children);

        // this.regenerateMesh();

        this._camera?.updateMatrixWorld();

        this.animate();

        // this.cameraHeight = params.heightInM ?? 0.5;

        callback?.();
      };

      loader.parse(objData, "", onLoad, (event: ErrorEvent) => {
        throw event;
      });
    } catch (err) {
      onError && onError(err);
    }
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    // this.controls?.update();
    this.render();
  };

  onWindowResize = () => {
    if (!this._camera || !this._renderer || !this._labelRenderer) return;

    this._camera.aspect = window.innerWidth / window.innerHeight;

    this._camera.updateProjectionMatrix();

    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._labelRenderer.setSize(window.innerWidth, window.innerHeight);
  };

  private setUpOrbitControl = (
    camera: THREE.Camera,
    labelRender: CSS2DRenderer
  ) => {
    const controls = new OrbitControls(camera, labelRender.domElement);

    controls.minDistance = CAMERA_CONFIG.minDistance;
    controls.maxDistance = CAMERA_CONFIG.maxDistance;

    controls.minPolarAngle = CAMERA_CONFIG.rotationLock.vertical.min;
    controls.maxPolarAngle = CAMERA_CONFIG.rotationLock.vertical.max;

    // controls.minAzimuthAngle = CAMERA_CONFIG.rotationLock.horizontal.min;
    // controls.maxAzimuthAngle = CAMERA_CONFIG.rotationLock.horizontal.max;

    camera.up.set(0, 1, 0);

    camera.position.set(
      INITIAL_CAMERA_POSITION.x,
      INITIAL_CAMERA_POSITION.y,
      INITIAL_CAMERA_POSITION.z
    );

    controls.target.set(
      INITIAL_CAMERA_TARGET.x,
      INITIAL_CAMERA_TARGET.y,
      INITIAL_CAMERA_TARGET.z
    );

    controls.enablePan = false;
    controls.update();

    return controls;
  };

  private setupLabelRenderer(div: HTMLDivElement) {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";

    div.appendChild(labelRenderer.domElement);
    return labelRenderer;
  }

  // partViewMode = false;

  moveToPart = (el: AnnotationModel) => {
    this._renderMode = RenderMode.Detail;
    // this.showAllEyes();
    this.hideAllEyes();
    this.hideAllLabels();
    this.hideAllToolTips();
    // el.hideEye();
    // el.showTooltips();

    const position = el.position ?? new THREE.Vector3();
    const foundConfig = findAnnotationConfig(el);

    const cameraPos =
      el.cameraPosition ??
      getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());

    const targetPos = el.targetPosition ?? position;
    if (foundConfig?.indicator) {
      let interp = {
        [`${foundConfig.indicator}`]: 1,
      };
      // updateMorphTargets(
      //   {
      //     ...this._morphs!,
      //     ...interp,
      //   },
      //   {
      //     // bodyModel: this.bodyModel,
      //     indicator: this.bodyIndicator,
      //   }
      // );

      gsap.to(interp, {
        [`${foundConfig.indicator}`]: 0,
        duration: ANIMATION_DURATION, // 1-second duration
        onUpdate: () => {
          updateMorphTargets(
            {
              ...this._morphs!,
              ...interp,
            },
            {
              // bodyModel: this.bodyModel,

              indicator: this.bodyIndicator,
            }
          );
        },
      });
    }

    this.moveCamera(cameraPos, targetPos, () => {
      this.showAllEyes();
      el.hideEye();
      el.showTooltips();
    });
  };

  createLabel = (
    el: AnnotationModel,
    position: THREE.Vector3,
    scene: THREE.Scene
  ): LabelModel => {
    const label = el.title ?? "";

    //* Create a CSS2D label
    const foundConfig = findAnnotationConfig(el);

    let offsetPosition = foundConfig?.position ?? "right";

    const moveToPart = () => {
      this.moveToPart(el);
    };

    const labelDiv = createHTMLLabel({
      title: foundConfig?.label ?? label,
      // TODO: set value here
      value: formatMeasurement(el.measurement),
      position: offsetPosition,
      // onPointerDown: moveToPart,
    });
    const tooltipDiv = createHTMLTooltips({
      name: foundConfig?.name ?? label,
      title: foundConfig?.label ?? label,
      value: formatMeasurement(el.measurement),
    });

    // Start point
    const eyeDiv = createHTMLEyeBox(moveToPart);

    //* Draw start point
    let eye2DObject = new CSS2DObject(eyeDiv);
    eye2DObject.position.copy(position);

    scene.add(eye2DObject);

    const arrowEl = createDomNode(document, "arrow");
    this._domNode?.appendChild(labelDiv);
    this._domNode?.appendChild(tooltipDiv);
    this._domNode?.appendChild(arrowEl);

    //* Compute position
    const labelModel = new LabelModel(
      foundConfig?.name ?? label,
      labelDiv,
      tooltipDiv,
      arrowEl,
      eye2DObject,

      offsetPosition
    );

    labelModel.updatePosition();

    return labelModel;
  };

  hideAllLabels = () => {
    this.annotationModels.forEach((el) => {
      el.hideLabel();
    });
  };

  hideAllToolTips = () => {
    this.annotationModels.forEach((el) => {
      el.hideToolTip();
    });
  };

  showAllLabels: () => void = () => {
    this.annotationModels.forEach((el) => {
      el.showLabel();
    });
  };

  resetCameraCenter = () => {
    this.hideAllToolTips();
    const controls = this._controls!;
    const target = new THREE.Vector3(
      INITIAL_CAMERA_TARGET.x,
      this.cameraHeight,
      INITIAL_CAMERA_TARGET.z
    );

    updateMorphTargets(this._morphs!, {
      bodyModel: this._bodyModel,
      annotationModels: this.annotationModels,
      indicator: this.bodyIndicator,
    });

    // Animate the camera
    gsap.to(controls.target, {
      duration: 0.66, // Animation duration in seconds
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        controls.update(); // Important: Update OrbitControls
      },
    });
  };

  resetView: () => void = () => {
    this._renderMode = RenderMode.FullBody;
    this.hideAllToolTips();
    this.showAllEyes();
    this.showAllLabels();

    updateMorphTargets(this._morphs!, {
      bodyModel: this._bodyModel,
      annotationModels: this.annotationModels,
      indicator: this.bodyIndicator,
    });

    this.moveCamera(
      new THREE.Vector3(
        INITIAL_CAMERA_POSITION.x,
        INITIAL_CAMERA_POSITION.y,
        INITIAL_CAMERA_POSITION.z
      ),
      new THREE.Vector3(
        INITIAL_CAMERA_TARGET.x,
        this.cameraHeight,
        INITIAL_CAMERA_TARGET.z
      )
    );

    postJSMessage("ResetCameraChannel", "reset camera");
  };

  showWireFrame = () => {
    this.hideAllEyes();
    this.hideAllLabels();
    this._bodyModel?.toggleWireFrame(true);
  };

  hideWireFrame = () => {
    this._bodyModel?.toggleWireFrame(false);
  };

  findAnnotationByName = (name: string) => {
    return this.annotationModels.find((el) =>
      el.title?.toLowerCase().includes(name.toLowerCase())
    );
  };

  hideLabel = (annotation: string) => {
    const foundAnnotation = this.findAnnotationByName(annotation);
    if (foundAnnotation) {
      foundAnnotation.hideLabel();
    }
  };

  showLabel = (annotation: string) => {
    const foundAnnotation = this.findAnnotationByName(annotation);
    if (foundAnnotation) {
      foundAnnotation.showLabel();
    }
  };

  hideEye = (annotation: string) => {
    const foundAnnotation = this.findAnnotationByName(annotation);
    if (foundAnnotation) {
      foundAnnotation.hideEye();
    }
  };

  showEye = (annotation: string) => {
    const foundAnnotation = this.findAnnotationByName(annotation);
    if (foundAnnotation) {
      foundAnnotation.showEye();
    }
  };

  showAllEyes = () => {
    this.annotationModels.forEach((el) => {
      el.showEye();
    });
  };
  hideAllEyes = () => {
    this.annotationModels.forEach((el) => {
      el.hideEye();
    });
  };

  updateLabelContent = (annotation: string, data: TranslationLabel) => {
    const foundAnnotation = this.findAnnotationByName(annotation);
    foundAnnotation?.updateLabelContent(data);
  };

  unlockCamera: () => void = () => {
    if (this._controls) this._controls.enabled = true;
  };

  lockCamera: () => void = () => {
    if (this._controls) this._controls.enabled = false;
  };

  updateMeasurements = (measurementData: IMeasurementData[]) => {
    if (measurementData.length == 0) return;
    // console.log({
    //   measurementData,
    // });

    this.annotationModels.forEach((el) => {
      const measurement = findMeasurementByTitle(measurementData, el.title);
      if (measurement) el?.updateLabelMeasurement(measurement);
    });
  };

  updateMetrics = (metric: MetricsType) => {
    this.annotationModels.forEach((el) => {
      el?.updateMetrics(metric);
    });
  };

  updateUI = () => {
    this.annotationModels.forEach((el) => {
      el?.updateUI();
    });
  };

  _timeLinePlayer: gsap.core.Timeline | undefined = undefined;

  playTimeline = (timeLines: ITimelineData[], duration: number) => {
    if (timeLines.length == 0) return;
    this._timeLinePlayer?.kill();

    let minTime = timeLines[0].date;
    let maxTime = timeLines[timeLines.length - 1].date;

    const timeSpan = Math.abs(maxTime - minTime);

    var tl = gsap.timeline({});
    const currentMorphs = structuredClone(this._morphs!);
    let current = minTime;
    // console.log({ currentMorphs });
    for (let index = 0; index < timeLines.length; index++) {
      const el = timeLines[index];

      const timeRatio = (el.date - current) / timeSpan;

      // console.log({ timeRatio });
      tl.to(currentMorphs, {
        duration: timeRatio * duration, // Animation duration in seconds
        ...el.measurements,
        onUpdate: () => {
          updateMorphTargets(currentMorphs, {
            bodyModel: this._bodyModel,
            annotationModels: this.annotationModels,
            indicator: this.bodyIndicator,
          });
          this.updateAnnotationOpacity();
          // this.updateUI();
        },
      });
      current = el.date;
    }
    this._timeLinePlayer = tl;
    return tl;
  };

  pauseTimeLine = () => {
    if (this._timeLinePlayer) this._timeLinePlayer.pause();
  };
  seekTimeLine = (duration: number) => {
    return this._timeLinePlayer?.seek(duration);
  };

  stopTimeLine = () => {
    return this._timeLinePlayer?.kill();
  };

  replayTimeLine = () => {
    return this._timeLinePlayer?.restart();
  };
}

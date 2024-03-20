import { gsap } from "gsap";
import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

import { IMeasurementData, IModelTargetMapper } from "./models/base";
import BodyModel from "./models/body-model";
import { LabelModel } from "./models/label-model";
import { AnnotationModel } from "./models/annotation-model";
import {
  createDomNode,
  createHTMLEyeBox,
  createHTMLLabel,
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
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  private _cameraMaxZoomableDistance = CAMERA_CONFIG.maxZoomable;
  private _cameraHideLabelDistance = CAMERA_CONFIG.hideLabelDistance;
  bodyModel?: BodyModel;
  private _renderMode: RenderMode = RenderMode.FullBody;
  private labelRenderer?: CSS2DRenderer;

  private domNode?: HTMLDivElement;

  // private meshHelper?: THREE.Mesh;

  // private staticGeometryGenerator?: StaticGeometryGenerator;
  // private bvhHelper?: MeshBVHHelper;
  private controls?: OrbitControls;
  annotationModels: AnnotationModel[] = [];
  bodyIndicator?: BodyIndicator;

  private _cameraHeight: number = INITIAL_CAMERA_TARGET.y;
  private _morphs?: IModelTargetMapper;

  get cameraHeight() {
    return this._cameraHeight;
  }

  set cameraHeight(value: number) {
    this._cameraHeight = value;
    this.controls?.target.set(0, value, 0);
    this.camera!.position.set(
      INITIAL_CAMERA_POSITION.x,
      this._cameraHeight,
      INITIAL_CAMERA_POSITION.z
    );

    this.controls?.update();
  }

  dispose = () => {
    this.controls?.removeEventListener("change", this.onControlChanged);
    this.renderer?.dispose();
    this.labelRenderer?.domElement.remove();
  };

  init = async (document: Document) => {
    // this.document = document;
    // gsap.ticker.fps(24);
    return new Promise((res, rej) => {
      try {
        // Already initialized
        if (this.domNode) {
          res(true);
          return;
        }
        this.domNode = createDomNode(document);
        document.body.appendChild(this.domNode);

        // Setup render
        this.renderer = this.setUpRenderer(this.domNode);

        // Set up scene
        this.scene = this.setUpScene();
        // Set up camera
        this.camera = this.setUpCamera();
        this.scene.add(this.camera);

        // Set up label Renderer
        this.labelRenderer = this.setupLabelRenderer(this.domNode);
        // Setup controls
        this.controls = this.setUpOrbitControl(this.camera, this.labelRenderer);

        this.controls.addEventListener("change", this.onControlChanged);

        window.camera = this.camera;
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
    if (!this.camera) return;
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
      this.hideAllLabels();
      this._startZoom = this.camera.position.distanceTo(this.getCenterTarget());
    }

    this._isMovingId = setTimeout(() => {
      this._isMovingId = undefined;
      this.updateAnnotationOpacity();
      this.checkLabelShouldVisible();
      this._startZoom = undefined;
      this.render();
    }, 300);
  };

  checkLabelShouldVisible = () => {
    if (!this.camera) return;
    const camera = this.camera!;
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
    if (!this.camera || !this.controls) return;
    const controls = this.controls;

    // Animate the camera
    gsap.to(this.camera.position, {
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

    const foundConfig = findAnnotationConfig(foundAnnotation);

    if (foundConfig) {
      const position = foundAnnotation!.position!;

      const cameraPos =
        foundAnnotation.cameraPosition ??
        getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());
      const targetPos =
        foundAnnotation.targetPosition ?? position ?? new THREE.Vector3();
      this.moveCamera(cameraPos, targetPos);
    }
  };

  render = () => {
    if (!this.renderer || !this.labelRenderer || !this.scene || !this.camera)
      return;
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
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
    measurement: IMeasurementData[]
  ) => {
    this._morphs = params;

    updateMorphTargets(params, {
      bodyModel: this.bodyModel,
      annotationModels: this.annotationModels,
      indicator: this.bodyIndicator,
    });

    this.updateMeasurements(measurement);
  };

  unloadModel: () => void = () => {
    const scene = this.scene;
    if (!scene) return;
    const labelModels = this.annotationModels;

    for (let i = 0; i < labelModels.length; i++) {
      const label = labelModels[i];
      label?.remove();
    }

    this.bodyIndicator?.dispose();
    this.bodyModel?.dispose();
    this.bodyModel = undefined;
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

    hideElement(this.domNode);
  };

  loadModel = (
    isMale: boolean,
    params: IModelTargetMapper,
    measurementData: IMeasurementData[],
    objData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
    if (this.bodyModel != null) this.unloadModel();
    showElement(this.domNode);

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
        if (!this.scene || !this.domNode) return;

        this.bodyModel = filterBodyModelFromList(result.scene.children);
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
          bodyModel: this.bodyModel,
          annotationModels: this.annotationModels,
          indicator: this.bodyIndicator,
        });

        //* Skin
        this.bodyModel.setGender(isMale);

        this.annotationModels.forEach((el) => {
          el.calculatePosition();

          const measurement = findMeasurementByTitle(measurementData, el.title);

          if (measurement) el.measurement = measurement;

          el.label = this.createLabel(el, el.position!, this.scene!);
        });

        const waistPosition = findWaistPosition(this.annotationModels);

        if (waistPosition) {
          const y = waistPosition?.position?.y ?? 0;
          this.cameraHeight = y - 0.4;
        }

        // const axesHelper = new THREE.AxesHelper(2);
        // axesHelper.visible = false;
        // this.scene.add(axesHelper);
        this.scene.add(...result.scene.children);

        // this.regenerateMesh();

        this.camera?.updateMatrixWorld();

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

  // regenerateMesh = () => {
  //   // const meshHelper = this.meshHelper;
  //   // if (meshHelper) {
  //   //   // let generateTime, refitTime, startTime;
  //   //   // time the geometry generation
  //   //   // startTime = window.performance.now();
  //   //   this.staticGeometryGenerator?.generate(meshHelper.geometry);
  //   //   // generateTime = window.performance.now() - startTime;
  //   //   // time the bvh refitting
  //   //   // startTime = window.performance.now();
  //   //   if (!(meshHelper.geometry as any).boundsTree) {
  //   //     (meshHelper.geometry as any).computeBoundsTree();
  //   //     // refitTime = "-";
  //   //   } else {
  //   //     (meshHelper.geometry as any).boundsTree.refit();
  //   //     // refitTime = (window.performance.now() - startTime).toFixed(2);
  //   //   }
  //   //   // this.bvhHelper?.update();
  //   // }
  // };

  animate = () => {
    requestAnimationFrame(this.animate);
    // this.controls?.update();
    this.render();
  };

  onWindowResize = () => {
    if (!this.camera || !this.renderer || !this.labelRenderer) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
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
    this.showAllEyes();
    this.hideAllLabels();
    el.hideEye();
    el.showTooltips();

    const position = el.position ?? new THREE.Vector3();
    const foundConfig = findAnnotationConfig(el);

    const cameraPos =
      el.cameraPosition ??
      getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());

    const targetPos = el.targetPosition ?? position;
    if (foundConfig?.indicator) {
      let interp = {
        [`${foundConfig.indicator}`]: 0,
      };
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

      // gsap.to(interp, {
      //   [`${foundConfig.indicator}`]: 0,
      //   duration: 1, // 1-second duration
      //   onUpdate: () => {
      //     updateMorphTargets(
      //       {
      //         ...this._morphs!,
      //         ...interp,
      //       },
      //       {
      //         // bodyModel: this.bodyModel,

      //         indicator: this.bodyIndicator,
      //       }
      //     );
      //   },
      // });
    }

    this.moveCamera(cameraPos, targetPos);
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
      onPointerDown: moveToPart,
    });

    // Start point
    const startDiv = createHTMLEyeBox(moveToPart);

    //* Draw start point
    let startObject = new CSS2DObject(startDiv);
    startObject.position.copy(position);

    scene.add(startObject);

    this.domNode?.appendChild(labelDiv);
    //* Compute position
    const labelModel = new LabelModel(labelDiv, startObject, offsetPosition);
    labelModel.updatePosition();

    return labelModel;
  };

  hideAllLabels = () => {
    this.annotationModels.forEach((el) => {
      el.hideLabel();
    });
  };

  showAllLabels: () => void = () => {
    this.annotationModels.forEach((el) => {
      el.showLabel();
    });
  };

  resetCameraCenter = () => {
    const controls = this.controls!;
    const target = new THREE.Vector3(
      INITIAL_CAMERA_TARGET.x,
      this.cameraHeight,
      INITIAL_CAMERA_TARGET.z
    );

    updateMorphTargets(this._morphs!, {
      bodyModel: this.bodyModel,
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

    this.showAllEyes();
    this.showAllLabels();

    updateMorphTargets(this._morphs!, {
      bodyModel: this.bodyModel,
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
    this.bodyModel?.toggleWireFrame(true);
  };

  hideWireFrame = () => {
    this.bodyModel?.toggleWireFrame(false);
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
    if (this.controls) this.controls.enabled = true;
  };

  lockCamera: () => void = () => {
    if (this.controls) this.controls.enabled = false;
  };

  updateMeasurements = (measurementData: IMeasurementData[]) => {
    console.log({
      measurementData,
    });

    this.annotationModels.forEach((el) => {
      el.calculatePosition();

      const measurement = findMeasurementByTitle(measurementData, el.title);
      if (measurement) el?.updateLabelMeasurement(measurement);
    });
  };
}

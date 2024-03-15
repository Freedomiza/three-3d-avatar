import { gsap } from "gsap";
import * as THREE from "three";
import {
  MeshBVHHelper,
  StaticGeometryGenerator,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

import { IModelTargetMapper } from "./models/model-mapper";
import BodyModel from "./models/body-model";
import { LabelModel } from "./models/label-model";
import { AnnotationModel } from "./models/annotation-model";
import { createHTMLEyeBox, createHTMLLabel, debounce } from "./html-helper";

import annotationConfig from "./assets/annotation-config.json";
import {
  INITIAL_CAMERA_POSITION,
  INITIAL_CAMERA_ROTATION_LOCK,
  INITIAL_CAMERA_TARGET,
  LINE_COLOR,
} from "./config";
import { TranslationLabel } from "./models/translation-label";
import {
  FilterAnnotationFromListResult,
  filterAnnotationFromList,
  filterBodyModelFromList,
  findBodyIndicatorFromList,
  getConfigPosition,
  updateMorphTargets,
} from "./model-helper";
import { BodyIndicator } from "./models/body-indicator";

//* Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

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

  bodyModel?: BodyModel;
  private _renderMode: RenderMode = RenderMode.FullBody;
  private labelRenderer?: CSS2DRenderer;

  private domNode?: HTMLDivElement;

  private meshHelper?: THREE.Mesh;

  private staticGeometryGenerator?: StaticGeometryGenerator;
  private bvhHelper?: MeshBVHHelper;
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

  private createDomNode = (document: Document) => {
    const div = document.createElement("div");
    div.classList.add("renderer");

    document.body.appendChild(div);
    // this.domNode = div;
    return div;
  };
  init = async (document: Document) => {
    // this.document = document;

    this.domNode = this.createDomNode(document);
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
    this.domNode.classList.add("hidden");
  };

  getCenterTarget = () => {
    return new THREE.Vector3(0, this.cameraHeight, 0);
  };

  onControlChanged = () => {
    if (!this.camera) return;
    // TODO: add more controller here if possible
    const meshDistance = this.camera.position.distanceTo(
      this.getCenterTarget()
    );
    // console.log(meshDistance);
    if (meshDistance < 2) {
      this.hideAllLabels();
    } else {
      if (meshDistance > 2.5 && this._renderMode == RenderMode.FullBody) {
        this.showAllLabels();
      }
    }

    this.updateAnnotationOpacity();
    this.render();
  };

  setUpScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    return scene;
  };

  generateAnnotations: (
    models: FilterAnnotationFromListResult[]
  ) => AnnotationModel[] = (mesh: FilterAnnotationFromListResult[]) => {
    const result: AnnotationModel[] = [];
    mesh.forEach((el) => {
      const annotation = new AnnotationModel(el.model, el.camera, el.target);
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
      39.6,
      window.innerWidth / window.innerHeight,
      0.1,
      20
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
      duration: 1, // Animation duration in seconds
      x: position.x,
      y: position.y,
      z: position.z,
      onUpdate: () => {
        controls.update(); // Important: Update OrbitControls
      },
    });

    // Animate the camera
    gsap.to(controls.target, {
      duration: 1, // Animation duration in seconds
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        controls.update(); // Important: Update OrbitControls
      },
      onComplete: callBack,
    });
  }

  findAnnotationConfig = (annotation: AnnotationModel) => {
    const label = annotation.title ?? "";

    const foundConfig = annotationConfig.find((e) =>
      label.toLowerCase().includes(e.name)
    );
    return foundConfig;
  };

  zoomToAnnotation = (label: string) => {
    const foundAnnotation = this.findAnnotationByName(label);
    if (!foundAnnotation) return;

    const foundConfig = this.findAnnotationConfig(foundAnnotation);

    if (foundConfig) {
      const position = foundAnnotation!.position!;

      const cameraPos =
        foundAnnotation.cameraPosition ??
        getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());
      const targetPos =
        foundAnnotation.targetPosition ?? position ?? new THREE.Vector3();
      this.moveCamera(cameraPos, targetPos, () => {
        console.log("cb");
      });
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

    const meshDistance =
      this.camera?.position.distanceTo(this.bodyModel!.mesh!.position) ?? 0;

    this.annotationModels.forEach((el) => {
      el.updateAnnotationOpacity(this.camera!, meshDistance);
    });
  };

  updateMorphTargets = (params: IModelTargetMapper) => {
    this._morphs = params;

    updateMorphTargets(params, {
      bodyModel: this.bodyModel,
      annotationModels: this.annotationModels,
      indicator: this.bodyIndicator,
    });
  };

  unloadModel: () => void = () => {
    const scene = this.scene;
    if (!scene) return;
    const labelModels = this.annotationModels;

    for (let i = 0; i < labelModels.length; i++) {
      const label = labelModels[i];
      if (label.label) {
        label.label?.remove();
      }
    }

    for (let i = scene.children.length - 1; i >= 0; i--) {
      const object = scene.children[i] as THREE.Mesh;
      scene.remove(object);

      // Dispose of geometries, materials, textures (if applicable)
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else {
          // For multi-materials
          for (const material of object.material) {
            material.dispose();
          }
        }
      }
    }

    this.domNode?.classList.add("hidden");
  };

  loadModel = (
    isMale: boolean,
    params: IModelTargetMapper,
    modelData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
    this.domNode?.classList.remove("hidden");
    this._morphs = params;
    try {
      const objData = modelData;

      //dracoLoader loader
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/"
      ); // use a full url path

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

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
        console.log({ modelsPairs, children: result.scene.children });

        updateMorphTargets(params, {
          bodyModel: this.bodyModel,
          annotationModels: this.annotationModels,
          indicator: this.bodyIndicator,
        });

        //* Skin
        this.bodyModel.setGender(isMale);

        this.annotationModels.forEach((el) => {
          el.calculatePosition();
          el.label = this.createLabel(el, el.position!, this.scene!);
        });

        const waistPosition = this.annotationModels.find((anno) =>
          anno.title?.toLowerCase().startsWith("waist")
        );

        if (waistPosition) {
          const y = waistPosition?.position?.y ?? 0;
          this.cameraHeight = y - 0.4;
        }

        this.scene.add(...result.scene.children);

        this.regenerateMesh();

        this.camera?.updateMatrixWorld();

        const axesHelper = new THREE.AxesHelper(2);
        axesHelper.visible = true;
        this.scene.add(axesHelper);

        this.animate();

        // this.cameraHeight = params.heightInM ?? 0.5;
        callback?.();
      };

      loader.parse(objData, "", onLoad);
    } catch (err) {
      onError && onError(err);
    }
  };

  regenerateMesh = () => {
    const meshHelper = this.meshHelper;
    if (meshHelper) {
      // let generateTime, refitTime, startTime;

      // time the geometry generation
      // startTime = window.performance.now();
      this.staticGeometryGenerator?.generate(meshHelper.geometry);
      // generateTime = window.performance.now() - startTime;

      // time the bvh refitting
      // startTime = window.performance.now();
      if (!(meshHelper.geometry as any).boundsTree) {
        (meshHelper.geometry as any).computeBoundsTree();
        // refitTime = "-";
      } else {
        (meshHelper.geometry as any).boundsTree.refit();
        // refitTime = (window.performance.now() - startTime).toFixed(2);
      }

      this.bvhHelper?.update();
    }
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    this.controls?.update();
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

    controls.minDistance = 1;
    controls.maxDistance = 3.5;

    controls.minPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.min;
    controls.maxPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.max;

    //* controls.minAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.min;
    //* controls.maxAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.max;

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
    this.hideAllLabels();
    el.hideEye();
    el.showTooltips();
    const position = el.position ?? new THREE.Vector3();
    const foundConfig = this.findAnnotationConfig(el);

    const cameraPos =
      el.cameraPosition ??
      getConfigPosition(foundConfig?.camera?.position, new THREE.Vector3());

    const targetPos = el.targetPosition ?? position;
    if (foundConfig?.indicator) {
      let interp = {
        [`${foundConfig.indicator}`]: 1,
      };

      gsap.to(interp, {
        [`${foundConfig.indicator}`]: 0,
        duration: 1, // 1-second duration
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

    this.moveCamera(cameraPos, targetPos);
  };

  createLabel = (
    el: AnnotationModel,
    position: THREE.Vector3,
    scene: THREE.Scene
  ): LabelModel => {
    const label = el.title ?? "";

    //* Create a CSS2D label

    const foundConfig = this.findAnnotationConfig(el);

    let offsetPosition = foundConfig?.position ?? "right";

    const moveToPart = () => {
      this.moveToPart(el);
    };

    const labelDiv = createHTMLLabel({
      title: foundConfig?.label ?? label,
      value: "43.3cm",
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
      ),
      () => {
        console.log("cb");
      }
    );
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

  debouncedResetCheck = debounce(this.resetView, 300);
}

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
import { createHTMLEyeBox, createHTMLLabel } from "./html-helper";

import annotationConfig from "./assets/annotation-config.json";

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
declare global {
  interface Window {
    camera: THREE.Camera;
  }
}

import {
  INITIAL_CAMERA_POSITION,
  INITIAL_CAMERA_ROTATION_LOCK,
  INITIAL_CAMERA_TARGET,
} from "./config";
import { TranslationLabel } from "./models/translation-label";
import {
  filterAnnotationFromList,
  filterBodyModelFromList,
  updateMorphTargets,
} from "./model-helper";

export class ThreeJSHelper {
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;

  bodyModel?: BodyModel;

  private labelRenderer?: CSS2DRenderer;

  // document: Document;
  private domNode?: HTMLDivElement;

  private meshHelper?: THREE.Mesh;

  private staticGeometryGenerator?: StaticGeometryGenerator;
  private bvhHelper?: MeshBVHHelper;
  private controls?: OrbitControls;
  annotationModels: AnnotationModel[] = [];

  private _bodyHeight: number = INITIAL_CAMERA_TARGET.y;

  get bodyHeight() {
    return this._bodyHeight;
  }

  set bodyHeight(value: number) {
    this._bodyHeight = value;
    this.controls?.target.set(0, value / 2, 0);
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
    this.domNode.classList.add("hidden");
  };

  getCenterTarget = () => {
    return new THREE.Vector3(0, this.bodyHeight / 2, 0);
  };
  onControlChanged = () => {
    if (!this.camera) return;
    // TODO: add more controller here if possible
    const meshDistance = this.camera.position.distanceTo(
      this.getCenterTarget()
    );

    if (meshDistance < 1.5) {
      this.hideAllLabels();
    } else {
      this.showAllLabels();
    }

    // console.log(this.camera.position);
    // console.log(this.camera.zoom);
    this.updateAnnotationOpacity();
    this.render();
  };
  setUpScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    return scene;
  };

  generateAnnotations: (mesh: THREE.Mesh[]) => AnnotationModel[] = (
    mesh: THREE.Mesh[]
  ) => {
    const result: AnnotationModel[] = [];
    mesh.forEach((el) => {
      const annotation = new AnnotationModel(el);
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
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      20
    );

    return camera;
  };

  moveCamera(position: THREE.Vector3, target: THREE.Vector3) {
    if (!this.camera || !this.controls) return;
    const controls = this.controls;

    // Animate the camera
    gsap.to(this.camera.position, {
      duration: 1, // Animation duration in seconds
      x: position.x,
      y: position.y,
      z: position.z,
      onUpdate: () => {
        // controls.update(); // Important: Update OrbitControls
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
      const camera = foundConfig.camera.position;
      const cameraPos = new THREE.Vector3(camera.x, camera.y, camera.z);
      this.moveCamera(cameraPos, position);
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

    // const meshDistance = this.camera.position.distanceTo(
    //   this.bodyModel!.mesh!.position
    // );
    // this.annotationModels.forEach((el) => {
    //   const pos = el.position!;
    //   const spriteDistance = this.camera.position.distanceTo(pos);
    //   var spriteBehindObject = spriteDistance > meshDistance;
    //   // el.label!.sprite!.material.opacity = spriteBehindObject ? 0.5 : 1;
    //   el.label!.label.element.style.opacity = spriteBehindObject ? "0.5" : "1";
    //   // this.eyeScale = DEFAULT_EYE_SCALE * spriteDistance * 0.35;
    //   // el.label?.sprite.scale.set(this.eyeScale, this.eyeScale, this.eyeScale);
    // });
    // spriteBehindObject = spriteDistance > meshDistance;
    // sprite.material.opacity = spriteBehindObject ? 0.25 : 1;
    // // Do you want a number that changes size according to its position?
    // // Comment out the following line and the `::before` pseudo-element.
    // sprite.material.opacity = 0;
  };
  updateMorphTargets = (params: IModelTargetMapper) => {
    updateMorphTargets(params, {
      bodyModel: this.bodyModel,
      annotationModels: this.annotationModels,
    });
    //   // const values = new ModelTargetMapper(params).toArray();
    //   // if (this.bodyModel && values) {
    //   //   this.bodyModel.applyMorph(values);
    //   //   this.annotationModels.forEach((el) => {
    //   //     el.applyMorph(values);
    //   //   });
    //   // }
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

        const models = filterAnnotationFromList(result.scene.children);

        this.annotationModels = this.generateAnnotations(models);

        // this.updateMorphTargets(params);

        updateMorphTargets(params, {
          bodyModel: this.bodyModel,
          annotationModels: this.annotationModels,
        });

        //skin
        const mat = this.bodyModel.loadTextures(isMale);
        this.bodyModel.applySkinTexture(mat);

        this.annotationModels.forEach((el) => {
          // el.position = this.getPosition(el.mesh);
          el.calculatePosition();
          el.label = this.createLabel(el, el.position!, this.scene!);
        });

        this.scene.add(...result.scene.children);

        // // prep the geometry
        this.staticGeometryGenerator = new StaticGeometryGenerator(models);
        // this.originalMaterials = this.staticGeometryGenerator.getMaterials();

        // this.meshHelper = new THREE.Mesh(new THREE.BufferGeometry());

        // this.meshHelper.receiveShadow = false;
        // this.scene.add(this.meshHelper);
        // this.bvhHelper = new MeshBVHHelper(this.meshHelper, 10);
        // this.scene.add(this.bvhHelper);
        this.scene.updateMatrixWorld(true);

        this.regenerateMesh();

        // this.camera.position.set(-3, 2.5, 0.25);

        this.camera?.updateMatrixWorld();

        const axesHelper = new THREE.AxesHelper(2);
        axesHelper.visible = false;
        this.scene.add(axesHelper);

        this.animate();

        this.bodyHeight = params.heightInM ?? 0.5;
        // console.log(new Date().getTime());
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
    controls.maxDistance = 2.5;

    controls.minPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.min;
    controls.maxPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.max;

    // controls.minAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.min;
    // controls.maxAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.max;

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
    // camera.set
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

  // loadTextures(isMale: boolean) {
  //   let skinTexture: THREE.Texture;
  //   if (isMale) {
  //     skinTexture = new THREE.TextureLoader().load(maleBody);
  //   } else {
  //     skinTexture = new THREE.TextureLoader().load(femaleBody);
  //   }

  //   skinTexture.mapping = THREE.UVMapping;
  //   // skinTexture.flipY = false;

  //   return skinTexture;
  // }

  // drawBBox(
  //   baseModel: THREE.Mesh<
  //     THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  //     THREE.Material | THREE.Material[],
  //     THREE.Object3DEventMap
  //   >,
  //   scene: THREE.Scene,
  //   color: number = 0xff0000
  // ) {
  //   baseModel.geometry.computeBoundingBox();
  //   var helper = new THREE.BoxHelper(baseModel, color);

  //   helper.update();
  //   // If you want a visible bounding box
  //   scene.add(helper);
  // }

  createLabel = (
    el: AnnotationModel,
    position: THREE.Vector3,
    scene: THREE.Scene
  ): LabelModel => {
    const label = el.title ?? "";
    //eyePNG scale is 513x469 ~ 512p
    // const map = new THREE.TextureLoader().load(eyePNG);
    // const spriteMaterial = new THREE.SpriteMaterial({
    //   map: map,
    //   alphaTest: 0.5,

    //   transparent: true,
    //   depthTest: false,
    //   depthWrite: false,
    // });

    // const sprite = new THREE.Sprite(spriteMaterial);
    // sprite.position.set(position.x, position.y, position.z);
    // sprite.scale.set(this.eyeScale, this.eyeScale, this.eyeScale);

    // scene.add(sprite);

    // // Create a CSS2D label

    const foundConfig = this.findAnnotationConfig(el);

    let offsetPosition = "right";

    if (foundConfig) {
      offsetPosition = foundConfig.position;
      // offset = foundConfig.offset;
    }
    const moveToPart = () => {
      this.moveCamera(
        new THREE.Vector3(
          foundConfig?.camera.position.x,
          foundConfig?.camera.position.y,
          foundConfig?.camera.position.z
        ),
        new THREE.Vector3(position.x, position.y, position.z)
      );
    };

    const labelDiv = createHTMLLabel({
      title: label,
      value: "43.3cm",
      position: offsetPosition,
      onPointerDown: moveToPart,
    });

    // // Labeler
    // let labelObject = new CSS2DObject(labelDiv);
    // labelObject.position.copy(position);

    // x +/-= 1m

    // labelObject.center.x += offset;

    // debugger;
    // scene.add(labelObject);

    // Start point
    const startDiv = createHTMLEyeBox(moveToPart);
    // startDiv.textContent = "";

    // Draw start point
    let startObject = new CSS2DObject(startDiv);
    startObject.position.copy(position);

    scene.add(startObject);

    // const tooltips = document.createElement("div");
    // tooltips.classList.add("tooltips");
    // tooltips.innerHTML = "Hello world";
    this.domNode?.appendChild(labelDiv);
    // // Compute position

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
    this.moveCamera(
      new THREE.Vector3(
        INITIAL_CAMERA_POSITION.x,
        INITIAL_CAMERA_POSITION.y,
        INITIAL_CAMERA_POSITION.z
      ),
      new THREE.Vector3(
        INITIAL_CAMERA_TARGET.x,
        this.bodyHeight / 2,
        INITIAL_CAMERA_TARGET.z
      )
    );
  };
  showWireFrame = () => {
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
}

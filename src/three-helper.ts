import * as THREE from "three";
import BodyModel from "./models/body-model";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  computeBoundsTree,
  MeshBVHHelper,
  disposeBoundsTree,
  StaticGeometryGenerator,
  acceleratedRaycast,
} from "three-mesh-bvh";
import { gsap } from "gsap";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { IModelTargetMapper, ModelTargetMapper } from "./models/model-mapper";

import eyePNG from "./assets/eye.raw?raw";
import { AnnotationModel } from "./models/annotation-model";
import { LabelModel } from "./models/label-model";
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
  DEFAULT_EYE_SCALE,
  INITIAL_CAMERA_POSITION,
  INITIAL_CAMERA_TARGET,
} from "./config";
import { TranslationLabel } from "./models/translation-label";

export class ThreeJSHelper {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  bodyModel?: BodyModel;

  labelRenderer: CSS2DRenderer;
  labelObject?: CSS2DObject;
  document: Document;

  meshHelper?: THREE.Mesh;
  originalMaterials: any;
  staticGeometryGenerator?: StaticGeometryGenerator;
  bvhHelper?: MeshBVHHelper;
  controls: OrbitControls;
  annotationModels: AnnotationModel[] = [];

  eyeScale: number = DEFAULT_EYE_SCALE;

  constructor(document: Document) {
    this.document = document;
    // Setup render
    this.renderer = this.setUpRenderer(this.document);
    // Set up scene
    this.scene = this.setUpScene();

    // Set up camera
    this.camera = this.setUpCamera();
    this.scene.add(this.camera);

    // Set up label Renderer
    this.labelRenderer = this.setupLabelRenderer(this.document);
    // Setup controls
    this.controls = this.setUpOrbitControl(this.camera);

    this.controls.addEventListener("change", this.onControlChanged);
    window.camera = this.camera;
  }

  ensureInit = async () => {};

  onControlChanged = () => {
    // TODO: add more controller here if possible
    // console.log({
    //   direction: this.camera.getWorldDirection(new THREE.Vector3()),
    //   position: this.camera.getWorldPosition(new THREE.Vector3()),
    //   zoom: this.camera.zoom,
    // });

    // console.log(this.camera.position);
    // console.log(this.camera.zoom);

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

  setUpRenderer = (document: Document): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
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
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    this.updateAnnotationOpacity();
  };

  // Update all eye annotation which is behind and which is in front of the camera
  updateAnnotationOpacity = () => {
    const meshDistance = this.camera.position.distanceTo(
      this.bodyModel!.mesh!.position
    );

    this.annotationModels.forEach((el) => {
      const pos = el.position!;
      const spriteDistance = this.camera.position.distanceTo(pos);
      var spriteBehindObject = spriteDistance > meshDistance;
      el.label!.sprite!.material.opacity = spriteBehindObject ? 0.5 : 1;
      el.label!.label.element.style.opacity = spriteBehindObject ? "0.5" : "1";

      this.eyeScale = DEFAULT_EYE_SCALE * spriteDistance * 0.5;
      el.label?.sprite.scale.set(this.eyeScale, this.eyeScale, this.eyeScale);
    });

    // spriteBehindObject = spriteDistance > meshDistance;
    // sprite.material.opacity = spriteBehindObject ? 0.25 : 1;
    // // Do you want a number that changes size according to its position?
    // // Comment out the following line and the `::before` pseudo-element.
    // sprite.material.opacity = 0;
  };
  updateMorphTargets = (params: IModelTargetMapper) => {
    const values = new ModelTargetMapper(params).toArray();
    if (this.bodyModel && values) {
      this.bodyModel.applyMorph(values);
      this.annotationModels.forEach((el) => {
        el.applyMorph(values);
      });
    }
  };

  filterBodyModelFromList = (
    list: THREE.Object3D<THREE.Object3DEventMap>[]
  ) => {
    return new BodyModel(list.find((el) => el.name === "body") as THREE.Mesh);
  };

  filterAnnotationFromList = (
    list: THREE.Object3D<THREE.Object3DEventMap>[]
  ) => {
    const models = list.filter(
      (child) => child.name !== "body"
    ) as THREE.Mesh[];
    return models;
  };

  loadModel = (
    isMale: boolean,
    params: IModelTargetMapper,
    modelData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
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
        this.bodyModel = this.filterBodyModelFromList(result.scene.children);

        const models = this.filterAnnotationFromList(result.scene.children);

        this.annotationModels = this.generateAnnotations(models);

        this.updateMorphTargets(params);

        //skin
        const mat = this.bodyModel.loadTextures(isMale);
        this.bodyModel.applySkinTexture(mat);

        this.annotationModels.forEach((el) => {
          // el.position = this.getPosition(el.mesh);
          el.calculatePosition();
          el.label = this.createLabel(
            el,
            el.position!,
            this.scene,
            this.document
          );
        });

        this.scene.add(result.scene);

        const wireframeMaterial = new THREE.MeshBasicMaterial({
          wireframe: false,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          // visible: false,
        });

        // // prep the geometry
        this.staticGeometryGenerator = new StaticGeometryGenerator(models);
        // this.originalMaterials = this.staticGeometryGenerator.getMaterials();

        this.meshHelper = new THREE.Mesh(
          new THREE.BufferGeometry(),
          wireframeMaterial
        );

        this.meshHelper.receiveShadow = false;

        this.scene.add(this.meshHelper);

        this.bvhHelper = new MeshBVHHelper(this.meshHelper, 10);

        this.scene.add(this.bvhHelper);
        this.scene.updateMatrixWorld(true);

        this.regenerateMesh();

        // this.camera.position.set(-3, 2.5, 0.25);

        this.camera.updateMatrixWorld();
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);

        this.animate();

        callback && callback();
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
    this.controls.update();
    this.render();
  };

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
  };

  private setUpOrbitControl = (camera: THREE.Camera) => {
    const controls = new OrbitControls(camera, this.labelRenderer.domElement);

    // controls.minDistance = 1;
    // controls.maxDistance = 90;
    controls.minPolarAngle = -Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

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

    controls.update();

    return controls;
  };

  private setupLabelRenderer(document: Document) {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";

    document.body.appendChild(labelRenderer.domElement);
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

  drawBBox(
    baseModel: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >,
    scene: THREE.Scene,
    color: number = 0xff0000
  ) {
    baseModel.geometry.computeBoundingBox();
    var helper = new THREE.BoxHelper(baseModel, color);

    helper.update();
    // If you want a visible bounding box
    scene.add(helper);
  }

  createLabel = (
    el: AnnotationModel,
    position: THREE.Vector3,
    scene: THREE.Scene,
    document: Document
  ): LabelModel => {
    //eyePNG scale is 513x469 ~ 512p
    const map = new THREE.TextureLoader().load(eyePNG);
    const label = el.title ?? "";
    const spriteMaterial = new THREE.SpriteMaterial({
      map: map,
      alphaTest: 0.5,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(this.eyeScale, this.eyeScale, this.eyeScale);

    scene.add(sprite);

    // // Create a CSS2D label

    const foundConfig = this.findAnnotationConfig(el);

    let offsetPosition = "right";
    let offset = 0;
    if (foundConfig) {
      offsetPosition = foundConfig.position;
      offset = foundConfig.offset;
    }

    const labelDiv = createHTMLLabel(document, {
      title: label,
      value: "43.3cm",
      position: offsetPosition,
      onPointerDown: () => {
        this.moveCamera(
          new THREE.Vector3(
            foundConfig?.camera.position.x,
            foundConfig?.camera.position.y,
            foundConfig?.camera.position.z
          ),
          new THREE.Vector3(position.x, position.y, position.z)
        );
      },
    });

    // Labeler
    let labelObject = new CSS2DObject(labelDiv);
    labelObject.position.copy(position);

    // console.log({
    //   viewport: this.labelRenderer!.getSize(),

    //   centerPos: labelObject.center,
    // });
    // x +/-= 1m

    labelObject.center.x += offset;

    // debugger;
    scene.add(labelObject);

    // Start point
    const startDiv = createHTMLEyeBox(document, () => {
      //Rotate camera
      this.moveCamera(
        new THREE.Vector3(
          foundConfig?.camera.position.x,
          foundConfig?.camera.position.y,
          foundConfig?.camera.position.z
        ),
        new THREE.Vector3(position.x, position.y, position.z)
      );
      // console.log(el.label?.label.element.classList)
      // TODO: jus a demo test,
      // if (el.label?.label.element.classList.contains("hidden")) {
      //   el.label?.label.element.classList.remove("hidden");
      //   return;
      // }
      // el.label?.label.element.classList.add("hidden");
    });
    // startDiv.textContent = "";

    // Draw start point
    let startObject = new CSS2DObject(startDiv);
    startObject.position.copy(position);

    scene.add(startObject);

    return new LabelModel(labelObject, sprite);
  };

  // getPosition = (
  //   obj: THREE.Mesh<
  //     THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  //     THREE.Material | THREE.Material[],
  //     THREE.Object3DEventMap
  //   >
  // ): THREE.Vector3 => {
  //   const generator = new StaticGeometryGenerator(obj);
  //   const geometry = generator.generate();
  //   (geometry as any).computeBoundsTree();

  //   const position = geometry.attributes.position;
  //   const vector = new THREE.Vector3();

  //   vector.fromBufferAttribute(position, 0);

  //   const globalVector = obj.localToWorld(vector);

  //   // var meshBVH = new MeshBVH(mesh);
  //   // console.log({
  //   //   vector: vector,
  //   //   globalVector,
  //   // });

  //   return globalVector;
  // };

  // createMaterials = (skins: THREE.Texture[]) => {
  //   var materials = [];

  //   for (var i = 0; i < skins.length; i++) {
  //     materials[i] = new THREE.MeshLambertMaterial({
  //       color: 0xeeeeee,
  //       // specular: 10.0,
  //       map: skins[i],
  //       // skinning: false,
  //       // morphTargets: true,
  //       // wrapAround: true,
  //     });
  //   }

  //   return materials;
  // };

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
        INITIAL_CAMERA_TARGET.y,
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
    this.controls.enabled = true;
  };

  lockCamera: () => void = () => {
    this.controls.enabled = false;
  };
}

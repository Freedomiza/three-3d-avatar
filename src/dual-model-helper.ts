import { gsap } from "gsap";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  INITIAL_CAMERA_ROTATION_LOCK,
  INITIAL_CAMERA_TARGET,
  INITIAL_DUAL_CAMERA_POSITION,
} from "./config";
import BodyModel from "./models/body-model";
import { IModelTargetMapper } from "./models/model-mapper";
import {
  filterBodyModelFromList,
  getAvg,
  updateMorphTargets,
} from "./model-helper";

export class DualModelHelper {
  private domNode?: HTMLDivElement;
  private renderer1?: THREE.WebGLRenderer;
  private renderer2?: THREE.WebGLRenderer;
  private scene1?: THREE.Scene;
  private scene2?: THREE.Scene;

  camera1?: THREE.PerspectiveCamera;
  camera2?: THREE.PerspectiveCamera;

  private controls1?: OrbitControls;
  private controls2?: OrbitControls;
  bodyModel1?: BodyModel;
  bodyModel2?: BodyModel;

  leftView?: HTMLDivElement;
  rightView?: HTMLDivElement;

  private _bodyHeight: number = INITIAL_CAMERA_TARGET.y;

  get bodyHeight() {
    return this._bodyHeight;
  }

  set bodyHeight(value: number) {
    this._bodyHeight = value;

    this.controls1?.target.set(0, value / 2, 0);
    this.controls1?.update();

    this.controls2?.target.set(0, value / 2, 0);
    this.controls2?.update();
  }

  private createDomNode = (document: Document): HTMLDivElement => {
    const dualRenderer = document.createElement("div");
    dualRenderer.classList.add("dual-renderer");

    document.body.appendChild(dualRenderer);

    return dualRenderer;
  };

  init = async (document: Document) => {
    this.domNode = this.createDomNode(document);
    this.setUpRenderer(this.domNode);

    this.scene1 = this.setUpScene();
    this.scene2 = this.setUpScene();

    this.camera1 = this.setUpCamera();
    this.camera2 = this.setUpCamera();

    this.controls1 = this.setUpOrbitControl(this.camera1, this.renderer1!);
    this.controls2 = this.setUpOrbitControl(this.camera2, this.renderer2!);

    this.controls1.addEventListener("change", this.onControl1Change);

    this.controls2.addEventListener("change", this.onControl2Change);

    this.domNode.classList.add("hidden");

    window.addEventListener("resize", this.onWindowResize);
  };

  private control1TimerId?: number;
  private control2TimerId?: number;

  private onControl1Change = () => {
    if (!this.camera1 || !this.camera2 || this.control2TimerId) return;

    //* Synchronize camera positions and rotations
    this.camera2.position.copy(this.camera1.position);
    this.camera2.quaternion.copy(this.camera1.quaternion);

    if (this.control1TimerId) {
      clearTimeout(this.control1TimerId);
    }
    this.control1TimerId = setTimeout(() => {
      this.control1TimerId = undefined;
    }, 300);

    this.render();
  };

  private onControl2Change = () => {
    if (!this.camera1 || !this.camera2 || this.control1TimerId) return;

    //* Synchronize camera positions and rotations
    this.camera1.position.copy(this.camera2.position);
    this.camera1.quaternion.copy(this.camera2.quaternion);

    this.render();

    if (this.control2TimerId) {
      clearTimeout(this.control2TimerId);
    }
    this.control2TimerId = setTimeout(() => {
      this.control2TimerId = undefined;
    }, 300);
  };

  private setUpRenderer = (div: HTMLDivElement): void => {
    const renderer1 = new THREE.WebGLRenderer({ antialias: true });
    const renderer2 = new THREE.WebGLRenderer({ antialias: true });

    this.leftView = window.document.createElement("div");
    this.leftView.classList.add("left-view");
    div.appendChild(this.leftView);

    renderer1.setPixelRatio(window.devicePixelRatio);
    renderer1.setSize(window.innerWidth / 2, window.innerHeight);

    this.leftView.appendChild(renderer1.domElement);

    this.rightView = window.document.createElement("div");
    this.rightView.classList.add("right-view");
    div.appendChild(this.rightView);

    renderer2.setPixelRatio(window.devicePixelRatio);

    renderer2.setSize(window.innerWidth / 2, window.innerHeight);
    this.rightView.appendChild(renderer2.domElement);

    this.renderer1 = renderer1;
    this.renderer2 = renderer2;
  };

  private setUpCamera = () => {
    const halfWidth = window.innerWidth / 2;
    let camera = new THREE.PerspectiveCamera(
      55,
      halfWidth / window.innerHeight,
      0.1,
      20
    );

    return camera;
  };

  private setUpScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    return scene;
  };

  unloadModel: () => void = () => {
    this.unLoadScene(this.scene1);
    this.unLoadScene(this.scene2);

    this.controls1?.removeEventListener("change", this.onControl1Change);
    this.controls2?.removeEventListener("change", this.onControl2Change);

    this.renderer1?.dispose();
    this.renderer2?.dispose();

    this.domNode?.classList.add("hidden");

    window.removeEventListener("resize", this.onWindowResize);
  };

  private unLoadScene = (scene?: THREE.Scene) => {
    if (!scene) return;
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
  };

  private setUpOrbitControl = (
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) => {
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.minDistance = 1;
    controls.maxDistance = 3.5;

    controls.minPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.min;
    controls.maxPolarAngle = INITIAL_CAMERA_ROTATION_LOCK.vertical.max;

    // controls.minAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.min;
    // controls.maxAzimuthAngle = INITIAL_CAMERA_ROTATION_LOCK.horizontal.max;

    camera.up.set(0, 1, 0);

    camera.position.set(
      INITIAL_DUAL_CAMERA_POSITION.x,
      INITIAL_DUAL_CAMERA_POSITION.y,
      INITIAL_DUAL_CAMERA_POSITION.z
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

  private onWindowResize = () => {
    if (!this.camera1 || !this.camera2) return;
    this.camera1.aspect = window.innerWidth / 2 / window.innerHeight;
    this.camera1.updateProjectionMatrix();

    this.camera2.aspect = window.innerWidth / 2 / window.innerHeight;
    this.camera2.updateProjectionMatrix();

    this.renderer1?.setSize(window.innerWidth / 2, window.innerHeight);
    this.renderer2?.setSize(window.innerWidth / 2, window.innerHeight);
  };

  loadDualModel = (
    isMale: boolean,
    params1: IModelTargetMapper,
    params2: IModelTargetMapper,
    objData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
    this.domNode?.classList.remove("hidden");
    try {
      //dracoLoader loader
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/"
      ); // use a full url path

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      const onLoad = (result: GLTF) => {
        this.bodyModel1 = filterBodyModelFromList(
          result.scene.children
        ).clone();

        updateMorphTargets(params1, {
          bodyModel: this.bodyModel1,
        });

        //skin
        const mat = this.bodyModel1.loadTextures(isMale);
        this.bodyModel1.applySkinTexture(mat);
        this.scene1?.add(this.bodyModel1!.mesh);

        this.bodyModel2 = this.bodyModel1.clone();
        this.bodyModel2.applySkinTexture(mat.clone());
        this.scene2?.add(this.bodyModel2!.mesh);

        updateMorphTargets(params2, {
          bodyModel: this.bodyModel2,
        });

        this.scene1?.updateMatrixWorld(true);
        this.scene1?.updateMatrixWorld(true);
        this.animate();

        this.bodyHeight = getAvg(params1.heightInM, params2.heightInM) ?? 0.5;

        callback?.();
      };

      loader.parse(objData, "", onLoad);
    } catch (err) {
      onError(err);
    }
  };

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls1?.update();
    this.controls2?.update();

    this.render();
  };

  private render = () => {
    // if (!this.scene1 || !this.scene2 || !this.camera1 || !this.camera2) return;
    this.renderer1?.render(this.scene1!, this.camera1!);
    this.renderer2?.render(this.scene2!, this.camera2!);
  };

  updateMorphTargets1 = (params: IModelTargetMapper) => {
    updateMorphTargets(params, {
      bodyModel: this.bodyModel1,
    });
  };

  updateMorphTargets2 = (params: IModelTargetMapper) => {
    updateMorphTargets(params, {
      bodyModel: this.bodyModel2,
    });
  };

  resetView = () => {
    this.moveCamera(
      this.camera1!,
      this.controls1!,
      new THREE.Vector3(
        INITIAL_DUAL_CAMERA_POSITION.x,
        INITIAL_DUAL_CAMERA_POSITION.y,
        INITIAL_DUAL_CAMERA_POSITION.z
      ),
      new THREE.Vector3(
        INITIAL_CAMERA_TARGET.x,
        this.bodyHeight / 2,
        INITIAL_CAMERA_TARGET.z
      )
    );
  };

  moveCamera(
    camera: THREE.Camera,
    controls: OrbitControls,
    position: THREE.Vector3,
    target: THREE.Vector3
  ) {
    // Animate the camera
    gsap.to(camera.position, {
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

  showBody1WireFrame = () => {
    this.bodyModel1?.toggleWireFrame(true);
  };
  showBody2WireFrame = () => {
    this.bodyModel2?.toggleWireFrame(true);
  };

  hideBody1WireFrame = () => {
    this.bodyModel1?.toggleWireFrame(false);
  };
  hideBody2WireFrame = () => {
    this.bodyModel2?.toggleWireFrame(false);
  };
}

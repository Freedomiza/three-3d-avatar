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

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { IModelTargetMapper, ModelTargetMapper } from "./models/model-mapper";
import maleBody from "./assets/male-body.txt?raw";
import femaleBody from "./assets/female-body.txt?raw";

import eyePNG from "./assets/eye.raw?raw";
import { AnnotationModel } from "./models/annotation-model";
import { LabelModel } from "./models/label-model";
import { createHTMLEyeBox, createHTMLLabel } from "./html-helper";

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const annotationConfig = [
  {
    name: "hip",
    position: "right",
    offset: -0.6,
  },
  {
    name: "knee",
    position: "right",
    offset: -0.6,
  },
];

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

    this.controls.addEventListener("change", this.render);
    window.camera = this.camera;
  }

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
      const pos = this.getPosition(el.mesh);
      const spriteDistance = this.camera.position.distanceTo(pos);
      var spriteBehindObject = spriteDistance > meshDistance;
      el.label!.sprite!.material.opacity = spriteBehindObject ? 0.5 : 1;
      el.label!.label.element.style.opacity = spriteBehindObject ? "0.5" : "1";
    });

    // spriteBehindObject = spriteDistance > meshDistance;
    // sprite.material.opacity = spriteBehindObject ? 0.25 : 1;
    // // Do you want a number that changes size according to its position?
    // // Comment out the following line and the `::before` pseudo-element.
    // sprite.material.opacity = 0;
  };
  updateMorphTargets = (values: any) => {
    // for (let i = 0; i < values.length; i++) {
    //   bodyModel.morphTargetInfluences[ i ] = values[i];
    // }
    if (this.bodyModel) {
      this.bodyModel.applyMorph(values);
    }
  };

  loadModel = (
    isMale: boolean,
    model: IModelTargetMapper,
    modelData: unknown
  ) => {
    const objData = JSON.stringify(modelData);

    const initialMorphTargets = new ModelTargetMapper(model).toArray();
    // this.camera.position.z = 10;

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);

    // const frontLight = new THREE.DirectionalLight(0xeeeeee, 1.5);
    // frontLight.position.set(150, 150 , 50);
    // scene.add(frontLight);

    // const rightFrontLight = new THREE.DirectionalLight(0xeeeeee, 0.5);
    // rightFrontLight.position.set(0, 150 , 0);
    // scene.add(rightFrontLight);

    // const backLight = new THREE.DirectionalLight(0xdddddd, 2);
    // backLight.position.set(-150, 150, -50);
    // scene.add(backLight);

    //dracoLoader loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://unpkg.com/three@0.154.x/examples/jsm/libs/draco/gltf/"
    ); // use a full url path

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const onLoad = (result: GLTF) => {
      this.bodyModel = new BodyModel(
        result.scene.children.find((el) => el.name === "body") as THREE.Mesh
      );

      this.scene.updateMatrixWorld(true);

      const models = result.scene.children.filter(
        (child) => child.name !== "body"
      ) as THREE.Mesh[];

      this.annotationModels = this.generateAnnotations(models);

      if (initialMorphTargets) {
        this.bodyModel.applyMorph(initialMorphTargets);
        this.annotationModels.forEach((el) => {
          el.applyMorph(initialMorphTargets);
        });
      }

      //skin
      const skinTexture = this.loadTextures(isMale);

      const me0 = new THREE.MeshStandardMaterial({
        map: skinTexture,
        wireframe: true,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: skinTexture,
      });

      this.bodyModel.applySkinTexture(me0);

      this.annotationModels.forEach((el) => {
        const basePosition = this.getPosition(el.mesh);
        el.position = basePosition;
        el.label = this.createLabel(
          el,
          basePosition,
          this.scene,
          this.document
        );
      });

      this.scene.add(result.scene);

      const wireframeMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });

      // // prep the geometry
      this.staticGeometryGenerator = new StaticGeometryGenerator(models);
      // baseModel
      // this.originalMaterials = this.staticGeometryGenerator.getMaterials();

      this.meshHelper = new THREE.Mesh(
        new THREE.BufferGeometry(),
        wireframeMaterial
      );

      this.meshHelper.receiveShadow = true;

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
    };

    loader.parse(objData, "", onLoad);
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

    controls.minDistance = 1;
    controls.maxDistance = 900;
    camera.up.set(0, 1, 0);

    camera.position.set(-4, 3, 0);

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

  loadTextures(isMale: boolean) {
    let skinTexture: THREE.Texture;
    if (isMale) {
      skinTexture = new THREE.TextureLoader().load(maleBody);
    } else {
      skinTexture = new THREE.TextureLoader().load(femaleBody);
    }

    skinTexture.mapping = THREE.UVMapping;
    // skinTexture.flipY = false;

    return skinTexture;
  }

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
    sprite.scale.set(0.1, 0.1, 0.1);

    scene.add(sprite);

    // // Create a CSS2D label

    const foundConfig = annotationConfig.find((e) =>
      label.toLowerCase().includes(e.name)
    );
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
      onPointerDown() {
        console.log("clicked:" + label);
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
      if (el.label?.label.element.classList.contains("hidden")) {
        el.label?.label.element.classList.remove("hidden");
        return;
      }
      el.label?.label.element.classList.add("hidden");
    });
    // startDiv.textContent = "";

    // Draw start point
    let startObject = new CSS2DObject(startDiv);
    startObject.position.copy(position);

    scene.add(startObject);

    return new LabelModel(labelObject, sprite);
  };

  getPosition = (
    obj: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  ): THREE.Vector3 => {
    const generator = new StaticGeometryGenerator(obj);
    const geometry = generator.generate();
    (geometry as any).computeBoundsTree();

    const position = geometry.attributes.position;
    const vector = new THREE.Vector3();

    vector.fromBufferAttribute(position, 0);

    const globalVector = obj.localToWorld(vector);

    // var meshBVH = new MeshBVH(mesh);
    // console.log({
    //   vector: vector,
    //   globalVector,
    // });

    return globalVector;
  };

  createMaterials = (skins: THREE.Texture[]) => {
    var materials = [];

    for (var i = 0; i < skins.length; i++) {
      materials[i] = new THREE.MeshLambertMaterial({
        color: 0xeeeeee,
        // specular: 10.0,
        map: skins[i],
        // skinning: false,
        // morphTargets: true,
        // wrapAround: true,
      });
    }

    return materials;
  };
}

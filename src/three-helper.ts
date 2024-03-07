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

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export class ThreeJSHelper {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  bodyModel?: BodyModel;
  labelRenderer: CSS2DRenderer;
  labelObject?: CSS2DObject;
  document: Document;

  meshHelper?: THREE.Mesh;
  // originalMaterials: any;
  staticGeometryGenerator?: StaticGeometryGenerator;
  bvhHelper?: MeshBVHHelper;
  controls: OrbitControls;

  constructor(document: Document) {
    this.document = document;
    // Setup render
    this.renderer = this.setUpRenderer(this.document);

    // Set up scene

    this.scene = this.setUpScene();

    // Set up camera
    this.camera = this.setUpCamera();

    // Set up label Renderer
    this.labelRenderer = this.setupLabelRenderer(this.document);

    // Setup controls
    this.controls = this.setUpOrbitControl();

    this.controls.addEventListener("change", this.render);
  }
  setUpScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    return scene;
  };
  setUpRenderer = (document: Document): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
  };
  setUpCamera = () => {
    return new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      20
    );
  };
  render = () => {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  updateMorphTargets = (values: any) => {
    // for (let i = 0; i < values.length; i++) {
    //   bodyModel.morphTargetInfluences[ i ] = values[i];
    // }
    if (this.bodyModel) {
      this.bodyModel!.morphTargetInfluences = values;
    }
  };

  loadModel = (
    isMale: boolean,
    model: IModelTargetMapper,
    modelData: unknown
  ) => {
    const objData = JSON.stringify(modelData);

    const initialMorphTargets = new ModelTargetMapper(model).toArray();
    this.camera.position.z = 10;

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
      // result.scene.traverse((child) => {
      //   if (child.material) {
      //     child.material.metalness = 0.4;
      //     child.material.roughness = 0.7;
      //   }
      //   // console.log(child.material);
      // });
      // console.log({
      //   result,
      //   scene: result.scene,
      //   sceneChildren: result.scene.children,
      //   length: result.scene.children.length,
      // });

      // result.scene.children.forEach((child) => {
      //   console.log({ child });
      // });

      this.bodyModel = result.scene.children.find(
        (el) => el.name === "body"
      ) as THREE.Mesh;

      this.scene.updateMatrixWorld(true);
      this.bodyModel.visible = true;
      // bodyModel.rotateZ(-(Math.PI / 2.5));

      // console.log(baseModel);
      // console.log(baseModel.morphTargetDictionary);

      // baseModel.scale.set(3, 3, 3);
      // baseModel.translateZ(2.2);

      const annotationModel = result.scene.children.filter(
        (child) => child.name !== "body"
      ) as THREE.Mesh[];

      if (initialMorphTargets) {
        this.applyMorph(this.bodyModel, initialMorphTargets);

        annotationModel.forEach((el) => {
          this.applyMorph(el, initialMorphTargets);
        });
      }
      // console.log({ baseModel, annotationModel });
      //skin
      const skinTexture = this.loadTextures(isMale);
      skinTexture.mapping = THREE.UVMapping;
      skinTexture.flipY = false;

      const me0 = new THREE.MeshStandardMaterial({
        map: skinTexture,
        wireframe: true,
      });

      me0.emissive = new THREE.Color(0xffffff);
      me0.emissiveMap = skinTexture;
      // const geometry = new BoxBufferGeometry(2, 2, 2);
      // const material = new MeshStandardMaterial({ color: 'purple' });
      // const cube = new Mesh(geometry, material);
      this.bodyModel.material = me0;
      // this.drawBBox(baseModel, this.scene, 0x00ff00);

      annotationModel.forEach((el) => {
        // const skinTexture = loadTextures(isMale);
        // if (el.name !== "HipAttonation") {
        // this.drawBBox(el, this.scene);
        // this.scene.add(el);
        const basePosition = this.getPosition(el);
        this.createLabel(`${el.name}`, basePosition, this.scene);
        // }
      });

      // result.scene.rotateY(-(Math.PI / 2.5));
      // result.scene.rotateX(-(Math.PI / 2.5));
      // result.scene.rotateZ(-(Math.PI / 2.5));
      // result.scene.scale.set(3, 3, 3);

      this.scene.add(result.scene);

      const wireframeMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });

      // prep the geometry
      this.staticGeometryGenerator = new StaticGeometryGenerator(
        annotationModel
        // baseModel
      );
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
    this.render();
  };
  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
  };

  private setUpOrbitControl = () => {
    const controls = new OrbitControls(
      this.camera,
      this.labelRenderer.domElement
    );

    controls.minDistance = 1;
    controls.maxDistance = 900;
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
    if (isMale) {
      return new THREE.TextureLoader().load(maleBody);
    }

    return new THREE.TextureLoader().load(femaleBody);
  }

  applyMorph = (
    obj: THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >,
    data: number[]
  ): void => {
    obj.morphTargetInfluences = data;
    obj.geometry.computeBoundingBox();
    obj.geometry.computeBoundingSphere();
  };

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
    label: string,
    position: THREE.Vector3,
    scene: THREE.Scene
  ) => {
    // Create a CSS2D label
    const labelDiv = this.document.createElement("div");
    labelDiv.className = "annotation-label";
    labelDiv.textContent = label;

    var labelObject = new CSS2DObject(labelDiv);
    labelObject.position.copy(position); // Position slightly above the sphere

    scene.add(labelObject);
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
    console.log({
      vector: vector,
      globalVector,
    });

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

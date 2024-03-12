# 3D Avatar Viewer

## Setup

1. Run:

   - `npm install`

2. Build:

   - `npm run build`

3. Copy `dist/index.html` folder to flutter assets folder

## Usage

1. Load Model:

   ```dart
      currentController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ....;


      currentController
          ?.loadFlutterAsset('[PATH_TO_ASSETS_FOLDER]/index.html')
          .then((value) {
        currentController?.addJavaScriptChannel('FlutterChannelReady',
            onMessageReceived: (JavaScriptMessage message) {
          print(message);
          currentController?.runJavaScript(
              'loadModel(${body3dModel?.isMale},${toMorphString(body3dModel?.currentMorphInfluences ?? {})});');
        });
      });
   ```

2: Update 3D Model:

## Global `Window` Interface Extensions

This document outlines custom extensions made to the global `Window` interface within a TypeScript environment. These extensions are likely used to enable communication and control between a web application and an embedded component or a native context.

### Properties

- **`flutter_inappwebview` (any):** Suggests interaction with an in-app WebView component, possibly a Flutter WebView. The lack of typing (`any`) implies flexibility in the types of messages accepted.

- **`FlutterChannelReady` (any):** Likely a signal or object related to establishing a communication channel with a Flutter framework.

### Methods

#### _Window Object props_

- **`loadModel(isMale: boolean, params: IModelTargetMapper): void`:**

  - Loads a 3D model (presuming the context of Three.js or similar).
  - **`isMale`:** Determines if a male or female model variant is used.
  - **`params`:** An object conforming to the `IModelTargetMapper` interface, providing configuration data for loading the model.

- **`loadDualModel(isMale: boolean, params1: IModelTargetMapper, params2: IModelTargetMapper): void`:**

  - Loads two 3D models simultaneously.
  - **`isMale`:** Likely indicates the gender for both models.
  - **`params1` and `params2`:** Individual `IModelTargetMapper` objects for customizing each model.

- **`FlutterChannelReady` (any):** Probably a property or object related to signaling or communication readiness within a Flutter/Webview hybrid context.

- **`singleView` (ThreeJSHelper):** A property holding an instance of a `ThreeJSHelper` class. This class likely assists in managing a single Three.js scene or view.

- **`dualView` (DualModelHelper):** A property holding an instance of a `DualModelHelper` class, probably responsible for managing two simultaneous Three.js scenes or views.

## `SingleView`: Handle single view port model

```typescript
export interface IThreeJSHelper {
  dispose: () => void;
  init: (document: Document) => void;
  getCenterTarget: () => THREE.Vector3;
  onControlChanged: () => void;
  setUpScene: () => THREE.Scene;
  generateAnnotations: (mesh: THREE.Mesh[]) => AnnotationModel[];
  setUpRenderer: (div: HTMLDivElement) => THREE.WebGLRenderer;
  setUpCamera: () => THREE.PerspectiveCamera;
  moveCamera: (position: THREE.Vector3, target: THREE.Vector3) => void;
  findAnnotationConfig: (annotation: AnnotationModel) => any;
  zoomToAnnotation: (label: string) => void;
  render: () => void;
  updateAnnotationOpacity: () => void;
  updateMorphTargets: (params: IModelTargetMapper) => void;
  unloadModel: () => void;
  loadModel: (
    isMale: boolean,
    params: IModelTargetMapper,
    modelData: string,
    callback?: () => void,
    onError: (error: any) => void
  ) => void;
  regenerateMesh: () => void;
  animate: () => void;
  onWindowResize: () => void;
  setUpOrbitControl: (
    camera: THREE.Camera,
    labelRender: CSS2DRenderer
  ) => OrbitControls;
  setupLabelRenderer: (div: HTMLDivElement) => CSS2DRenderer;
  createLabel: (
    el: AnnotationModel,
    position: THREE.Vector3,
    scene: THREE.Scene
  ) => LabelModel;
  hideAllLabels: () => void;
  showAllLabels: () => void;
  resetView: () => void;
  showWireFrame: () => void;
  hideWireFrame: () => void;
  findAnnotationByName: (name: string) => AnnotationModel | undefined;
  hideLabel: (annotation: string) => void;
  showLabel: (annotation: string) => void;
  hideEye: (annotation: string) => void;
  showEye: (annotation: string) => void;
  showAllEyes: () => void;
  hideAllEyes: () => void;
  updateLabelContent: (annotation: string, data: TranslationLabel) => void;
  unlockCamera: () => void;
  lockCamera: () => void;
}
```

## `DualViews`: DualModelHelper Class

This class manages the rendering and interaction with two synchronized Three.js scenes, providing a dual-view setup.

```typescript
export interface DualModelHelper {
  // ... (Properties)

  init = async (document: Document) => {
    // ... (Initialization logic)
  };

  unloadModel: () => void = () => {
    // ... (Model unloading and cleanup)
  };

  loadDualModel = (
    isMale: boolean,
    params1: IModelTargetMapper,
    params2: IModelTargetMapper,
    objData: string,
    callback?: () => void,
    onError: (error: any) => void = () => {}
  ) => {
    // ... (Dual model loading logic)
  };
}
```

### `IModelTargetMapper` Interface

```typescript
export interface IModelTargetMapper {
  muscular: number;
  bodyFat: number;
  skinny: number;
  neckGirth: number;
  baseNeckGirth: number;
  acrossBackShoulderWidth: number;
  breastSize: number;
  underBustGirth: number;
  waistGirth: number;
  bellyWaistGirth: number;
  topHipGirth: number;
  hipGirth: number;
  thighGirthR: number;
  midThighGirthR: number;
  kneeGirthR: number;
  calfGirthR: number;
  upperArmGirthR: number;
  forearmGirthR: number;
  wristGirthR: number;
  shoulderToElbowR: number;
  forearmLength: number;
  topToBackNeck: number;
  backNeckToBust: number;
  bustToWaist: number;
  waistToBellyWaist: number;
  bellyWaistToTopHip: number;
  topHiptoHip: number;
  hipToInsideLeg: number;
  insideLegToKnee: number;
  kneeHeight: number;
  outerAnkleHeightR: number;
  male: number;
  female: number;
  topHipIndicatorDisable: number;
  waistIndicatorDisable: number;
  acrossBackShoulderWidthIndicatorDisable: number;

  heightInM: number;
  toArray: () => number[];
}
```

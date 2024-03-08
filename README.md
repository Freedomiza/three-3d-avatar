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

#### 3D Model Manipulation

- **`loadModel(isMale: boolean, params: IModelTargetMapper) => void`:** Loads a 3D model, possibly into a viewer. Parameters indicate gender and morph target customization settings.

- **`loadDummyModel() => void`:** Loads a placeholder or default 3D model.

- **`updateMorphTargets(params: IModelTargetMapper) => void`:** Updates the morph targets (shape modifications) of an existing 3D model.

#### View and Camera Control

- **`resetView() => void`:** Resets the camera or viewport to a default state.

- **`showWireFrame() => void`:** Displays the 3D model in wireframe mode.

- **`hideWireFrame() => void`:** Hides the wireframe overlay of a 3D model.

- **`moveCamera(pos: IPosition, target: IPosition) => void`:** Repositions the camera within the 3D scene. Takes the new camera position (`pos`) and the point to look at (`target`).

- **`zoomToAnnotation(annotation: string) => void`:** Zooms the camera into a specific part of the model, likely identified by an 'annotation' label.

#### Label Management

- **`hideAllLabels() => void`:** Hides all labels or annotations associated with the 3D model.

- **`showAllLabels() => void`:** Shows all labels or annotations on the 3D model.

- **`hideLabel(annotation: string) => void`:** Hides a specific label by its annotation string.

- **`showLabel(annotation: string) => void`:** Shows a specific label by its annotation string.

#### Eye Control (If applicable)

- **`hideAllEyes() => void`:** Hides elements representing eyes on the 3D model (if the model has such features).

- **`showAllEyes() => void`:** Shows eye elements on the 3D model.

- **`hideEye(annotation: string) => void`:** Hides a specific eye element based on its annotation.

- **`showEye(annotation: string) => void`:** Shows a specific eye element based on its annotation.

#### Other

- **`updateLabelContent(annotation: string, data: TranslationLabel) => void`:** Updates the text content of a label. Implies the potential for multi-lingual support.

### Additional Notes

- **`IPosition` Interface:** Likely defines a 3D coordinate (`x`, `y`, `z`).
- **`IModelTargetMapper` Interface:** (Not shown) likely defines how morph targets are configured on the 3D model.
- **`TranslationLabel` Interface** (Not shown) likely defines the structure of label text and its translations.

export const INITIAL_CAMERA_POSITION = {
  x: 0,
  y: 1,
  z: 3.5,
};

export const INITIAL_DUAL_CAMERA_POSITION = {
  x: 0,
  y: 1,
  z: -3.5,
};

export const INITIAL_CAMERA_TARGET = {
  x: 0,
  y: 1,
  z: 0,
};

export const LINE_COLOR = 0xff0283;

export const MODEL_KEYS = {
  BodyKey: "body",
  BodyIndicator: "bodyindicator",
  CameraKey: "camera",
  TargetKey: "target",
  AnnotationKey: "annotation",
  WaistKey: "waist",
};

export const CAMERA_CONFIG = {
  fov: 39.6,
  near: 0.1,
  far: 20,
  minDistance: 1,
  maxDistance: 3.5,
  maxZoomable: 3.0,
  hideLabelDistance: 3.0,
  rotationLock: {
    vertical: {
      min: Math.PI * 0.33, //-Math.PI / 4,
      max: Math.PI * 0.66,
    },
    horizontal: {
      min: 0,
      max: Math.PI * 2,
    },
  },
};

export const ANIMATION_DURATION = 0.7;

export const HIDDEN_CSS_CLASS = "hidden";

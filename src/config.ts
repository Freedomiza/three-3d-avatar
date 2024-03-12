export const DEFAULT_EYE_SCALE = 0.1;

export const INITIAL_CAMERA_POSITION = {
  x: -2.5,
  y: 1,
  z: 0,
};

export const INITIAL_DUAL_CAMERA_POSITION = {
  x: -3.5,
  y: 1,
  z: 0,
};

export const INITIAL_CAMERA_TARGET = {
  x: 0,
  y: 1,
  z: 0,
};

export const INITIAL_CAMERA_ROTATION_LOCK = {
  vertical: {
    min: -Math.PI / 4,
    max: Math.PI / 2,
  },
  horizontal: {
    min: 0,
    max: Math.PI,
  },
};

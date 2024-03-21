export interface IAnnotationConfig {
  name: string;
  label: string;
  position: string;
  indicator?: string;
  camera?: ICamera;
}

export interface ICamera {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export class AnnotationConfig implements IAnnotationConfig {
  constructor(json: IAnnotationConfig) {
    this.name = json.name;
    this.label = json.label;
    // this.unit = json.unit;
    this.position = json.position;
    this.indicator = json.indicator;
    this.camera = json.camera;
    // this.unit: string;
  }
  name: string;
  label: string;
  position: string;
  indicator?: string | undefined;
  camera?: ICamera | undefined;

  updateTranslation = (translation: Record<string, string>) => {
    // console.log(translation, this.name);
    if (Object.keys(translation).includes(this.name)) {
      if (typeof translation[this.name] === "string")
        this.label = translation[this.name] as string;
    }
  };
}

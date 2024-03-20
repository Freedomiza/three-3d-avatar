import { HIDDEN_CSS_CLASS } from "./config";
import { IMeasurementData } from "./models/base";
import { TranslationLabel } from "./models/translation-label";

export const createHTMLLabel = ({
  title,
  value,
  onPointerDown,
  position,
}: {
  title: string;
  value: string;
  position: string;
  onPointerDown?: () => void;
}) => {
  const labelDiv = document.createElement("div");

  labelDiv.className = `annotation-label annotation-${position}`;

  labelDiv.innerHTML = `
  
    <span class="annotation-label-title">${title}</span>
    <div class="line"> </div>
    <span class="annotation-label-value">${value}</span>
  `;

  labelDiv.addEventListener("pointerdown", () => onPointerDown?.());

  return labelDiv;
};

export const createHTMLEyeBox = (onPointerDown: () => void) => {
  const element = document.createElement("div");
  element.className = "annotation-label-arrow";

  element.addEventListener("pointerdown", () => onPointerDown?.());

  return element;
};

export const updateHTMLLabel = (
  element: HTMLElement,
  data: TranslationLabel
) => {
  if (data.label) {
    const title = element.querySelector(".annotation-label-title");
    if (title) {
      title.textContent = data.label;
    }
  }
  if (data.value) {
    const value = element.querySelector(".annotation-label-value");
    if (value) {
      value.textContent = data.value;
    }
  }
};

export function debounce<Params extends any[]>(
  func: (...args: Params) => any,
  timeout: number
): (...args: Params) => void {
  let timer: number;
  return (...args: Params) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

export function convert(measurement: IMeasurementData, unit: string) {
  //measurement in mm
  const { value } = measurement;
  switch (unit) {
    case "cm":
      return value * 0.1;
    case "feet":
      return value / 304.8;
    case "inches":
      return value / 25.4;
    default:
      return value;
  }
}

export function formatMeasurement(
  measurement?: IMeasurementData,
  unit: string = "cm",
  precision: number = 1
) {
  if (!measurement) return "";
  return `${convert(measurement, unit).toFixed(precision)} ${unit}`;
}

export const hideElement = (element?: HTMLElement) => {
  if (element) element.classList.add(HIDDEN_CSS_CLASS);
};

export const showElement = (element?: HTMLElement) => {
  if (element) element.classList.remove(HIDDEN_CSS_CLASS);
};

export const createDomNode = (
  document: Document,
  className: string = "renderer"
) => {
  const div = document.createElement("div");
  div.classList.add(className);

  document.body.appendChild(div);
  // this.domNode = div;
  return div;
};

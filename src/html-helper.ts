import { HIDDEN_CSS_CLASS } from "./config";
import { IMeasurementData, MetricsType } from "./models/base";
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
  if (onPointerDown) {
    labelDiv.addEventListener("pointerdown", onPointerDown);
  }

  return labelDiv;
};

export const createHTMLEyeBox = (onPointerDown?: () => void) => {
  const element = document.createElement("div");
  element.className = "annotation-label-arrow";
  if (onPointerDown) element.addEventListener("pointerdown", onPointerDown);

  return element;
};

export const updateHTMLLabel = (
  element: HTMLElement,
  data: TranslationLabel
) => {
  if (data.label) {
    const titleNode = element.querySelector(".annotation-label-title");
    if (titleNode) {
      titleNode.textContent = data.label;
    }
  }
  if (data.value) {
    const valueNode = element.querySelector(".annotation-label-value");
    if (valueNode) {
      valueNode.textContent = data.value;
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

export function convert(
  measurement: IMeasurementData,
  displayUnit: MetricsType
) {
  //measurement in mm
  const { value, unit } = measurement;
  let valueAsMM = value;
  switch (unit) {
    case "cm":
      valueAsMM = value * 10;
      break;
    case "feet":
      valueAsMM = value * 304.8;
      break;
    case "in":
      valueAsMM = value * 25.4;
      break;
    case "mm":
    default:
      break;
  }

  switch (displayUnit) {
    case "cm":
      return valueAsMM / 10;
    case "feet":
      return valueAsMM / 304.8;
    case "in":
      return valueAsMM / 25.4;
    default:
      return valueAsMM;
  }
}

export function formatMeasurement(
  measurement?: IMeasurementData,
  unit: MetricsType = "cm",
  precision: number = 1
) {
  if (!measurement) return "";
  return `${convert(measurement, unit).toFixed(precision)} ${getMeasurementUnit(
    unit
  )}`;
}

export const getMeasurementUnit = (unit: MetricsType): string => {
  switch (unit) {
    case "feet":
      return "ft";
    default:
      return unit;
  }
};

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
  return div;
};

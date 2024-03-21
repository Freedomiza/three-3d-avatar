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

export const createHTMLTooltips = ({
  name,
  title,
  value,
}: {
  name: string;
  title: string;
  value: string;
}) => {
  const tooltipDiv = document.createElement("div");
  tooltipDiv.setAttribute("data-name", name);

  tooltipDiv.className = "annotation-tooltip";
  tooltipDiv.innerHTML = `
  <span class="annotation-label-title">${title}</span>  
  <span class="annotation-label-value">${value}</span>
`;
  return tooltipDiv;
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

export const isElementHidden = (element: HTMLElement) => {
  return element.classList.contains(HIDDEN_CSS_CLASS);
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

// @see https://stackoverflow.com/questions/71459572/not-possible-to-detect-webview-with-javascript-and-user-agent-on-old-android-ver
const rules = [
  // If it says it's a webview, let's go with that.
  "WebView",
  // iOS webview will be the same as safari but missing "Safari".
  "(iPhone|iPod|iPad)(?!.*Safari)",
  // https://developer.chrome.com/docs/multidevice/user-agent/#webview_user_agent
  "Android.*Version/[0-9].[0-9]",
  // Also, we should save the wv detected for Lollipop.
  // Android Lollipop and Above: webview will be the same as native,
  // but it will contain "wv".
  "Android.*wv",
  // Old chrome android webview agent
  "Linux; U; Android",
];

export const isInApp = () => {
  const userAgent: string | undefined =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  if (userAgent) {
    const regex = new RegExp(`(${rules.join("|")})`, "ig");

    return !!userAgent.match(regex);
  }

  return false;
};

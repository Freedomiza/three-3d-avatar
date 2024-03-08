import { TranslationLabel } from "./models/translation-label";

export const createHTMLLabel = (
  document: Document,
  {
    title,
    value,
    onPointerDown,
    position,
  }: {
    title: string;
    value: string;
    position: string;
    onPointerDown?: () => void;
  }
) => {
  const labelDiv = document.createElement("div");

  labelDiv.className = `annotation-label annotation-${position}`;

  labelDiv.innerHTML = `
  
    <span class="annotation-label-title">${title}</span>
    <hr class="line" />
    <span class="annotation-label-value">${value}</span>
  `;

  labelDiv.addEventListener("pointerdown", () => onPointerDown?.());

  return labelDiv;
};

export const createHTMLEyeBox = (
  document: Document,
  onPointerDown: () => void
) => {
  const element = document.createElement("div");
  element.className = "annotation-label-arrow ";
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

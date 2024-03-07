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

// export const moveCamera = (euler, zoom) {

// }

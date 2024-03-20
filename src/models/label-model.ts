import { computePosition, shift, offset, size } from "@floating-ui/dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  createDomNode,
  hideElement,
  showElement,
  updateHTMLLabel,
} from "../html-helper";

export class LabelModel {
  padding: number = 15;
  eyeSprite: CSS2DObject;
  label: HTMLDivElement;
  arrowEl: HTMLDivElement;

  placement: string = "right";
  isVisible = true;

  constructor(
    label: HTMLDivElement,
    eyeSprite: CSS2DObject,
    placement: string
  ) {
    this.label = label;

    this.arrowEl = createDomNode(document, "arrow");
    document.body.appendChild(this.arrowEl);

    this.eyeSprite = eyeSprite;
    this.placement = placement;
  }

  remove = () => {
    this.eyeSprite.remove();
    this.label.remove();
    this.arrowEl.remove();
  };

  updatePosition = () => {
    const startDiv = this.eyeSprite.element;
    const tooltips = this.label;
    const arrowEl = this.arrowEl;
    const padding = this.padding;
    const placement = this.placement;
    // console.log("re-render");

    if (!startDiv || !tooltips) return;
    // console.log({ startDiv });
    // if (
    //   tooltips.classList.contains("hidden") ||
    //   arrowEl.classList.contains("hidden")
    // ) {
    //   console.log("element hidden");
    //   // console.log(startDiv);
    //   return;
    // }

    computePosition(startDiv, arrowEl, {
      middleware: [
        offset({
          mainAxis: -16,
        }),
        shift({
          //   mainAxis: false,
          //   crossAxis: true,
          padding: { left: padding, right: padding },
        }),
        size({
          apply({ availableWidth, availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxWidth: `${availableWidth - padding}px`,
              maxHeight: `${availableHeight}px`,
            });
          },
        }),
      ],
      placement: placement === "right" ? "right" : "left",
      strategy: "absolute",
    }).then(({ x, y }) => {
      Object.assign(arrowEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    computePosition(startDiv, tooltips, {
      middleware: [
        offset({
          mainAxis: window.innerWidth / 2,
          // crossAxis: 10,
        }),
        shift({
          mainAxis: false,
          crossAxis: true,
          padding: 15,
        }),
      ],
      placement: placement === "right" ? "right" : "left",
      strategy: "absolute",
    }).then(({ x, y }) => {
      Object.assign(tooltips.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  };

  updateVisibility(visible: boolean) {
    const opacity = (visible ? 1 : 0.4).toString();
    this.eyeSprite.element.style.opacity = opacity;
    this.label.style.opacity = opacity;
    this.arrowEl.style.opacity = opacity;
  }

  _hidden: boolean = false;

  hide = () => {
    if (this._hidden === true) return;
    this._hidden = true;
    hideElement(this.label);
    hideElement(this.arrowEl);
  };
  show = () => {
    this._hidden = false;
    showElement(this.label);
    showElement(this.arrowEl);
  };

  toggleEye = (value: boolean) => {
    this.eyeSprite.visible = value;
  };

  updateValue = (valueStr: string) => {
    updateHTMLLabel(this.label, {
      label: undefined,
      value: valueStr,
    });
  };
}

import { computePosition, shift, offset, size } from "@floating-ui/dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { hideElement, showElement, updateHTMLLabel } from "../html-helper";
import { findAnnotationConfigByKey } from "../model-helper";

export class LabelModel {
  key: string;
  padding: number = 15;
  eyeSprite: CSS2DObject;
  label: HTMLDivElement;
  tooltips: HTMLDivElement;
  arrowEl: HTMLDivElement;

  placement: string = "right";
  isVisible = true;
  tooltipVisible = false;

  constructor(
    key: string,
    label: HTMLDivElement,
    tooltips: HTMLDivElement,
    arrowEl: HTMLDivElement,
    eyeSprite: CSS2DObject,
    placement: string
  ) {
    this.key = key;
    this.label = label;
    this.tooltips = tooltips;
    hideElement(tooltips);
    this.arrowEl = arrowEl;
    // document.body.appendChild(this.arrowEl);

    this.eyeSprite = eyeSprite;
    this.placement = placement;
  }

  remove = () => {
    this.eyeSprite.remove();
    this.label.remove();
    this.arrowEl.remove();
    this.tooltips.remove();
  };

  showTooltip = () => {
    this.tooltipVisible = true;
    showElement(this.tooltips);
    this.updatePosition();
  };

  hideTooltip = () => {
    this.tooltipVisible = false;
    hideElement(this.tooltips);
    this.updatePosition();
  };

  updatePosition = () => {
    const eyeDiv = this.eyeSprite.element;
    const label = this.label;
    const arrowEl = this.arrowEl;
    const padding = this.padding;
    const placement = this.placement;
    const tooltips = this.tooltips;

    // if (this.tooltipVisible && this.isVisible) {
    //   showElement(tooltips);
    // } else {
    //   hideElement(tooltips);
    // }
    // console.log("re-render");

    if (!eyeDiv || !label) return;
    // console.log({ startDiv });

    computePosition(eyeDiv, arrowEl, {
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

    computePosition(eyeDiv, label, {
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
      Object.assign(label.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    computePosition(eyeDiv, tooltips, {
      middleware: [
        offset({
          crossAxis: 10,
        }),
        // shift({
        //   mainAxis: false,
        //   crossAxis: true,
        //   padding: 15,
        // }),
      ],
      placement: "top",
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
    // this.eyeSprite.visible = value;
    this.eyeSprite.element.style.opacity = (value ? 1 : 0).toString();
  };

  updateValue = (valueStr: string) => {
    updateHTMLLabel(this.label, {
      label: undefined,
      value: valueStr,
    });
    updateHTMLLabel(this.tooltips, {
      label: undefined,
      value: valueStr,
    });
  };

  updateUI() {
    const foundConfig = findAnnotationConfigByKey(this.key);
    if (foundConfig) {
      updateHTMLLabel(this.label, {
        label: foundConfig.label,
      });

      updateHTMLLabel(this.tooltips, {
        label: foundConfig.label,
      });

      this.updatePosition();
    }
  }
}

/*! kelpui v0.20.1 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
"use strict";
(() => {
  // modules/js/utilities/debug.js
  function debug(elem, detail = "") {
    const event = new CustomEvent("kelp:debug", {
      bubbles: true,
      detail
    });
    return elem.dispatchEvent(event);
  }

  // modules/js/utilities/emit.js
  function emit(elem, component, id, detail = null, cancelable = false) {
    const event = new CustomEvent(`kelp-${component}:${id}`, {
      bubbles: true,
      cancelable,
      detail
    });
    return elem.dispatchEvent(event);
  }

  // modules/js/utilities/ready.js
  function ready(instance) {
    if (document.readyState !== "loading") {
      instance.init();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => instance.init(), { once: true });
  }

  // modules/js/utilities/setTextAsID.js
  function setTextAsID(elem) {
    if (elem.id) return;
    const id = elem.textContent?.replace(/[^a-zA-Z0-9-_\u00A0-\uFFEF\s-]/g, "-").replace(/[\s-]+/g, "-");
    if (!id) return;
    let suffix = 0;
    let existing = document.querySelector(`#kelp_${id}`);
    while (existing) {
      suffix++;
      existing = document.querySelector(`#kelp_${id}_${suffix}`);
    }
    elem.id = `kelp_${id}${suffix ? `_${suffix}` : ""}`;
  }

  // modules/js/components/heading-anchors.js
  customElements.define("kelp-heading-anchors", class extends HTMLElement {
    /** @type String */
    #icon;
    /** @type String */
    #levels;
    /** @type Boolean */
    #before;
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Initialize the component
    init() {
      if (this.hasAttribute("is-ready")) return;
      this.#icon = this.getAttribute("icon") || "#";
      this.#levels = this.getAttribute("levels") || "h2, h3, h4, h5, h6";
      this.#before = this.hasAttribute("before");
      if (!this.render()) {
        debug(this, "No matching headings were found");
        return;
      }
      emit(this, "heading-anchors", "ready");
      this.setAttribute("is-ready", "");
    }
    // Render the anchor links
    render() {
      const headings = this.querySelectorAll(this.#levels);
      if (!headings.length) return;
      for (const heading of headings) {
        heading.classList.add("anchor-h");
        setTextAsID(heading);
        const text = `<span class="anchor-text">${heading.innerHTML}</span>`;
        const icon = `<span class="anchor-icon" aria-hidden="true">${this.#icon}</span>`;
        heading.innerHTML = `<a class="anchor-link" href="#${heading.id}">
					${this.#before ? `${icon} ${text}` : `${text} ${icon}`}
				</a>`;
      }
      return true;
    }
  });
})();

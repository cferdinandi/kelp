/*! kelpui v0.15.0 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
"use strict";
(() => {
  // modules/js/utilities/debug.js
  function debug(elem, detail = "") {
    const event = new CustomEvent("kelp-debug", {
      bubbles: true,
      detail
    });
    return elem.dispatchEvent(event);
  }

  // modules/js/utilities/emit.js
  function emit(elem, component, id, detail = null) {
    const event = new CustomEvent(`kelp:${component}-${id}`, {
      bubbles: true,
      cancelable: true,
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

  // modules/js/components/autogrow.js
  customElements.define("kelp-autogrow", class extends HTMLElement {
    /** @type HTMLTextAreaElement | null */
    #textarea;
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Handle events
    handleEvent() {
      this.setAttribute("data-replicated-value", this.#textarea?.value ?? "");
    }
    // Initialize the component
    init() {
      if (this.hasAttribute("is-ready")) return;
      this.#textarea = this.querySelector("textarea");
      if (!this.#textarea) {
        debug(this, "No textarea was found");
        return;
      }
      this.#textarea.addEventListener("input", this);
      this.setAttribute("data-replicated-value", this.#textarea.value);
      emit(this, "autogrow", "ready");
      this.setAttribute("is-ready", "");
    }
  });
})();

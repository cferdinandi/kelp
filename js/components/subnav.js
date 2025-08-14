/*! kelpui v0.18.0 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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

  // modules/js/utilities/reinit.js
  function reinit(instance, callback) {
    if (!instance.hasAttribute("is-ready")) return false;
    if (!instance.hasAttribute("is-paused") || typeof callback !== "function") return true;
    callback();
    instance.removeAttribute("is-paused");
    return true;
  }

  // modules/js/components/subnav.js
  customElements.define("kelp-subnav", class extends HTMLElement {
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Cleanup global events on disconnect
    disconnectedCallback() {
      document.removeEventListener("click", this);
      document.removeEventListener("keydown", this);
      this.setAttribute("is-paused", "");
    }
    // Initialize the component
    init() {
      const isInit = reinit(this, () => this.#listen());
      if (isInit) return;
      if (!this.querySelector("details")) {
        debug(this, "No subnav was found");
        return;
      }
      this.#listen();
      emit(this, "subnav", "ready");
      this.setAttribute("is-ready", "");
    }
    // Setup event listeners
    #listen() {
      document.addEventListener("click", this);
      document.addEventListener("keydown", this);
    }
    /**
     * Handle events
     * @param  {Event} event The event object
     */
    handleEvent(event) {
      if (event.type === "click") {
        return this.#onClick();
      }
      this.#onKeydown(event);
    }
    /**
     * Handle click events
     */
    #onClick() {
      const navs = this.querySelectorAll("details[open]:not(:has(:focus))");
      for (const nav of navs) {
        nav.removeAttribute("open");
      }
    }
    /**
     * Handle keydown events
     * @param  {Event} event The event object
     */
    #onKeydown(event) {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key !== "Escape") return;
      const navs = this.querySelectorAll("details[open]");
      for (const nav of navs) {
        const hasFocus = nav.matches(":has(:focus)");
        nav.removeAttribute("open");
        if (hasFocus) {
          const summary = nav.querySelector("summary");
          summary?.focus();
        }
      }
    }
  });
})();

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

  // modules/js/components/toggle-pw.js
  customElements.define("kelp-toggle-pw", class extends HTMLElement {
    /** @type NodeList */
    #passwords;
    /** @type HTMLButtonElement | null */
    #btn;
    /** @type HTMLInputElement | null */
    #checkbox;
    /** @type Boolean */
    #isVisible;
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Initialize the component
    init() {
      if (this.hasAttribute("is-ready")) return;
      this.#passwords = this.querySelectorAll('[type="password"]');
      const toggle = this.querySelector("[toggle]");
      this.#btn = toggle?.tagName.toLowerCase() === "button" ? (
        /** @type {HTMLButtonElement} */
        toggle
      ) : null;
      this.#checkbox = toggle?.getAttribute("type") === "checkbox" ? (
        /** @type {HTMLInputElement} */
        toggle
      ) : null;
      const startVisible = this.hasAttribute("visible");
      this.#isVisible = startVisible;
      if (!this.#btn && !this.#checkbox) {
        debug(this, "No password toggle found");
        return;
      }
      if (!this.#passwords.length) {
        debug(this, "No password fields found");
        return;
      }
      if (this.#btn) {
        this.#btn.setAttribute("aria-pressed", startVisible.toString());
        this.#btn.setAttribute("type", "button");
      }
      if (startVisible) {
        if (this.#checkbox) {
          this.#checkbox.checked = true;
        }
        this.show();
      }
      this.#btn?.addEventListener("click", this);
      this.#checkbox?.addEventListener("input", this);
      emit(this, "toggle-pw", "ready");
      this.setAttribute("is-ready", "");
    }
    // readonly property
    // Returns true if password is visible
    get isVisible() {
      return this.#isVisible;
    }
    // Handle events
    handleEvent() {
      this.toggle();
    }
    // Toggle password visibility on or off
    toggle() {
      if (this.#isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }
    // Show passwords
    show() {
      this.#isVisible = true;
      for (const pw of this.#passwords) {
        pw.setAttribute("type", "text");
      }
      this.#btn?.setAttribute("aria-pressed", "true");
      if (this.#checkbox) {
        this.#checkbox.checked = true;
      }
      emit(this, "toggle-pw", "show");
    }
    // Hide password visibility
    hide() {
      this.#isVisible = false;
      for (const pw of this.#passwords) {
        pw.setAttribute("type", "password");
      }
      this.#btn?.setAttribute("aria-pressed", "false");
      if (this.#checkbox) {
        this.#checkbox.checked = false;
      }
      emit(this, "toggle-pw", "hide");
    }
  });
})();

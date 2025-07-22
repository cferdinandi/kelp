/*! kelpui v0.14.6 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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

  // modules/js/components/toc.js
  customElements.define("kelp-toc", class extends HTMLElement {
    /** @type Boolean */
    #nested;
    /** @type String */
    #level;
    /** @type String | null */
    #heading;
    /** @type String | null */
    #headingType;
    /** @type String */
    #target;
    /** @type String | null */
    #listClass;
    /** @type String */
    #listType;
    /** @type Object */
    #index;
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Initialize the component
    init() {
      if (this.hasAttribute("is-ready")) return;
      this.#nested = this.hasAttribute("nested");
      this.#level = this.getAttribute("level") || (this.#nested ? "h2, h3, h4, h5, h6" : "h2");
      this.#heading = this.getAttribute("heading");
      this.#headingType = this.getAttribute("heading-type") || (this.#nested ? "h2" : "li");
      this.#target = this.getAttribute("target") || "";
      this.#listClass = this.getAttribute("list-class") || (this.#nested ? null : "list-inline");
      this.#listType = this.getAttribute("list-type") || "ul";
      this.#index = {
        val: 0
      };
      if (!this.render()) {
        debug(this, "No matching headings were found");
        return;
      }
      emit(this, "toc", "ready");
      this.setAttribute("is-ready", "");
    }
    // Render the TOC
    render() {
      const headings = document.querySelectorAll(`${this.#target} :is(${this.#level})`);
      if (!headings.length) return;
      this.innerHTML = this.#createList(headings, true);
      return true;
    }
    /**
     * Create the list HTML
     * Runs recursively on nested ToCs
     * @param  {NodeList} headings The headings to generate the list from
     * @param  {Boolean}  isFirst  If true, this is the start of the list
     * @return {String}            The HTML string
     */
    #createList(headings, isFirst = false) {
      this.#index.val = isFirst ? 0 : this.#index.val + 1;
      let list = "";
      for (; this.#index.val < headings.length; this.#index.val++) {
        const heading = (
          /** @type {Element} */
          headings[this.#index.val]
        );
        setTextAsID(heading);
        const currentLevel = heading.tagName.slice(1);
        list += `<li>
					<a class="link-subtle" href="#${heading.id}">${heading.textContent}</a>
					${this.#nested && /** @type {Element} */
        (headings[this.#index.val + 1]?.tagName.slice(1) || currentLevel) > currentLevel ? this.#createList(headings) : ""}
				</li>`;
        if (!isFirst && /** @type {Element} */
        (headings[this.#index.val + 1]?.tagName.slice(1) || currentLevel) < currentLevel) break;
      }
      const renderHeading = isFirst && this.#heading;
      return `
			${renderHeading && this.#headingType !== "li" ? `<${this.#headingType}>${this.#heading}</${this.#headingType}>` : ""}
			<${this.#listType} ${this.#listClass ? `class="${this.#listClass}"` : ""}>
				${renderHeading && this.#headingType === "li" ? `<li><strong>${this.#heading}</strong></li>` : ""}
				${list}
			</${this.#listType}>`;
    }
  });

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
      emit(this, "headinganchors", "ready");
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
      emit(this, "togglepw", "ready");
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
      emit(this, "togglepw", "show");
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
      emit(this, "togglepw", "hide");
    }
  });

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

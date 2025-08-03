/*! kelpui v0.15.1 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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
      this.#index = 0;
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
      this.#index = isFirst ? 0 : this.#index + 1;
      let list = "";
      for (; this.#index < headings.length; this.#index++) {
        const heading = (
          /** @type {Element} */
          headings[this.#index]
        );
        setTextAsID(heading);
        const currentLevel = heading.tagName.slice(1);
        list += `<li>
					<a class="link-subtle" href="#${heading.id}">${heading.textContent}</a>
					${this.#nested && /** @type {Element} */
        (headings[this.#index + 1]?.tagName.slice(1) || currentLevel) > currentLevel ? this.#createList(headings) : ""}
				</li>`;
        if (!isFirst && /** @type {Element} */
        (headings[this.#index + 1]?.tagName.slice(1) || currentLevel) < currentLevel) break;
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
})();

/*! kelpui v0.18.2 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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

  // modules/js/components/tabs.js
  customElements.define("kelp-tabs", class extends HTMLElement {
    /** @type String | null */
    #start;
    /** @type Boolean */
    #isVertical;
    /** @type HTMLElement | null */
    #list;
    // Initialize on connect
    connectedCallback() {
      ready(this);
    }
    // Cleanup global events on disconnect
    disconnectedCallback() {
      document.removeEventListener("keydown", this);
      this.setAttribute("is-paused", "");
    }
    // Initialize the component
    init() {
      const isInit = reinit(this, () => document.addEventListener("keydown", this));
      if (isInit) return;
      this.#start = this.getAttribute("start");
      this.#isVertical = this.hasAttribute("vertical");
      this.#list = this.querySelector("[tabs]");
      if (!this.render()) {
        debug(this, "No tabs were was found");
        return;
      }
      this.#list?.addEventListener("click", this);
      document.addEventListener("keydown", this);
      emit(this, "tabs", "ready");
      this.setAttribute("is-ready", "");
    }
    // Render the TOC
    render() {
      const listItems = this.#list?.querySelectorAll("li") || [];
      const links = this.#list?.querySelectorAll("a");
      if (!this.#list || !links?.length) return;
      this.#list.setAttribute("role", "tablist");
      if (this.#isVertical) {
        this.#list.setAttribute("aria-orientation", "vertical");
      }
      for (const item of listItems) {
        item.setAttribute("role", "presentation");
      }
      links.forEach((link, index) => {
        const pane = this.querySelector(link.hash);
        if (!pane) {
          (link.closest("li") || link).remove();
          debug(this, `A tab pane for ${link.textContent} with the ID ${link.hash} could not be found. The corresponding tab was removed.`);
          return;
        }
        const isActive = this.#start ? this.#start === link.hash : index === 0;
        const btn = document.createElement("button");
        btn.innerHTML = link.innerHTML;
        btn.id = link.id || `tab_${pane.id}`;
        btn.setAttribute("type", "button");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", link.hash.slice(1));
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        if (!isActive) {
          btn.setAttribute("tabindex", "-1");
        }
        link.replaceWith(btn);
        pane.setAttribute("role", "tabpanel");
        pane.setAttribute("aria-labelledby", btn.id);
        if (!isActive) {
          pane.setAttribute("hidden", "");
        }
      });
      return true;
    }
    /**
     * Handle events
     * @param  {Event} event The event object
     */
    handleEvent(event) {
      if (event.type === "click") {
        return this.#onClick(event);
      }
      this.#onKeydown(event);
    }
    /**
     * Handle click events
     * @param  {Event} event The event object
     */
    #onClick(event) {
      const btn = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
      if (!btn) return;
      if (btn.matches('[aria-selected="true"]')) return;
      this.select(btn);
    }
    /**
     * Handle keydown events
     * @param  {Event} event The event object
     */
    #onKeydown(event) {
      if (!(event instanceof KeyboardEvent)) return;
      const keyNext = ["ArrowRight"];
      const keyPrev = ["ArrowLeft"];
      if (this.#isVertical) {
        keyNext.push("ArrowDown");
        keyPrev.push("ArrowUp");
      }
      if (![...keyNext, ...keyPrev].includes(event.key)) return;
      event.preventDefault();
      const tab = document.activeElement?.closest('[role="tab"]');
      if (!tab) return;
      if (!this.#list?.contains(tab)) return;
      const currentTab = this.#list.querySelector('[role="tab"][aria-selected="true"]');
      const listItem = currentTab?.closest("li");
      const nextListItem = keyNext.includes(event.key) ? listItem?.nextElementSibling : listItem?.previousElementSibling;
      const nextTab = nextListItem?.querySelector("button");
      if (!nextTab) return;
      this.select(nextTab);
      nextTab.focus();
    }
    /**
     * Toggle tab visibility
     * @param  {Element} tab The tab to show
     */
    select(tab) {
      if (!tab) return;
      const pane = this.querySelector(`#${tab?.getAttribute("aria-controls")}` || "");
      if (!pane) return;
      const currentTab = tab.closest('[role="tablist"]')?.querySelector('[aria-selected="true"]');
      const currentPane = this.querySelector(`#${currentTab?.getAttribute("aria-controls")}` || "");
      const event = emit(
        this,
        "tabs",
        "select-before",
        {
          currentTab,
          currentPane,
          nextTab: tab,
          nextPane: pane
        },
        true
      );
      if (!event) return;
      tab.setAttribute("aria-selected", "true");
      currentTab?.setAttribute("aria-selected", "false");
      pane.removeAttribute("hidden");
      currentPane?.setAttribute("hidden", "");
      tab.removeAttribute("tabindex");
      currentTab?.setAttribute("tabindex", "-1");
      emit(this, "tabs", "select", { tab, pane });
    }
  });

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
      const navs = this.querySelectorAll("details[open]:not(:focus-within)");
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

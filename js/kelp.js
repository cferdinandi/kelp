/*! kelpui v1.5.1 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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
    /** @type Boolean */
    #isManual;
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
      this.#isManual = this.hasAttribute("manual");
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
      const currentTab = this.#list?.querySelector('[role="tab"]:focus-within');
      if (!currentTab) return;
      event.preventDefault();
      const listItem = currentTab?.closest("li");
      const nextListItem = keyNext.includes(event.key) ? listItem?.nextElementSibling : listItem?.previousElementSibling;
      const nextTab = nextListItem?.querySelector("button");
      if (!nextTab) return;
      nextTab.focus();
      if (this.#isManual) return;
      this.select(nextTab);
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

  // modules/js/utilities/getFilteredSelector.js
  var exclude = ["kelp-tabs", "kelp-accordion", "dialog"];
  function getFilteredSelector(selector) {
    return `${selector}:not(${exclude.map((elem) => `${elem} ${selector}`)}) `;
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
      const selector = getFilteredSelector(`:is(${this.#level})`);
      const target = this.#target ? document.querySelector(this.#target) : document;
      const headings = target?.querySelectorAll(selector);
      if (!headings?.length) return;
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
      const selector = getFilteredSelector(`:is(${this.#levels})`);
      const headings = this.querySelectorAll(`:where(${selector}):not(:has(a)`);
      console.log(`:where(${selector}):not(:has(a)`);
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
      document.removeEventListener("keydown", this);
      this.removeEventListener("blur", this, { capture: true });
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
      document.addEventListener("keydown", this);
      this.addEventListener("blur", this, { capture: true });
    }
    /**
     * Handle events
     * @param  {Event} event The event object
     */
    handleEvent(event) {
      if (event.type === "blur") {
        return this.#onBlur();
      }
      this.#onKeydown(event);
    }
    /**
     * Handle click events
     */
    #onBlur() {
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

  // modules/js/components/invoker.polyfill.js
  //! Invoker Command API Polyfill by Keith Cirkel - https://github.com/keithamus/invokers-polyfill/tree/main - MIT License
  function isSupported() {
    return typeof HTMLButtonElement !== "undefined" && "command" in HTMLButtonElement.prototype && "source" in ((globalThis.CommandEvent || {}).prototype || {});
  }
  function apply() {
    document.addEventListener(
      "invoke",
      (e) => {
        if (e.type == "invoke" && e.isTrusted) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true
    );
    document.addEventListener(
      "command",
      (e) => {
        if (e.type == "command" && e.isTrusted) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true
    );
    function enumerate(obj, key, enumerable = true) {
      Object.defineProperty(obj, key, {
        ...Object.getOwnPropertyDescriptor(obj, key),
        enumerable
      });
    }
    function getRootNode(node) {
      if (node && typeof node.getRootNode === "function") {
        return node.getRootNode();
      }
      if (node && node.parentNode) return getRootNode(node.parentNode);
      return node;
    }
    const commandEventSourceElements = /* @__PURE__ */ new WeakMap();
    const commandEventActions = /* @__PURE__ */ new WeakMap();
    class CommandEvent extends Event {
      constructor(type, invokeEventInit = {}) {
        super(type, invokeEventInit);
        const { source, command } = invokeEventInit;
        if (source != null && !(source instanceof Element)) {
          throw new TypeError(`source must be an element`);
        }
        commandEventSourceElements.set(this, source || null);
        commandEventActions.set(
          this,
          command !== void 0 ? String(command) : ""
        );
      }
      get [Symbol.toStringTag]() {
        return "CommandEvent";
      }
      get source() {
        if (!commandEventSourceElements.has(this)) {
          throw new TypeError("illegal invocation");
        }
        const source = commandEventSourceElements.get(this);
        if (!(source instanceof Element)) return null;
        const invokerRoot = getRootNode(source);
        if (invokerRoot !== getRootNode(this.target || document)) {
          return invokerRoot.host;
        }
        return source;
      }
      get command() {
        if (!commandEventActions.has(this)) {
          throw new TypeError("illegal invocation");
        }
        return commandEventActions.get(this);
      }
      get action() {
        throw new Error(
          "CommandEvent#action was renamed to CommandEvent#command"
        );
      }
      get invoker() {
        throw new Error(
          "CommandEvent#invoker was renamed to CommandEvent#source"
        );
      }
    }
    enumerate(CommandEvent.prototype, "source");
    enumerate(CommandEvent.prototype, "command");
    class InvokeEvent extends Event {
      constructor(type, invokeEventInit = {}) {
        super(type, invokeEventInit);
        throw new Error(
          "InvokeEvent has been deprecated, it has been renamed to `CommandEvent`"
        );
      }
    }
    const invokerAssociatedElements = /* @__PURE__ */ new WeakMap();
    function applyInvokerMixin(ElementClass) {
      Object.defineProperties(ElementClass.prototype, {
        commandForElement: {
          enumerable: true,
          configurable: true,
          set(targetElement) {
            if (this.hasAttribute("invokeaction")) {
              throw new TypeError(
                "Element has deprecated `invokeaction` attribute, replace with `command`"
              );
            } else if (this.hasAttribute("invoketarget")) {
              throw new TypeError(
                "Element has deprecated `invoketarget` attribute, replace with `commandfor`"
              );
            } else if (targetElement === null) {
              this.removeAttribute("commandfor");
              invokerAssociatedElements.delete(this);
            } else if (!(targetElement instanceof Element)) {
              throw new TypeError(`commandForElement must be an element or null`);
            } else {
              this.setAttribute("commandfor", "");
              const targetRootNode = getRootNode(targetElement);
              const thisRootNode = getRootNode(this);
              if (thisRootNode === targetRootNode || targetRootNode === this.ownerDocument) {
                invokerAssociatedElements.set(this, targetElement);
              } else {
                invokerAssociatedElements.delete(this);
              }
            }
          },
          get() {
            if (this.localName !== "button") {
              return null;
            }
            if (this.hasAttribute("invokeaction") || this.hasAttribute("invoketarget")) {
              console.warn(
                "Element has deprecated `invoketarget` or `invokeaction` attribute, use `commandfor` and `command` instead"
              );
              return null;
            }
            if (this.disabled) {
              return null;
            }
            if (this.form && this.getAttribute("type") !== "button") {
              console.warn(
                "Element with `commandFor` is a form participant. It should explicitly set `type=button` in order for `commandFor` to work"
              );
              return null;
            }
            const targetElement = invokerAssociatedElements.get(this);
            if (targetElement) {
              if (targetElement.isConnected) {
                return targetElement;
              } else {
                invokerAssociatedElements.delete(this);
                return null;
              }
            }
            const root = getRootNode(this);
            const idref = this.getAttribute("commandfor");
            if ((root instanceof Document || root instanceof ShadowRoot) && idref) {
              return root.getElementById(idref) || null;
            }
            return null;
          }
        },
        command: {
          enumerable: true,
          configurable: true,
          get() {
            const value = this.getAttribute("command") || "";
            if (value.startsWith("--")) return value;
            const valueLower = value.toLowerCase();
            switch (valueLower) {
              case "show-modal":
              case "close":
              case "toggle-popover":
              case "hide-popover":
              case "show-popover":
                return valueLower;
            }
            return "";
          },
          set(value) {
            this.setAttribute("command", value);
          }
        },
        invokeAction: {
          enumerable: false,
          configurable: true,
          get() {
            throw new Error(
              `invokeAction is deprecated. It has been renamed to command`
            );
          },
          set(value) {
            throw new Error(
              `invokeAction is deprecated. It has been renamed to command`
            );
          }
        },
        invokeTargetElement: {
          enumerable: false,
          configurable: true,
          get() {
            throw new Error(
              `invokeTargetElement is deprecated. It has been renamed to command`
            );
          },
          set(value) {
            throw new Error(
              `invokeTargetElement is deprecated. It has been renamed to command`
            );
          }
        }
      });
    }
    const onHandlers = /* @__PURE__ */ new WeakMap();
    Object.defineProperties(HTMLElement.prototype, {
      oncommand: {
        enumerable: true,
        configurable: true,
        get() {
          oncommandObserver.takeRecords();
          return onHandlers.get(this) || null;
        },
        set(handler) {
          const existing = onHandlers.get(this) || null;
          if (existing) {
            this.removeEventListener("command", existing);
          }
          onHandlers.set(
            this,
            typeof handler === "object" || typeof handler === "function" ? handler : null
          );
          if (typeof handler == "function") {
            this.addEventListener("command", handler);
          }
        }
      }
    });
    function applyOnCommandHandler(els) {
      for (const el of els) {
        el.oncommand = new Function("event", el.getAttribute("oncommand"));
      }
    }
    const oncommandObserver = new MutationObserver((records) => {
      for (const record of records) {
        const { target } = record;
        if (record.type === "childList") {
          applyOnCommandHandler(target.querySelectorAll("[oncommand]"));
        } else {
          applyOnCommandHandler([target]);
        }
      }
    });
    oncommandObserver.observe(document, {
      subtree: true,
      childList: true,
      attributeFilter: ["oncommand"]
    });
    applyOnCommandHandler(document.querySelectorAll("[oncommand]"));
    function handleInvokerActivation(event) {
      if (event.defaultPrevented) return;
      if (event.type !== "click") return;
      const oldInvoker = event.target.closest(
        "button[invoketarget], button[invokeaction], input[invoketarget], input[invokeaction]"
      );
      if (oldInvoker) {
        console.warn(
          "Elements with `invoketarget` or `invokeaction` are deprecated and should be renamed to use `commandfor` and `command` respectively"
        );
        if (oldInvoker.matches("input")) {
          throw new Error("Input elements no longer support `commandfor`");
        }
      }
      const source = event.target.closest("button[commandfor], button[command]");
      if (!source) return;
      if (source.form && source.getAttribute("type") !== "button") {
        event.preventDefault();
        throw new Error(
          "Element with `commandFor` is a form participant. It should explicitly set `type=button` in order for `commandFor` to work. In order for it to act as a Submit button, it must not have command or commandfor attributes"
        );
      }
      if (source.hasAttribute("command") !== source.hasAttribute("commandfor")) {
        const attr = source.hasAttribute("command") ? "command" : "commandfor";
        const missing = source.hasAttribute("command") ? "commandfor" : "command";
        throw new Error(
          `Element with ${attr} attribute must also have a ${missing} attribute to function.`
        );
      }
      if (source.command !== "show-popover" && source.command !== "hide-popover" && source.command !== "toggle-popover" && source.command !== "show-modal" && source.command !== "close" && !source.command.startsWith("--")) {
        console.warn(
          `"${source.command}" is not a valid command value. Custom commands must begin with --`
        );
        return;
      }
      const invokee = source.commandForElement;
      if (!invokee) return;
      const invokeEvent = new CommandEvent("command", {
        command: source.command,
        source,
        cancelable: true
      });
      invokee.dispatchEvent(invokeEvent);
      if (invokeEvent.defaultPrevented)
        return;
      const command = invokeEvent.command.toLowerCase();
      if (invokee.popover) {
        const canShow = !invokee.matches(":popover-open");
        const shouldShow = canShow && (command === "toggle-popover" || command === "show-popover");
        const shouldHide = !canShow && command === "hide-popover";
        if (shouldShow) {
          invokee.showPopover({ source });
        } else if (shouldHide) {
          invokee.hidePopover();
        }
      } else if (invokee.localName === "dialog") {
        const canShow = !invokee.hasAttribute("open");
        const shouldShow = canShow && command === "show-modal";
        const shouldHide = !canShow && command === "close";
        if (shouldShow) {
          invokee.showModal();
          source.setAttribute("aria-expanded", "true");
          source.setAttribute("aria-controls", invokee.id);
          invokee.addEventListener("close", () => {
            source.setAttribute("aria-expanded", "false");
            source.focus();
          }, { once: true });
        } else if (shouldHide) {
          invokee.close();
        }
      }
    }
    function setupInvokeListeners(target) {
      target.addEventListener("click", handleInvokerActivation, true);
    }
    function observeShadowRoots(ElementClass, callback) {
      const attachShadow = ElementClass.prototype.attachShadow;
      ElementClass.prototype.attachShadow = function(init) {
        const shadow = attachShadow.call(this, init);
        callback(shadow);
        return shadow;
      };
      const attachInternals = ElementClass.prototype.attachInternals;
      ElementClass.prototype.attachInternals = function() {
        const internals = attachInternals.call(this);
        if (internals.shadowRoot) callback(internals.shadowRoot);
        return internals;
      };
    }
    applyInvokerMixin(HTMLButtonElement);
    observeShadowRoots(HTMLElement, (shadow) => {
      setupInvokeListeners(shadow);
      oncommandObserver.observe(shadow, { attributeFilter: ["oncommand"] });
      applyOnCommandHandler(shadow.querySelectorAll("[oncommand]"));
    });
    setupInvokeListeners(document);
    Object.assign(globalThis, { CommandEvent, InvokeEvent });
  }
  if (!isSupported()) {
    apply();
  }
})();

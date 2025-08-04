/*! kelpui v0.16.2 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
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
    // Initialize the component
    init() {
      if (this.hasAttribute("is-ready")) return;
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
})();

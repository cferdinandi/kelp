/*! kelpui v1.14.1 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
"use strict";
(() => {
  // src/js/utilities/debug.js
  function debug(elem, detail = "") {
    const event = new CustomEvent("kelp:debug", {
      bubbles: true,
      detail
    });
    return elem.dispatchEvent(event);
  }

  // src/js/utilities/emit.js
  function emit(elem, component, id, detail = null, cancelable = false) {
    const event = new CustomEvent(`kelp-${component}:${id}`, {
      bubbles: true,
      cancelable,
      detail
    });
    return elem.dispatchEvent(event);
  }

  // src/js/utilities/ready.js
  function ready(instance) {
    if (document.readyState !== "loading") {
      instance.init();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => instance.init(), {
      once: true
    });
  }

  // src/js/components/form-validate.js
  customElements.define(
    "kelp-form-validate",
    class extends HTMLElement {
      /** @type HTMLFormElement | null */
      #form;
      /** @type NodeList */
      #groups;
      // Initialize on connect
      connectedCallback() {
        ready(this);
      }
      // Initialize the component
      init() {
        this.#form = this.querySelector("form");
        if (!this.#form) {
          debug(this, "No form was found");
          return;
        }
        this.#groups = this.#form.querySelectorAll("[validate-group]");
        this.#form.setAttribute("novalidate", "");
        this.#form.addEventListener("submit", this);
        this.#form.addEventListener("input", this);
        this.#form.addEventListener("blur", this, { capture: true });
        emit(this, "form-validate", "ready");
        this.setAttribute("is-ready", "");
      }
      /**
       * Handle events
       * @param {Event} event The event object
       */
      handleEvent(event) {
        if (event.type === "blur") {
          return this.#onBlur(event);
        }
        if (event.type === "input") {
          return this.#onInput(event);
        }
        this.#onSubmit(event);
      }
      /**
       * Handle input events
       * @param {Event} event The event object
       */
      #onInput(event) {
        if (!(event.target instanceof Element)) return;
        const group = event.target.closest("[validate-group]");
        const field = group || event.target;
        group?.setAttribute("validate-group", "interacted");
        if (!group && field.getAttribute("aria-invalid") !== "true") return;
        if (group) {
          this.#isGroupValid(group);
          return;
        }
        this.#isFieldValid(field);
      }
      /**
       * Handle blur events
       * @param {Event} event The event object
       */
      #onBlur(event) {
        if (!(event.target instanceof Element)) return;
        const group = event.target.closest('[validate-group="interacted"]');
        if (group) {
          this.#isGroupValid(group);
          return;
        }
        if (!event.target.matches(":user-invalid")) {
          this.#removeError(event.target);
          return;
        }
        this.#showError(event.target);
      }
      /**
       * Handle submit events
       * @param {Event} event The event object
       */
      #onSubmit(event) {
        const cancelled = !emit(
          this,
          "form-validate",
          "validate",
          { form: this.#form },
          true
        );
        if (cancelled) return;
        const areGroupsValid = this.#checkGroupValidity();
        const isValid = this.#checkFieldValidity() && areGroupsValid;
        if (isValid) {
          emit(this, "form-validate", "success", { form: this.#form });
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const firstInvalidField = this.#form?.querySelector(
          ':invalid, [aria-invalid="true"] :is([type="checkbox"], [type="radio"])'
        );
        firstInvalidField?.focus({ focusVisible: true });
        emit(this, "form-validate", "failed", { form: this.#form });
      }
      /**
       * Check the validity of fields that can be validated with HTMLFormElement.checkValidity().
       * Show error messages for fields that are not.
       *
       * @return {Boolean} If true, all fields are valid
       */
      #checkFieldValidity() {
        if (!this.#form || this.#form.checkValidity()) return true;
        const invalidFields = this.#form.querySelectorAll(":invalid");
        for (const field of invalidFields) {
          if (!(field instanceof HTMLElement)) continue;
          this.#showError(field);
        }
        return false;
      }
      /**
       * Check if an input is valid and show/remove errors
       * @param  {Element} field The field to validate
       * @return {Boolean}       If true, field is valid
       */
      #isFieldValid(field) {
        if (field.matches(":invalid")) {
          this.#showError(field);
          return false;
        }
        this.#removeError(field);
        return true;
      }
      /**
       * Check the validity of all input groups
       * @return {Boolean} If true, all groups are valid
       */
      #checkGroupValidity() {
        let isValid = true;
        for (const group of this.#groups) {
          if (!(group instanceof HTMLElement)) continue;
          if (this.#isGroupValid(group)) continue;
          isValid = false;
        }
        return isValid;
      }
      /**
       * Check if an input group is valid and show/remove errors
       * @param  {Element} group The input group
       * @return {Boolean}       If true, the group is valid
       */
      #isGroupValid(group) {
        if (group.querySelector("input:checked")) {
          this.#removeError(group);
          return true;
        }
        this.#showError(group, true);
        return false;
      }
      /**
       * Show error message on a field
       * @param  {Element} field   The field or fieldset
       * @param  {Boolean} isGroup If true, field is a fieldset input group
       */
      #showError(field, isGroup = false) {
        const errorMsg = this.#getMsg(field, isGroup);
        if (!errorMsg) return;
        field.setAttribute("aria-invalid", "true");
        const existingErrorID = field.getAttribute("aria-describedby");
        const existingErrorEl = existingErrorID ? this.#form?.querySelector(`#${existingErrorID}`) : null;
        const id = existingErrorID || `kelp-${crypto.randomUUID()}`;
        const errorEl = existingErrorEl || document.createElement("div");
        errorEl.textContent = errorMsg;
        errorEl.id = id;
        errorEl.className = "validation-error";
        field.setAttribute("aria-describedby", id);
        const location = isGroup ? "append" : "after";
        field[location](errorEl);
      }
      /**
       * Get the error message text
       * @param  {Element} field   The field or fieldset
       * @param  {Boolean} isGroup If true, field is a fieldset input group
       * @return {String}          The error message
       */
      #getMsg(field, isGroup = false) {
        const defaultMsg = isGroup ? field.querySelector('[type="checkbox"]') ? "Please select at least one option." : "Please select an option." : "validationMessage" in field ? (
          /** @type {string} */
          field.validationMessage
        ) : "";
        return field.getAttribute("validate-msg") || defaultMsg;
      }
      /**
       * Remove the error message from a field
       * @param  {Element} field The field or fieldset
       */
      #removeError(field) {
        field.removeAttribute("aria-invalid");
        const id = field.getAttribute("aria-describedby");
        if (!id) return;
        this.#form?.querySelector(`#${id}`)?.remove();
      }
    }
  );

  // src/js/utilities/getFromPath.js
  function stringToPath(path) {
    if (typeof path !== "string") return [];
    const output = [];
    for (const item of path.split(".")) {
      for (const key of item.split(/\[([^}]+)\]/g)) {
        if (key.length < 1) continue;
        output.push(key);
      }
    }
    return output;
  }
  function getFromPath(obj, path) {
    if (!obj || !path) return;
    const pathArr = stringToPath(path);
    let current = structuredClone(obj);
    for (const key of pathArr) {
      if (!current[key]) return;
      current = current[key];
    }
    return current;
  }

  // src/js/components/form-ajax.js
  customElements.define(
    "kelp-form-ajax",
    class extends HTMLElement {
      /** @type HTMLFormElement | null */
      #form;
      /** @type String | null */
      #externalForms;
      /** @type HTMLElement */
      #announce;
      /** @type String */
      #msgSubmitting;
      /** @type String */
      #msgFailed;
      /** @type String | null */
      #msgSuccess;
      /** @type String | null */
      #pathSuccess;
      /** @type String | null */
      #pathFailed;
      /** @type String | null */
      #pathRedirect;
      /** @type String | null */
      #redirectOnSuccess;
      /** @type Boolean */
      #submitLoading;
      /** @type HTMLElement | null */
      #loadingIcon;
      /** @type String */
      #msgClass;
      /** @type Boolean */
      #removeFormOnSuccess;
      /** @type Number */
      #dismissMsgOnSuccess;
      /** @type Boolean */
      #keepFields;
      /** @type Number */
      #delay;
      /** @type Array */
      #eventKeys;
      // Initialize on connect
      connectedCallback() {
        ready(this);
      }
      // Initialize the component
      init() {
        this.#form = this.querySelector("form");
        if (!this.#form) {
          debug(this, "No form was found");
          return;
        }
        this.#externalForms = this.getAttribute("external-forms");
        const announcePosition = this.hasAttribute("msg-start") ? "prepend" : "append";
        this.#announce = document.createElement("div");
        this.#announce.setAttribute("role", "status");
        this[announcePosition](this.#announce);
        this.#msgSubmitting = this.getAttribute("msg-submitting") ?? "Submitting...";
        this.#msgSuccess = this.getAttribute("msg-success");
        this.#msgFailed = this.getAttribute("msg-failed") ?? "Something went wrong. Unable to submit form.";
        this.#pathSuccess = this.getAttribute("path-success");
        this.#pathFailed = this.getAttribute("path-failed");
        this.#msgClass = this.getAttribute("msg-class") || "";
        this.#submitLoading = this.hasAttribute("submit-loading");
        this.#removeFormOnSuccess = this.hasAttribute("remove-form-on-success");
        this.#dismissMsgOnSuccess = this.hasAttribute("dismiss-msg-on-success") ? Number.parseInt(
          this.getAttribute("dismiss-msg-on-success") || "6000",
          10
        ) : 0;
        this.#redirectOnSuccess = this.getAttribute("redirect-on-success");
        this.#pathRedirect = this.getAttribute("path-redirect");
        this.#keepFields = this.hasAttribute("keep-fields");
        this.#delay = this.hasAttribute("delay") ? Number.parseInt(this.getAttribute("delay") || "6000", 10) : 0;
        this.#eventKeys = (this.getAttribute("event-keys")?.split(",") || [this.#form.action]).map((name) => name.trim()).filter((name) => !!name);
        this.#loadingIcon = this.#submitLoading ? document.createElement("div") : null;
        if (this.#loadingIcon) {
          this.#loadingIcon.innerHTML = `<div class="spinner ${this.getAttribute("submit-loading")}"></div>`;
          this.#loadingIcon.setAttribute("loading-icon", "");
          this.append(this.#loadingIcon);
        }
        this.#form.addEventListener("submit", this);
        emit(this, "form-ajax", "ready");
        this.setAttribute("is-ready", "");
      }
      /**
       * Handle events
       * @param {SubmitEvent} event The event object
       */
      handleEvent(event) {
        this.#onSubmit(event);
      }
      /**
       * Handle submit events
       * @param  {SubmitEvent} event The event object
       */
      async #onSubmit(event) {
        event.preventDefault();
        if (this.#isDisabled() || !this.#form) return;
        const submitter = this.#submitLoading ? this.#form.querySelector(":focus") : null;
        try {
          const formData = this.#getFormData(event.submitter);
          const cancelled = !emit(
            this,
            "form-ajax",
            "submit",
            {
              formData,
              eventKeys: this.#eventKeys
            },
            true
          );
          if (cancelled) return;
          this.#disable();
          this.#showStatus(this.#msgSubmitting, "submitting");
          const response = await this.#callAPI(formData);
          const data = await response.json();
          const failed = getFromPath(data, this.#pathFailed);
          if (failed) throw failed;
          if (!response.ok) throw response;
          const msgSuccess = getFromPath(data, this.#pathSuccess) ?? this.#msgSuccess ?? "";
          this.#showStatus(msgSuccess, "success");
          const redirect = getFromPath(data, this.#pathRedirect) ?? this.#redirectOnSuccess;
          if (redirect) {
            window.location.href = redirect;
          }
          this.#reset();
          if (this.#removeFormOnSuccess) {
            this.#form?.remove();
          }
          emit(this, "form-ajax", "success", {
            data,
            eventKeys: this.#eventKeys
          });
        } catch (error) {
          emit(this, "form-ajax", "failed", {
            error,
            eventKeys: this.#eventKeys
          });
          const msgError = typeof error === "string" ? error : Array.isArray(error) ? error.join(" ") : this.#msgFailed;
          this.#showStatus(msgError, "danger");
        } finally {
          setTimeout(() => {
            this.#enable();
            submitter?.focus();
          }, this.#delay);
        }
      }
      /**
       * Get FormData for the submitting form and any linked external forms
       * @param  {HTMLElement | null} submitter The submitting button
       * @return {FormData}                     The FormData object
       */
      #getFormData(submitter = null) {
        const formData = new FormData(this.#form ?? void 0, submitter);
        for (const form of this.#getExternalForms()) {
          if (!(form instanceof HTMLFormElement)) continue;
          const data = new FormData(form);
          for (const [key, value] of data) {
            formData.append(key, value);
          }
        }
        return formData;
      }
      /**
       * Get any linked external forms
       * @return {NodeList | Array}
       */
      #getExternalForms() {
        return this.#externalForms ? document.querySelectorAll(this.#externalForms) : [];
      }
      /**
       * Asynchronously call the API endpoint
       * @param  {FormData} formData The FormData object for the form(s)
       * @return {Promise}           The fetch object
       */
      #callAPI(formData) {
        if (!this.#form) throw new Error("No form found");
        const { action, method, enctype } = this.#form;
        const options = {
          method,
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        };
        if (enctype.toLowerCase() === "multipart/form-data") {
          options.body = formData;
          return fetch(action, options);
        }
        const params = new URLSearchParams(formData).toString();
        if (method.toLowerCase() === "get") {
          return fetch(`${action}?${params}`);
        }
        options.body = params;
        options.headers["Content-type"] = "application/x-www-form-urlencoded";
        return fetch(action, options);
      }
      /**
       * Update the form status text
       * @param  {String} msg  The message to display
       * @param  {String} type The status type (success | danger | submitting)
       */
      #showStatus(msg, type) {
        if (!this.#announce) return;
        this.#announce.innerHTML = msg;
        this.#announce.className = this.#submitLoading || !msg ? "" : `${type} ${this.#msgClass}`;
        if (type === "success" && this.#dismissMsgOnSuccess) {
          setTimeout(() => {
            if (!this.#announce) return;
            this.#announce.innerHTML = "";
            this.#announce.className = "";
          }, this.#dismissMsgOnSuccess);
        }
        this.#announce.classList.toggle(
          "visually-hidden",
          type === "submitting" && this.#submitLoading
        );
      }
      /**
       * Disable the form so it can't be submitted while waiting for an API response
       */
      #disable() {
        this.setAttribute("is-submitting", "");
      }
      /**
       * Re-enable the form after the API resolves
       */
      #enable() {
        this.removeAttribute("is-submitting");
      }
      /**
       * Check if the form is currently submitting to the API
       * @return {Boolean} If true, the form is submitting
       */
      #isDisabled() {
        return this.hasAttribute("is-submitting");
      }
      /**
       * Reset form element values
       */
      #reset() {
        if (this.#keepFields) return;
        this.#form?.reset();
        for (const form of this.#getExternalForms()) {
          if (!(form instanceof HTMLFormElement)) continue;
          form.reset();
        }
      }
    }
  );

  // src/js/components/html-ajax.js
  customElements.define(
    "kelp-html-ajax",
    class extends HTMLElement {
      /** @type String[] */
      #events;
      /** @type String[] */
      #keys;
      // Initialize on connect
      connectedCallback() {
        ready(this);
      }
      // Cleanup global events on disconnect
      disconnectedCallback() {
        for (const name of this.#events) {
          document.removeEventListener(name, this);
        }
      }
      // Initialize the component
      init() {
        this.#events = (this.getAttribute("events")?.split(",") || []).map((name) => name.trim()).filter((name) => !!name);
        this.#keys = (this.getAttribute("keys")?.split(",") || []).map((key) => key.trim()).filter((key) => !!key);
        if (!this.#events.length) {
          debug(this, "No events were provided");
          return;
        }
        if (!this.id) {
          debug(this, "The <kelp-html-ajax> component requires a unique ID");
          return;
        }
        for (const name of this.#events) {
          document.addEventListener(name, this);
        }
        emit(this, "html-ajax", "ready");
        this.setAttribute("is-ready", "");
      }
      /**
       * Handle events
       * @param {CustomEvent} event The event object
       */
      handleEvent(event) {
        this.#updateHTML(event);
      }
      /**
       * Update the component HTML in response to an event
       * @param {CustomEvent} event The event object
       */
      async #updateHTML(event) {
        if (!this.#events.includes(event.type)) return;
        if (this.#keys.length) {
          if (!event?.detail.eventKeys || !Array.isArray(event.detail.eventKeys))
            return;
          const hasMatch = this.#keys.find(
            (key) => event.detail.eventKeys.includes(key)
          );
          if (!hasMatch) return;
        }
        const cancelled = !emit(
          this,
          "html-ajax",
          "before-replace",
          { eventKeys: [this.id] },
          true
        );
        if (cancelled) return;
        try {
          const response = await fetch(globalThis.location.href);
          if (!response.ok) throw new Error(response.statusText);
          const data = await response.text();
          const parser = new DOMParser();
          const html = parser.parseFromString(data, "text/html");
          const freshElem = html.querySelector(`#${this.id}`);
          if (!freshElem) {
            emit(this, "html-ajax", "remove", { eventKeys: [this.id] });
            this.remove();
            return;
          }
          const focusedID = this.querySelector(":focus")?.id;
          this.replaceWith(freshElem);
          if (focusedID) {
            freshElem.querySelector(`#${focusedID}`)?.focus();
          }
          emit(freshElem, "html-ajax", "replace", { eventKeys: [this.id] });
        } catch (error) {
          const msg = `Unable to update HTML: ${error}`;
          console.warn(msg);
          debug(this, msg);
          emit(this, "html-ajax", "failed", { eventKeys: [this.id] });
        }
      }
    }
  );

  // src/js/utilities/reinit.js
  function reinit(instance, callback) {
    if (!instance.hasAttribute("is-ready")) return false;
    if (!instance.hasAttribute("is-paused") || typeof callback !== "function")
      return true;
    callback();
    instance.removeAttribute("is-paused");
    return true;
  }

  // src/js/components/tabs.js
  customElements.define(
    "kelp-tabs",
    class extends HTMLElement {
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
        const isInit = reinit(
          this,
          () => document.addEventListener("keydown", this)
        );
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
            debug(
              this,
              `A tab pane for ${link.textContent} with the ID ${link.hash} could not be found. The corresponding tab was removed.`
            );
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
        const pane = this.querySelector(
          `#${tab?.getAttribute("aria-controls")}` || ""
        );
        if (!pane) return;
        const currentTab = tab.closest('[role="tablist"]')?.querySelector('[aria-selected="true"]');
        const currentPane = this.querySelector(
          `#${currentTab?.getAttribute("aria-controls")}` || ""
        );
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
    }
  );

  // src/js/utilities/getFilteredSelector.js
  function getFilteredSelector(selector) {
    return `${selector}:not(:is(kelp-tabs, kelp-accordion, dialog, details) ${selector}) `;
  }

  // src/js/utilities/setTextAsID.js
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

  // src/js/components/toc.js
  customElements.define(
    "kelp-toc",
    class extends HTMLElement {
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
					${this.#nested && this.#getNextLevel(headings, currentLevel) > currentLevel ? this.#createList(headings) : ""}
				</li>`;
          if (!isFirst && this.#getNextLevel(headings, currentLevel) < currentLevel)
            break;
        }
        const renderHeading = isFirst && this.#heading;
        return `
			${renderHeading && this.#headingType !== "li" ? `<${this.#headingType}>${this.#heading}</${this.#headingType}>` : ""}
			<${this.#listType} ${this.#listClass ? `class="${this.#listClass}"` : ""}>
				${renderHeading && this.#headingType === "li" ? `<li><strong>${this.#heading}</strong></li>` : ""}
				${list}
			</${this.#listType}>`;
      }
      /**
       * Returns the level of the next heading
       * @param  {NodeList} headings     The collection of heading elments
       * @param  {String}   currentLevel The current heading level
       * @return {String}              The next heading level
       */
      #getNextLevel(headings, currentLevel) {
        const nextHeading = (
          /** @type {Element} */
          headings[this.#index + 1]
        );
        return nextHeading?.tagName.slice(1) || currentLevel;
      }
    }
  );

  // src/js/components/heading-anchors.js
  customElements.define(
    "kelp-heading-anchors",
    class extends HTMLElement {
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
    }
  );

  // src/js/components/toggle-pw.js
  customElements.define(
    "kelp-toggle-pw",
    class extends HTMLElement {
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
    }
  );

  // src/js/components/autogrow.js
  customElements.define(
    "kelp-autogrow",
    class extends HTMLElement {
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
    }
  );

  // src/js/components/subnav.js
  customElements.define(
    "kelp-subnav",
    class extends HTMLElement {
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
          return this.#onBlur(event);
        }
        this.#onKeydown(event);
      }
      /**
       * Handle click events
       * @param  {Event} event The event object
       */
      #onBlur(event) {
        if (!(event instanceof FocusEvent)) return;
        const navs = this.querySelectorAll("details[open]:not(:focus-within)");
        for (const nav of navs) {
          if (event?.relatedTarget instanceof Node && nav.contains(event.relatedTarget))
            continue;
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
    }
  );

  // src/js/components/invoker.polyfill.js
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
      if (invokeEvent.defaultPrevented) return;
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
          invokee.addEventListener(
            "close",
            () => {
              source.setAttribute("aria-expanded", "false");
              source.focus();
            },
            { once: true }
          );
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

import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-form-validate',
	class extends HTMLElement {
		/** @type HTMLFormElement | null */ #form;
		/** @type NodeList */ #groups;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Initialize the component
		init() {
			// Get the form
			this.#form = this.querySelector('form');
			if (!this.#form) {
				debug(this, 'No form was found');
				return;
			}

			// Get fields and groups
			this.#groups = this.#form.querySelectorAll('[validate-group]');

			// Suppress default form validation
			this.#form.setAttribute('novalidate', '');

			// Listen for events
			this.#form.addEventListener('submit', this);
			this.#form.addEventListener('input', this);
			this.#form.addEventListener('blur', this, { capture: true });

			// Ready
			emit(this, 'form-validate', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param {Event} event The event object
		 */
		handleEvent(event) {
			if (event.type === 'blur') {
				return this.#onBlur(event);
			}
			if (event.type === 'input') {
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

			// Check if the input is part of a gropu
			const group = event.target.closest('[validate-group]');
			const field = group || event.target;

			// If a group, set the interacted status
			group?.setAttribute('validate-group', 'interacted');

			// If the field or group is not currently invalid, do nothing
			if (!group && field.getAttribute('aria-invalid') !== 'true') return;

			// Otherwise, re-validate the group or field
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

			// If it's an input group and its been interacted with, validate the group
			const group = event.target.closest('[validate-group="interacted"]');
			if (group) {
				this.#isGroupValid(group);
				return;
			}

			// If the field is not :user-invalid, the input has not yet been
			// interactived with or is valid. Remove any errors.
			if (!event.target.matches(':user-invalid')) {
				this.#removeError(event.target);
				return;
			}

			// Otherwise, show any errors
			this.#showError(event.target);
		}

		/**
		 * Handle submit events
		 * @param {Event} event The event object
		 */
		#onSubmit(event) {
			// Emit a cancellable event before validating
			const cancelled = !emit(
				this,
				'form-validate',
				'validate',
				{ form: this.#form },
				true,
			);
			if (cancelled) return;

			// Check validity and show errors
			const areGroupsValid = this.#checkGroupValidity();
			const isValid = this.#checkFieldValidity() && areGroupsValid;

			// If form is valid, do nothing
			if (isValid) {
				emit(this, 'form-validate', 'success', { form: this.#form });
				return;
			}

			// Stop form from submitting and prevent other submit events from firing
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			// If not valid, focus on the first invalid field
			/** @type {HTMLElement | null | undefined} */
			const firstInvalidField = this.#form?.querySelector(
				':invalid, [aria-invalid="true"] :is([type="checkbox"], [type="radio"])',
			);
			// @ts-expect-error focusVisible is not universally supported. Used as a progressive enhancement.
			firstInvalidField?.focus({ focusVisible: true });

			// Emit error
			emit(this, 'form-validate', 'failed', { form: this.#form });
		}

		/**
		 * Check the validity of fields that can be validated with HTMLFormElement.checkValidity().
		 * Show error messages for fields that are not.
		 *
		 * @return {Boolean} If true, all fields are valid
		 */
		#checkFieldValidity() {
			// If form is valid, return true immediately
			if (!this.#form || this.#form.checkValidity()) return true;

			// Otherwise, get invalid fields and show errors
			const invalidFields = this.#form.querySelectorAll(':invalid');
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
			if (field.matches(':invalid')) {
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
			if (group.querySelector('input:checked')) {
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
			// Get the error message
			const errorMsg = this.#getMsg(field, isGroup);
			if (!errorMsg) return;

			// Set invalid state
			field.setAttribute('aria-invalid', 'true');

			// Check for existing error element
			const existingErrorID = field.getAttribute('aria-describedby');
			const existingErrorEl = existingErrorID
				? this.#form?.querySelector(`#${existingErrorID}`)
				: null;

			// If there's an existing error element, use it.
			// Otherwise, create a new one.
			const id = existingErrorID || `kelp-${crypto.randomUUID()}`;
			const errorEl = existingErrorEl || document.createElement('div');

			// Set error details
			errorEl.textContent = errorMsg;
			errorEl.id = id;
			errorEl.className = 'validation-error';
			field.setAttribute('aria-describedby', id);

			// Append the error into the DOM
			const location = isGroup ? 'append' : 'after';
			field[location](errorEl);
		}

		/**
		 * Get the error message text
		 * @param  {Element} field   The field or fieldset
		 * @param  {Boolean} isGroup If true, field is a fieldset input group
		 * @return {String}          The error message
		 */
		#getMsg(field, isGroup = false) {
			const defaultMsg = isGroup
				? field.querySelector('[type="checkbox"]')
					? 'Please select at least one option.'
					: 'Please select an option.'
				: 'validationMessage' in field
					? /** @type {string} */ (field.validationMessage)
					: '';
			return field.getAttribute('validate-msg') || defaultMsg;
		}

		/**
		 * Remove the error message from a field
		 * @param  {Element} field The field or fieldset
		 */
		#removeError(field) {
			field.removeAttribute('aria-invalid');
			const id = field.getAttribute('aria-describedby');
			if (!id) return;
			this.#form?.querySelector(`#${id}`)?.remove();
		}
	},
);

import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-select-all',
	class extends HTMLElement {
		/** @type String | null */ #target;
		/** @type HTMLInputElement | null */ #checkbox;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Cleanup global events on disconnect
		disconnectedCallback() {
			document.removeEventListener('input', this);
		}

		// Initialize the component
		init() {
			// Get target selector string
			this.#target = this.getAttribute('target');

			// Get the select-all checkbox
			this.#checkbox = this.querySelector('[type="checkbox"]');

			// Check for required attributes
			if (!this.#target) {
				debug(this, 'No target selector provided');
				return;
			}

			if (!this.#checkbox) {
				debug(this, 'No select-all checkbox provided');
				return;
			}

			// If #checkbox is checked on init, check all controlled fields
			if (this.#checkbox.checked) {
				this.#updateAllChecked(true);
			}

			// Listen for events
			document.addEventListener('input', this);

			// Ready
			emit(this, 'select-all', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param  {Event} event The event object
		 */
		handleEvent(event) {
			this.#onInput(event);
		}

		/**
		 * Handle input events
		 * @param  {Event} event The event object
		 */
		#onInput(event) {
			if (
				!(event.target instanceof Element) ||
				!this.#target ||
				!this.#checkbox
			)
				return;

			// Only run if the event.target is a checkbox
			if (!event.target.matches('[type="checkbox"]')) return;

			// Only run if event.target is the #checkbox or matches the #target selector
			if (
				!event.target.matches(this.#target) &&
				event.target !== this.#checkbox
			)
				return;

			// If event.target is #checkbox, check or uncheck all controlled fields
			if (event.target === this.#checkbox) {
				this.#updateAllChecked(this.#checkbox.checked);
				return;
			}

			// Otherwise, event.target is a controlled field. Update the #checked state.
			const allFields = this.#getAllFields();
			const numberOfCheckedFields = allFields.filter(
				(field) => field.checked,
			).length;

			// Reset indeterminate state
			this.#checkbox.indeterminate = false;

			// If all fields are checked, check the checkbox.
			if (numberOfCheckedFields === allFields.length) {
				this.#checkbox.checked = true;
				return;
			}

			// Otherwise, uncheck the #checkbox
			this.#checkbox.checked = false;

			// If some fields are checked, set indeterminate state
			if (numberOfCheckedFields > 0) {
				this.#checkbox.indeterminate = true;
			}
		}

		/**
		 * Get all controlled fields that aren't [disabled]
		 * @return {Array}
		 */
		#getAllFields() {
			if (!this.#target || !this.#checkbox) return [];
			return [...document.querySelectorAll(this.#target)].filter(
				(field) =>
					field !== this.#checkbox &&
					!field.hasAttribute('disabled') &&
					field.matches('[type="checkbox"]'),
			);
		}

		/**
		 * Check or uncheck all controlled fields
		 * @param {Boolean} isChecked If true, fields should be checked
		 */
		#updateAllChecked(isChecked = false) {
			const fields = this.#getAllFields();

			for (const field of fields) {
				field.checked = isChecked;
			}

			emit(this, 'select-all', 'toggle', {
				checkbox: this.#checkbox,
				fields,
				isChecked,
			});
		}
	},
);

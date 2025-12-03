import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-until-selected',
	class extends HTMLElement {
		/** @type String | null */ #target;
		/** @type String */ #method;
		/** @type String | null */ #focus;
		/** @type String[] */ #events;
		/** @type String[] */ #keys;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Cleanup global events on disconnect
		disconnectedCallback() {
			document.removeEventListener('input', this);
			document.removeEventListener('kelp-select-all:toggle', this);
			for (const name of this.#events) {
				document.removeEventListener(name, this);
			}
			this.toggle(true);
		}

		// Initialize the component
		init() {
			// Define component options
			this.#target = this.getAttribute('target');
			this.#method = this.getAttribute('action') || 'hidden';
			this.#focus = this.getAttribute('focus');

			// Get events and keys to listen for (optional)
			this.#events = (this.getAttribute('events')?.split(',') || [])
				.map((name) => name.trim())
				.filter((name) => name.trim());
			this.#keys = (this.getAttribute('keys')?.split(',') || [])
				.map((key) => key.trim())
				.filter((key) => key.trim());

			// Check for required attributes
			if (!this.#target) {
				debug(this, 'No target selector provided');
				return;
			}

			if (!['invisible', 'disabled', 'hidden'].includes(this.#method)) {
				debug(this, 'Invalid action specified');
				return;
			}

			// Set initial visibility
			this.toggle();

			// Listen for events
			document.addEventListener('input', this);
			document.addEventListener('kelp-select-all:toggle', this);

			// Listen for custom events
			for (const name of this.#events) {
				document.addEventListener(name, this);
			}

			// Ready
			emit(this, 'until-selected', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param  {Event} event The event object
		 */
		handleEvent(event) {
			if (event.type === 'input') {
				return this.#onInput(event);
			}
			if (event.type === 'kelp-select-all:toggle') {
				return this.#onSelectAllToggle(event);
			}
			this.#onCustomEvent(event);
		}

		/**
		 * Handle custom events
		 * @param  {Event | CustomEvent} event The event object
		 */
		#onCustomEvent(event) {
			// Only run if the event is one of the target event names
			if (!this.#events.includes(event.type)) return;

			// Only run on custom events
			if (!(event instanceof CustomEvent)) return;

			// If there are event keys, make sure the event has a matching key
			if (this.#keys.length) {
				if (!event?.detail?.eventKeys || !Array.isArray(event.detail.eventKeys))
					return;
				const hasMatch = this.#keys.find((key) =>
					event.detail.eventKeys.includes(key),
				);
				if (!hasMatch) return;
			}

			// If it's a matching event, toggle visibility
			this.toggle();
		}

		/**
		 * Handle select toggle events
		 * @param  {Event | CustomEvent} event The event object
		 */
		#onSelectAllToggle(event) {
			if (!(event instanceof CustomEvent) || !this.#target) return;

			// Only run if checkbox is a controlling checkbox
			if (!event?.detail?.checkbox.matches(this.#target)) return;

			// Toggle visibility
			this.toggle();
		}

		/**
		 * Handle input events
		 * @param  {Event} event The event object
		 */
		#onInput(event) {
			if (!(event.target instanceof Element) || !this.#target) return;

			// Only run if event.target is a controlling checkbox or radio button
			if (
				!event.target.matches(this.#target) &&
				!this.#isFieldsetChange(event.target)
			)
				return;

			// Toggle visibility
			this.toggle();
		}

		/**
		 * Check if input was on an input that's part of a fieldset the #target field is in.
		 * This is necessary because the input event for a radio button fires on the selected
		 * input, not every one in the group.
		 *
		 * @param  {Element} elem The selected element
		 * @return {Boolean}
		 */
		#isFieldsetChange(elem) {
			if (!(elem instanceof HTMLInputElement)) return false;
			return (
				elem.type === 'radio' &&
				!![
					...document.querySelectorAll(`[type="radio"][name="${elem.name}"]`),
				].find((radio) => this.#target && radio.matches(this.#target))
			);
		}

		/**
		 * Check if any controlling checkbox is checked
		 * @return {Boolean} If true, at least one checkbox is checked
		 */
		#isAnyCheckboxChecked() {
			if (!this.#target) return false;
			const checkboxes = [...document.querySelectorAll(this.#target)];
			return !!checkboxes.find(
				(checkbox) => checkbox instanceof HTMLInputElement && checkbox.checked,
			);
		}

		/**
		 * Toggle the visibility of content elements
		 * @param  {Boolean} forceShow If true, display content regardless of checkbox state
		 */
		toggle(forceShow = false) {
			// Check if content should be shown or hidden
			const shouldBeExpanded = forceShow || this.#isAnyCheckboxChecked();

			// Manage focus
			if (!shouldBeExpanded && this.#focus && this.matches(':focus-within')) {
				/** @type {HTMLElement} */ (
					document.querySelector(this.#focus)
				)?.focus();
			}

			// Show or hide content
			if (this.#method === 'invisible') {
				this.style.visibility = shouldBeExpanded ? '' : 'hidden';
			}

			if (this.#method === 'hidden') {
				this.toggleAttribute('hidden', !shouldBeExpanded);
			}

			// Enable or disable focusable items within the container
			const fields = this.querySelectorAll('button, input, select, textarea');
			for (const field of fields) {
				field.toggleAttribute('disabled', !shouldBeExpanded);
			}

			// Emit custom event
			emit(this, 'until-selected', 'toggle', {
				isEnabled: shouldBeExpanded,
			});
		}
	},
);

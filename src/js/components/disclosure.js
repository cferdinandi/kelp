import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-disclosure',
	class extends HTMLElement {
		/** @type HTMLElement | null */ #btn;
		/** @type HTMLElement | null */ #content;
		/** @type boolean */ #isDropdown;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Cleanup global events on disconnect
		disconnectedCallback() {
			document.removeEventListener('click', this);
			document.removeEventListener('keydown', this);
		}

		// Initialize the component
		init() {
			// Get the button and content
			this.#btn = this.querySelector('button');
			const target = this.getAttribute('target');
			this.#content = target ? document.querySelector(target) : null;

			// Is this a dropdown variant?
			this.#isDropdown = this.hasAttribute('is-dropdown');

			// If dropdown and there's no content, look for an unordered list
			if (this.#isDropdown && !this.#content) {
				this.#content = this.querySelector('ul');
			}

			// Validate required elements
			if (!this.#btn) {
				debug(this, 'No toggle button was provided');
				return;
			}

			if (!this.#content) {
				debug(this, 'No content was found');
				return;
			}

			if (this.#isDropdown && !this.contains(this.#content)) {
				debug(this, 'Dropdown content must be inside the component');
				return;
			}

			// If content has no ID, generate one
			if (!this.#content.id) {
				this.#content.id = `kelp-${crypto.randomUUID()}`;
			}

			// Setup ARIA attributes
			this.#btn.setAttribute('aria-controls', this.#content.id);
			this.#btn.setAttribute('aria-expanded', 'false');

			// Hide the content
			this.#content.setAttribute('hidden', '');

			// List for events
			if (this.#isDropdown) {
				this.addEventListener('blur', this, { capture: true });
				document.addEventListener('click', this);
				document.addEventListener('keydown', this);
			} else {
				this.#btn.addEventListener('click', this);
			}

			// Ready
			emit(this, 'disclosure', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param {Event} event The event object
		 */
		handleEvent(event) {
			if (event.type === 'click') {
				return this.#onClick(event);
			}
			if (event.type === 'keydown') {
				return this.#onKeydown(event);
			}
			this.#onBlur(event);
		}

		/**
		 * Handle click events
		 * @param {Event} event The event object
		 */
		#onClick(event) {
			if (!(event.target instanceof Element)) return;

			// IF the click was outside of the dropdown,
			// AND its not inside a modal dialog,
			// THEN close it
			if (
				!this.contains(event.target) &&
				!event.target.closest('dialog:modal')
			) {
				this.hide();
				return;
			}

			// If the click was not on the toggle button, do nothing
			if (event.target.closest('button') !== this.#btn) return;

			// Toggle visibility
			this.toggle();
		}

		/**
		 * Handle keydown events
		 * @param {Event} event The event object
		 */
		#onKeydown(event) {
			if (!(event instanceof KeyboardEvent)) return;

			// Only run on Escape key press
			if (event.key !== 'Escape') return;

			// If a dialog modal is currently open, do nothing
			if (document.querySelector('dialog:modal[open]')) return;

			// If focus is currently in the dropdown menu, shift it back to the toggle
			if (this.#content?.querySelector(':focus')) {
				this.#btn?.focus();
			}

			// Close the dropdown menu
			this.hide();
		}

		/**
		 * Handle blur events
		 * @param {Event} event The event object
		 */
		#onBlur(event) {
			if (!(event instanceof FocusEvent)) return;

			// IF an element within the component has focus,
			// OR focus is shifting to a dialog modal,
			// THEN do nothing
			if (
				!event.relatedTarget ||
				!(event.relatedTarget instanceof Element) ||
				this.contains(event.relatedTarget) ||
				event.relatedTarget.closest('dialog:modal')
			)
				return;

			// Otherwise, hide the content
			this.hide();
		}

		/**
		 * If content is collapsed, show it.
		 * Otherwise, hide it.
		 */
		toggle() {
			const action =
				this.#btn?.getAttribute('aria-expanded') === 'false' ? 'show' : 'hide';
			this[action]();
		}

		/**
		 * Show the content
		 */
		show() {
			// If before event cancelled, don't show
			const cancelled = !emit(this, 'disclosure', 'show-before', null, true);
			if (cancelled) return;

			// If a dropdown, set the positioning based on the button height
			if (this.#isDropdown && this.#btn && this.#content) {
				const height = window.getComputedStyle(this.#btn).height;
				this.#content.style.insetBlockStart = `calc(${height} + var(--gap))`;
			}

			// Update ARIA and visibility
			this.#btn?.setAttribute('aria-expanded', 'true');
			this.#content?.removeAttribute('hidden');

			// Emit a custom event
			emit(this, 'disclosure', 'show');
		}

		/**
		 * Hide the content
		 */
		hide() {
			// If before event cancelled, don't show
			const cancelled = !emit(this, 'disclosure', 'hide-before', null, true);
			if (cancelled) return;

			// Update ARIA and visibility
			this.#btn?.setAttribute('aria-expanded', 'false');
			this.#content?.setAttribute('hidden', '');

			// Emit a custom event
			emit(this, 'disclosure', 'hide');
		}
	},
);

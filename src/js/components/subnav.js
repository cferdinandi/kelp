import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';
import { reinit } from '../utilities/reinit.js';

customElements.define(
	'kelp-subnav',
	class extends HTMLElement {
		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Cleanup global events on disconnect
		disconnectedCallback() {
			document.removeEventListener('keydown', this);
			this.removeEventListener('blur', this, { capture: true });
			this.setAttribute('is-paused', '');
		}

		// Initialize the component
		init() {
			// Don't run if already initialized
			const isInit = reinit(this, () => this.#listen());
			if (isInit) return;

			// Only run if there's a subnav to close
			if (!this.querySelector('details')) {
				debug(this, 'No subnav was found');
				return;
			}

			// Listen for click and keyboard events
			this.#listen();

			// Ready
			emit(this, 'subnav', 'ready');
			this.setAttribute('is-ready', '');
		}

		// Setup event listeners
		#listen() {
			document.addEventListener('keydown', this);
			this.addEventListener('blur', this, { capture: true });
		}

		/**
		 * Handle events
		 * @param  {Event} event The event object
		 */
		handleEvent(event) {
			if (event.type === 'blur') {
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

			// Get all open subnav's that aren't currently focused
			const navs = this.querySelectorAll('details[open]:not(:focus-within)');

			// Close them
			for (const nav of navs) {
				if (
					event?.relatedTarget instanceof Node &&
					nav.contains(event.relatedTarget)
				)
					continue;
				nav.removeAttribute('open');
			}
		}

		/**
		 * Handle keydown events
		 * @param  {Event} event The event object
		 */
		#onKeydown(event) {
			// Only run on keyboard events
			if (!(event instanceof KeyboardEvent)) return;

			// Only run if pressed key was Escape
			if (event.key !== 'Escape') return;

			// Get all open subnav's
			const navs = this.querySelectorAll('details[open]');

			// Close them
			// If focus is inside it, shift focus to toggle
			for (const nav of navs) {
				const hasFocus = nav.matches(':has(:focus)');
				nav.removeAttribute('open');
				if (hasFocus) {
					const summary = nav.querySelector('summary');
					summary?.focus();
				}
			}
		}
	},
);

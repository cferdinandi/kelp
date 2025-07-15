import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-autogrow',
	class extends HTMLElement {
		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Handle events
		handleEvent() {
			this.setAttribute('data-replicated-value', this.textarea.value);
		}

		// Initialize the component
		init() {
			// Don't run if already initialized
			if (this.hasAttribute('is-ready')) return;

			// Get textarea
			this.textarea = this.querySelector('textarea');
			if (!this.textarea) {
				debug(this, 'No textarea was found');
				return;
			}

			// Listen for input events
			this.textarea.addEventListener('input', this);

			// Set initial value
			this.setAttribute('data-replicated-value', this.textarea.value);

			// Ready
			emit(this, 'autogrow', 'ready');
			this.setAttribute('is-ready', '');
		}
	}
);

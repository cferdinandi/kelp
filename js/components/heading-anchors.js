import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';
import { setTextAsID } from '../utilities/setTextAsID.js';

customElements.define(
	'kelp-heading-anchors',
	class extends HTMLElement {
		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Initialize the component
		init() {
			// Don't run if already initialized
			if (this.hasAttribute('is-ready')) return;

			// Get settings
			this.icon = this.getAttribute('icon') || '#';
			this.levels = this.getAttribute('levels') || 'h2, h3, h4, h5, h6';
			this.before = this.hasAttribute('before');

			// Render
			if (!this.render()) {
				debug(this, 'No matching headings were found');
				return;
			}

			// Ready
			emit(this, 'headinganchors', 'ready');
			this.setAttribute('is-ready', '');
		}

		// Render the anchor links
		render() {
			// Get the headings
			const headings = this.querySelectorAll(this.levels);
			if (!headings.length) return;

			for (const heading of headings) {
				// Store original heading and add class
				heading.classList.add('anchor-h');

				// Add missing IDs
				setTextAsID(heading);

				// Create anchor content
				const text = `<span class="anchor-text">${heading.innerHTML}</span>`;
				const icon = `<span class="anchor-icon" aria-hidden="true">${this.icon}</span>`;

				// Inject the link
				heading.innerHTML = `<a class="anchor-link" href="#${heading.id}">
					${this.before ? `${icon} ${text}` : `${text} ${icon}`}
				</a>`;
			}

			return true;
		}
	}
);

import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define('kelp-toc', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.level = this.getAttribute('level') || 'h2';
		this.heading = this.getAttribute('heading');
		this.target = this.getAttribute('target') || '';
		this.listClass = this.getAttribute('list-class') || 'list-inline';

		// Render
		if (!this.render()) {
			debug(this, 'No matching headings were found');
			return;
		}

		// Ready
		emit(this, 'toc', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the TOC
	render () {

		// Generate list items
		const navList = Array.from(document.querySelectorAll(`${this.target} ${this.level}`)).map((heading) => {
			if (!heading.id) {
				heading.id = `h_${crypto.randomUUID()}`;
			}
			return `<li><a class="link-subtle" href="#${heading.id}">${heading.textContent}</a></li>`;
		}).join('');

		// Make sure a navList exists
		if (navList.length < 1) return;

		// Render the HTML
		this.innerHTML = `<ul class="${this.listClass}">${this.heading ? `<li><strong>${this.heading}</strong></li>` : ''}${navList}</ul>`;

		return true;

	}

});

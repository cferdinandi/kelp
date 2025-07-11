import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define('kelp-toc-nested', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.levels = this.getAttribute('levels') || 'h2, h3, h4, h5, h6';
		this.heading = this.getAttribute('heading') || 'Table of Contents';
		this.headingLevel = this.getAttribute('heading-level') || 'h2';
		this.target = this.getAttribute('target') || '';
		this.listClass = this.getAttribute('list-class') || null;
		this.listType = this.getAttribute('list-type') || 'ul';

		// Render
		if (!this.render()) {
			debug(this, 'No matching headings were found');
			return;
		}

		// Ready
		emit(this, 'tocnested', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the TOC
	render () {

		// Get matching headings
		const headings = document.querySelectorAll(`${this.target} :is(${this.levels})`);
		if (!headings.length) return;

		// Track the current heading level
		let level = headings[0].tagName.slice(1);
		const startingLevel = level;

		// Cache the number of headings
		const len = headings.length - 1;

		// Inject the HTML into the DOM
		this.innerHTML =
			`<${this.headingLevel}>${this.heading}</${this.headingLevel}>
			<${this.listType} ${this.listClass ? `class="${this.listClass}"` : ''}>
				${Array.from(headings).map((heading, index) => {

					// Add an ID if one is missing
					if (!heading.id) {
						heading.id = `h_${crypto.randomUUID()}`;
					}

					// Check the heading level vs. the current list
					const currentLevel = heading.tagName.slice(1);
					const levelDifference = currentLevel - level;
					level = currentLevel;

					// Generate the HTML
					let html = this.getStartingHTML(levelDifference, index);
					html +=
						`<li>
							<a class="link-subtle" href="#${heading.id}">${heading.innerHTML.trim()}</a>`;

					// If the last item, close it all out
					if (index === len) {
						html += this.getOutdent(Math.abs(startingLevel - currentLevel));
					}

					return html;

				}).join('')}
			</${this.listType}>`;

			return true;

	}

	/**
	 * Get the HTML string to start a new list of headings
	 * @param  {Integer} diff  The number of levels in or out from the current level the list is
	 * @param  {Integer} index The index of the heading in the "headings" NodeList
	 */
	getStartingHTML (diff, index) {

		// If indenting
		if (diff > 0) {
			return this.getIndent(diff);
		}

		// If outdenting
		if (diff < 0) {
			return this.getOutdent(Math.abs(diff));
		}

		// If it's not the first item and there's no difference
		if (index && !diff) {
			return '</li>';
		}

		return '';

	}

	/**
	 * Get the HTML to indent a list a specific number of levels
	 * @param  {Integer} count The number of times to indent the list
	 */
	getIndent (count) {
		let html = '';
		for (let i = 0; i < count; i++) {
			html += `<${this.listType} ${this.listClass ? `class="${this.listClass}"` : ''}>`;
		}
		return html;
	}

	/**
	 * Get the HTML to close an indented list a specific number of levels
	 * @param  {Integer} count The number of times to "outdent" the list
	 */
	getOutdent (count) {
		let html = '';
		for (let i = 0; i < count; i++) {
			html += `</${this.listType}></li>`;
		}
		return html;
	}

});

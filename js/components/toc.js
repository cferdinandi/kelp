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
		this.nested = this.hasAttribute('nested');
		this.level = this.getAttribute('level') || (this.nested ? 'h2, h3, h4, h5, h6' : 'h2');
		this.heading = this.getAttribute('heading');
		this.headingType = this.getAttribute('heading-type') || (this.nested ? 'h2' : 'li');
		this.target = this.getAttribute('target') || '';
		this.listClass = this.getAttribute('list-class') || (this.nested ? null : 'list-inline');
		this.listType = this.getAttribute('list-type') || 'ul';

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

		// Get matching headings
		const headings = document.querySelectorAll(`${this.target} :is(${this.level})`);
		if (!headings.length) return;

		// Create TOC
		this.innerHTML = this.createList(headings, 0, true);

		return true;

	}

	/**
	 * Create the list HTML
	 * Runs recursively on nested ToCs
	 * @param  {NodeList} headings The headings to generate the list from
	 * @param  {Integer}  start    The index to start at
	 * @param  {Boolean}  isFirst  If true, this is the start of the list
	 * @return {String}            The HTML string
	 */
	createList (headings, start, isFirst) {

		// If this is the start of the list, define this.index
		if (isFirst) {
			this.index = {
				val: -1
			};
		}

		// Create HTML string
		let list = '';
		for (const [index, heading] of headings.entries()) {

			// If already rendered, skip
			if (this.index.val >= index || index < start) continue;
			this.index.val = index;

			// If there's no heading, create one
			if (!heading.id) {
				heading.id = `h_${crypto.randomUUID()}`;
			}

			// Get the current and next heading levels
			const currentLevel = heading.tagName.slice(1);
			const nextLevel = headings[index + 1]?.tagName.slice(1) || currentLevel;

			// Append the HTML
			// If nested and next heading is smaller than current, run recursively
			list +=
				`<li>
					<a class="link-subtle" href="#${heading.id}">${heading.textContent}</a>
					${this.nested && nextLevel > currentLevel ? this.createList(headings, index + 1) : ''}
				</li>`;

			// If next heading is bigger, finish this list
			if (!isFirst && nextLevel < currentLevel) break;

		}

		// Check if a heading should be rendere
		const renderHeading = isFirst && this.heading;

		return `
			${renderHeading && this.headingType !== 'li' ? `<${this.headingType}>${this.heading}</${this.headingType}>`: ''}
			<${this.listType} ${this.listClass ? `class="${this.listClass}"` : ''}>
				${renderHeading && this.headingType === 'li' ?  `<li><strong>${this.heading}</strong></li>` : ''}
				${list}
			</${this.listType}>`;

	}

});

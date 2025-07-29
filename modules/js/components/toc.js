import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';
import { setTextAsID } from '../utilities/setTextAsID.js';

customElements.define('kelp-toc', class extends HTMLElement {

	/** @type Boolean */       #nested;
	/** @type String */        #level;
	/** @type String | null */ #heading;
	/** @type String | null */ #headingType;
	/** @type String */        #target;
	/** @type String | null */ #listClass;
	/** @type String */        #listType;
	/** @type Number */	       #index;

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.#nested = this.hasAttribute('nested');
		this.#level = this.getAttribute('level') || (this.#nested ? 'h2, h3, h4, h5, h6' : 'h2');
		this.#heading = this.getAttribute('heading');
		this.#headingType = this.getAttribute('heading-type') || (this.#nested ? 'h2' : 'li');
		this.#target = this.getAttribute('target') || '';
		this.#listClass = this.getAttribute('list-class') || (this.#nested ? null : 'list-inline');
		this.#listType = this.getAttribute('list-type') || 'ul';
		this.#index = 0;

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
		const headings = document.querySelectorAll(`${this.#target} :is(${this.#level})`);
		if (!headings.length) return;

		// Create TOC
		this.innerHTML = this.#createList(headings, true);

		return true;

	}

	/**
	 * Create the list HTML
	 * Runs recursively on nested ToCs
	 * @param  {NodeList} headings The headings to generate the list from
	 * @param  {Boolean}  isFirst  If true, this is the start of the list
	 * @return {String}            The HTML string
	 */
	#createList (headings, isFirst = false) {

		// Define or update this.#indexue
		this.#index = isFirst ? 0 : this.#index + 1;

		// Create HTML string
		let list = '';
		for (; this.#index < headings.length; this.#index++) {

			// Get the heading element
			const heading = /** @type {Element} */ (headings[this.#index]);

			// If there's no heading, create one
			setTextAsID(heading);

			// Get the current and next heading levels
			const currentLevel = heading.tagName.slice(1);

			// Append the HTML
			// If nested and next heading is smaller than current, run recursively
			list +=
				`<li>
					<a class="link-subtle" href="#${heading.id}">${heading.textContent}</a>
					${this.#nested && (/** @type {Element} */ (headings[this.#index + 1])?.tagName.slice(1) || currentLevel) > currentLevel ? this.#createList(headings) : ''}
				</li>`;

			// If next heading is bigger, finish this list
			if (!isFirst && (/** @type {Element} */ (headings[this.#index + 1])?.tagName.slice(1) || currentLevel) < currentLevel) break;

		}

		// Check if a heading should be rendered
		const renderHeading = isFirst && this.#heading;

		return `
			${renderHeading && this.#headingType !== 'li' ? `<${this.#headingType}>${this.#heading}</${this.#headingType}>`: ''}
			<${this.#listType} ${this.#listClass ? `class="${this.#listClass}"` : ''}>
				${renderHeading && this.#headingType === 'li' ?  `<li><strong>${this.#heading}</strong></li>` : ''}
				${list}
			</${this.#listType}>`;

	}

});

customElements.define('kelp-toc', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		this.init();
	}

	// Cleanup on disconnect
	disconnectedCallback () {
		this.innerHTML = '';
		this.removeAttribute('is-ready');
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
		this.render();

		// Ready
		this.emit();
		this.setAttribute('is-ready', '');

	}

	// Render the TOC
	render () {

		// Generate list items
		const navList = Array.from(document.querySelectorAll(`${this.target} ${this.level}`)).map((heading) => {
			if (!heading.id) {
				heading.id = `toc_${crypto.randomUUID()}`;
			}
			return `<li><a class="link-subtle" href="#${heading.id}">${heading.textContent}</a></li>`;
		}).join('');

		// Make sure a navList exists
		if (navList.length < 1) return;

		// Render the HTML
		this.innerHTML = `<ul class="${this.listClass}">${this.heading ? `<li><strong>${this.heading}</strong></li>` : ''}${navList}</ul>`;

	}

	// Emit ready event
	emit () {
		const event = new CustomEvent('kelp-toc-ready', {bubbles: true});
		return this.dispatchEvent(event);
	}

});

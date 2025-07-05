import { ready } from '../utilities/ready.js';
import { emit } from '../utilities/emit.js';
import { debug } from '../utilities/debug.js';

customElements.define('kelp-COMPONENT-NAME', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		// ...

		// Render
		if (!this.render()) {
			debug(this, 'error message');
			return;
		}

		// Ready
		emit(this, 'COMPONENT-NAME', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the component
	render () {
		// ...
		// if something is wrong
		const somethingIsWrong = true;
		if (somethingIsWrong) return;

		// Rendered successfully
		return true;
	}

});

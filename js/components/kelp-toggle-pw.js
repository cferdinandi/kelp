import { ready } from '../utilities/ready.js';
import { emit } from '../utilities/emit.js';
import { debug } from '../utilities/debug.js';

customElements.define('kelp-toggle-pw', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.passwords = this.querySelectorAll('[type="password"]');
		this.trigger = this.querySelector('[toggle]');
		this.isBtn = this.trigger?.tagName.toLowerCase() === 'button';
		this.isVisible = this.hasAttribute('visible');

		// If there's no toggle
		if (!this.trigger) {
			debug(this, 'No password toggle found');
			return;
		}

		// If there's no password fields
		if (!this.passwords.length) {
			debug(this, 'No password fields found');
			return;
		}

		// If toggle is a button, add aria-pressed
		if (this.isBtn) {
			this.trigger.setAttribute('aria-pressed', this.isVisible);
			this.trigger.setAttribute('type', 'button');
		}

		// If passwords should be visible, show them by default
		if (this.isVisible) {
			if (!this.isBtn) {
				this.trigger.checked = true;
			}
			this.show();
		}

		// Listen for click events
		this.trigger.addEventListener('click', this);

		// Ready
		emit(this, 'toggle-pw', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Handle events
	handleEvent () {
		this.toggle();
	}

	// Toggle password visibility on or off
	toggle () {
		const show = this.isBtn ? this.trigger.getAttribute('aria-pressed') === 'false' : this.trigger.checked;
		if (show) {
			this.show();
		} else {
			this.hide();
		}
	}

	// Show passwords
	show () {
		for (const pw of this.passwords) {
			pw.type = 'text';
		}
		if (this.isBtn) {
			this.trigger.setAttribute('aria-pressed', true);
		}
	}

	// Hide password visibility
	hide () {
		for (const pw of this.passwords) {
			pw.type = 'password';
		}
		if (this.isBtn) {
			this.trigger.setAttribute('aria-pressed', false);
		}
	}

});

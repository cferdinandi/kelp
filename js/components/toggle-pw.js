import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

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
		const startVisible = this.hasAttribute('visible');
		this.isVisible = startVisible;

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
			this.trigger.setAttribute('aria-pressed', startVisible);
			this.trigger.setAttribute('type', 'button');
		}

		// If passwords should be visible, show them by default
		if (startVisible) {
			if (!this.isBtn) {
				this.trigger.checked = true;
			}
			this.show();
		}

		// Listen for click events
		this.trigger.addEventListener('click', this);

		// Ready
		emit(this, 'togglepw', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Handle events
	handleEvent () {
		this.toggle();
	}

	// Toggle password visibility on or off
	toggle () {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	// Show passwords
	show () {
		this.isVisible = true;
		for (const pw of this.passwords) {
			pw.type = 'text';
		}
		if (this.isBtn) {
			this.trigger.setAttribute('aria-pressed', true);
		} else {
			this.trigger.checked = true;
		}
		emit(this, 'togglepw', 'show');
	}

	// Hide password visibility
	hide () {
		this.isVisible = false;
		for (const pw of this.passwords) {
			pw.type = 'password';
		}
		if (this.isBtn) {
			this.trigger.setAttribute('aria-pressed', false);
		} else {
			this.trigger.checked = false;
		}
		emit(this, 'togglepw', 'hide');
	}

});

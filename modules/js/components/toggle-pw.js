import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define('kelp-toggle-pw', class extends HTMLElement {

	/** @type NodeList */                 #passwords;
	/** @type HTMLButtonElement | null */ #btn
	/** @type HTMLInputElement | null */  #checkbox
	/** @type Boolean */                  #isVisible;

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.#passwords = this.querySelectorAll('[type="password"]');
		const toggle = this.querySelector('[toggle]');
		this.#btn = toggle?.tagName.toLowerCase() === 'button' ? /** @type {HTMLButtonElement} */ (toggle) : null;
		this.#checkbox = toggle?.getAttribute('type') === 'checkbox' ? /** @type {HTMLInputElement} */ (toggle) : null;
		const startVisible = this.hasAttribute('visible');
		this.#isVisible = startVisible;

		// If there's no toggle
		if (!this.#btn && !this.#checkbox) {
			debug(this, 'No password toggle found');
			return;
		}

		// If there's no password fields
		if (!this.#passwords.length) {
			debug(this, 'No password fields found');
			return;
		}

		// If toggle is a button, add aria-pressed
		if (this.#btn) {
			this.#btn.setAttribute('aria-pressed', startVisible.toString());
			this.#btn.setAttribute('type', 'button');
		}

		// If passwords should be visible, show them by default
		if (startVisible) {
			if (this.#checkbox) {
				this.#checkbox.checked = true;
			}
			this.show();
		}

		// Listen for click/input events
		this.#btn?.addEventListener('click', this);
		this.#checkbox?.addEventListener('input', this);

		// Ready
		emit(this, 'togglepw', 'ready');
		this.setAttribute('is-ready', '');

	}

	// readonly property
	// Returns true if password is visible
	get isVisible () {
		return this.#isVisible;
	}

	// Handle events
	handleEvent () {
		this.toggle();
	}

	// Toggle password visibility on or off
	toggle () {
		if (this.#isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	// Show passwords
	show () {
		this.#isVisible = true;
		for (const pw of this.#passwords) {
			/** @type {Element} */
			(pw).setAttribute('type', 'text');
		}
		this.#btn?.setAttribute('aria-pressed', 'true');
		if (this.#checkbox) {
			this.#checkbox.checked = true;
		}
		emit(this, 'togglepw', 'show');
	}

	// Hide password visibility
	hide () {
		this.#isVisible = false;
		for (const pw of this.#passwords) {
			/** @type {Element} */
			(pw).setAttribute('type', 'password');
		}
		this.#btn?.setAttribute('aria-pressed', 'false');
		if (this.#checkbox) {
			this.#checkbox.checked = false;
		}
		emit(this, 'togglepw', 'hide');
	}

});

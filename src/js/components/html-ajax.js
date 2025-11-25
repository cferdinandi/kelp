import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-html-ajax',
	class extends HTMLElement {
		/** @type String[] */ #events;
		/** @type String[] */ #keys;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Cleanup global events on disconnect
		disconnectedCallback() {
			for (const name of this.#events) {
				document.removeEventListener(name, this);
			}
		}

		// Initialize the component
		init() {
			// Get options
			this.#events = (this.getAttribute('events')?.split(' ') || [])
				.map((name) => name.trim())
				.filter((name) => !!name);
			this.#keys = (this.getAttribute('keys')?.split(' ') || [])
				.map((key) => key.trim())
				.filter((key) => !!key);

			// Make sure there are events to listen for
			if (!this.#events.length) {
				debug(this, 'No events were provided');
				return;
			}

			// Make sure the component has an ID
			if (!this.id) {
				debug(this, 'The <kelp-html-ajax> component requires a unique ID');
				return;
			}

			// Listen for events
			for (const name of this.#events) {
				document.addEventListener(name, this);
			}

			// Ready
			emit(this, 'html-ajax', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param {CustomEvent} event The event object
		 */
		handleEvent(event) {
			this.#updateHTML(event);
		}

		/**
		 * Update the component HTML in response to an event
		 * @param {CustomEvent} event The event object
		 */
		async #updateHTML(event) {
			// Only run if the event is one of the target event names
			if (!this.#events.includes(event.type)) return;

			// If there are event keys, make sure the event has a matching key
			if (this.#keys.length) {
				if (!event?.detail.eventKeys || !Array.isArray(event.detail.eventKeys))
					return;
				const hasMatch = this.#keys.find((key) =>
					event.detail.eventKeys.includes(key),
				);
				if (!hasMatch) return;
			}

			// Emit a cancellable before event
			const cancelled = !emit(
				this,
				'html-ajax',
				'before-replace',
				{ eventKeys: [this.id] },
				true,
			);
			if (cancelled) return;

			try {
				// Fetch the current page
				const response = await fetch(globalThis.location.href);
				if (!response.ok) throw new Error(response.statusText);
				const data = await response.text();

				// Convert the response string to HTML
				const parser = new DOMParser();
				const html = parser.parseFromString(data, 'text/html');

				// Get the updated HTML element
				const freshElem = html.querySelector(`#${this.id}`);

				// If the element doesn't exist in the new HTML, remove it
				if (!freshElem) {
					emit(this, 'html-ajax', 'remove', { eventKeys: [this.id] });
					this.remove();
					return;
				}

				// Check if an element inside the component has focus.
				// If so, cache its ID so it can be refocused after updating.
				const focusedID = this.querySelector(':focus')?.id;

				// Replace the current component with the fresh one
				this.replaceWith(freshElem);

				// If an element inside the component had focus, restore it
				if (focusedID) {
					/** @type {HTMLElement} */ (
						freshElem.querySelector(`#${focusedID}`)
					)?.focus();
				}

				// Emit a success event
				emit(freshElem, 'html-ajax', 'replace', { eventKeys: [this.id] });
			} catch (error) {
				const msg = `Unable to update HTML: ${error}`;
				console.warn(msg);
				debug(this, msg);

				// Emit a failed event
				emit(this, 'html-ajax', 'failed', { eventKeys: [this.id] });
			}
		}
	},
);

import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { getFromPath } from '../utilities/getFromPath.js';
import { ready } from '../utilities/ready.js';

customElements.define(
	'kelp-form-ajax',
	class extends HTMLElement {
		/** @type HTMLFormElement | null */ #form;
		/** @type String | null */ #externalForms;
		/** @type HTMLElement */ #announce;
		/** @type String */ #msgSubmitting;
		/** @type String */ #msgFailed;
		/** @type String | null */ #msgSuccess;
		/** @type String | null */ #pathSuccess;
		/** @type String | null */ #pathFailed;
		/** @type String | null */ #pathRedirect;
		/** @type String | null */ #redirectOnSuccess;
		/** @type Boolean */ #submitLoading;
		/** @type HTMLElement | null */ #loadingIcon;
		/** @type Boolean */ #removeFormOnSuccess;
		/** @type Number */ #dismissMsgOnSuccess;
		/** @type Boolean */ #keepFields;
		/** @type Number */ #delay;
		/** @type Array */ #eventKeys;

		// Initialize on connect
		connectedCallback() {
			ready(this);
		}

		// Initialize the component
		init() {
			// Get the form
			this.#form = this.querySelector('form');
			if (!this.#form) {
				debug(this, 'No form was found');
				return;
			}

			// Get external forms selector
			this.#externalForms = this.getAttribute('external-forms');

			// Create an append a form status element
			const announcePosition = this.hasAttribute('msg-start')
				? 'prepend'
				: 'append';
			this.#announce = document.createElement('div');
			this.#announce.setAttribute('role', 'status');
			this[announcePosition](this.#announce);

			// Message options
			this.#msgSubmitting =
				this.getAttribute('msg-submitting') ?? 'Submitting...';
			this.#msgSuccess = this.getAttribute('msg-success');
			this.#msgFailed =
				this.getAttribute('msg-failed') ??
				'Something went wrong. Unable to submit form.';
			this.#pathSuccess = this.getAttribute('path-success');
			this.#pathFailed = this.getAttribute('path-failed');

			// Form behavior options
			this.#submitLoading = this.hasAttribute('submit-loading');
			this.#removeFormOnSuccess = this.hasAttribute('remove-form-on-success');
			this.#dismissMsgOnSuccess = this.hasAttribute('dismiss-msg-on-success')
				? Number.parseInt(
						this.getAttribute('dismiss-msg-on-success') || '6000',
						10,
					)
				: 0;
			this.#redirectOnSuccess = this.getAttribute('redirect-on-success');
			this.#pathRedirect = this.getAttribute('path-redirect');

			// After success options
			this.#keepFields = this.hasAttribute('keep-fields');
			this.#delay = this.hasAttribute('delay')
				? Number.parseInt(this.getAttribute('delay') || '6000', 10)
				: 0;
			this.#eventKeys = (
				this.getAttribute('event-keys')?.split(' ') || [this.#form.action]
			)
				.map((name) => name.trim())
				.filter((name) => !!name);

			// If enabled, create a loading spinner
			this.#loadingIcon = this.#submitLoading
				? document.createElement('div')
				: null;
			if (this.#loadingIcon) {
				this.#loadingIcon.innerHTML = `<div class="spinner ${this.getAttribute('submit-loading')}"></div>`;
				this.#loadingIcon.setAttribute('loading-icon', '');
				this.append(this.#loadingIcon);
			}

			// Listen for events
			this.#form.addEventListener('submit', this);

			// Ready
			emit(this, 'form-ajax', 'ready');
			this.setAttribute('is-ready', '');
		}

		/**
		 * Handle events
		 * @param {SubmitEvent} event The event object
		 */
		handleEvent(event) {
			this.#onSubmit(event);
		}

		/**
		 * Handle submit events
		 * @param  {SubmitEvent} event The event object
		 */
		async #onSubmit(event) {
			// Stop form from reloading the page
			event.preventDefault();

			// If the form is already submitting, do nothing
			if (this.#isDisabled() || !this.#form) return;

			// Store the submitting element if a loading icon is displayed.
			// When visibility is hidden, the button loses focus. We retore it later.
			/** @type HTMLElement | null */
			const submitter = this.#submitLoading ? this.#form.querySelector(':focus') : null;

			try {
				// Get the form values
				const formData = this.#getFormData(event.submitter);

				// Emit a cancellable before event
				const cancelled = !emit(
					this,
					'form-ajax',
					'submit',
					{
						formData,
						eventKeys: this.#eventKeys,
					},
					true,
				);
				if (cancelled) return;

				// Disable future submissions
				this.#disable();

				// Show status message
				this.#showStatus(this.#msgSubmitting, 'submitting');

				// Submit the form data
				const response = await this.#callAPI(formData);
				const data = await response.json();

				// If there's an error, throw
				const failed = getFromPath(data, this.#pathFailed);
				if (failed) throw failed;
				if (!response.ok) throw response;

				// If message, display it
				const msgSuccess = getFromPath(data, this.#pathSuccess) ?? this.#msgSuccess ?? '';
				this.#showStatus(msgSuccess, 'success');

				// If there's a redirect URL, redirect the user
				const redirect = getFromPath(data, this.#pathRedirect) ?? this.#redirectOnSuccess;
				if (redirect) {
					window.location.href = redirect;
				}

				// Clear all form fields
				this.#reset();

				// If the form should be removed on success, remove it
				if (this.#removeFormOnSuccess) {
					this.#form?.remove();
				}

				// Emit submit event
				emit(this, 'form-ajax', 'success', {
					data,
					eventKeys: this.#eventKeys,
				});
			} catch (error) {
				emit(this, 'form-ajax', 'failed', {
					error,
					eventKeys: this.#eventKeys,
				});
				const msgError = typeof error === 'string' ?
					error :
					(Array.isArray(error) ? error.join(' ') : this.#msgFailed);
				this.#showStatus(msgError, 'danger');
			} finally {
				setTimeout(() => {
					this.#enable();
					// Restore focus once the form visibility returns
					submitter?.focus();
				}, this.#delay);
			}
		}

		/**
		 * Get FormData for the submitting form and any linked external forms
		 * @param  {HTMLElement | null} submitter The submitting button
		 * @return {FormData}                     The FormData object
		 */
		#getFormData(submitter = null) {
			// Get the form values
			const formData = new FormData(this.#form ?? undefined, submitter);

			// If there are external forms, get their data and merge it in
			for (const form of this.#getExternalForms()) {
				if (!(form instanceof HTMLFormElement)) continue;
				const data = new FormData(form);
				for (const [key, value] of data) {
					formData.append(key, value);
				}
			}

			return formData;
		}

		/**
		 * Get any linked external forms
		 * @return {NodeList | Array}
		 */
		#getExternalForms() {
			return this.#externalForms ? document.querySelectorAll(this.#externalForms) : [];
		}

		/**
		 * Asynchronously call the API endpoint
		 * @param  {FormData} formData The FormData object for the form(s)
		 * @return {Promise}           The fetch object
		 */
		#callAPI(formData) {
			if (!this.#form) throw new Error('No form found');

			// Create the base options object
			const { action, method, enctype } = this.#form;
			const options = {
				method,
				headers: {
					'X-Requested-With': 'XMLHttpRequest',
				},
			};

			// If a multipart form, use FormData for the body
			if (enctype.toLowerCase() === 'multipart/form-data') {
				options.body = formData;
				return fetch(action, options);
			}

			// Otherwise, get fields as query string parameters
			// @ts-expect-error https://github.com/microsoft/TypeScript/issues/19806
			const params = new URLSearchParams(formData).toString();

			// If form uses the GET method, append params to the URL
			if (method.toLowerCase() === 'get') {
				return fetch(`${action}?${params}`);
			}

			// Otherwise, set params as the body and set the content-type
			options.body = params;
			options.headers['Content-type'] = 'application/x-www-form-urlencoded';
			return fetch(action, options);
		}

		/**
		 * Update the form status text
		 * @param  {String} msg  The message to display
		 * @param  {String} type The status type (success | danger | submitting)
		 */
		#showStatus(msg, type) {
			if (!this.#announce) return;

			// Show the message
			this.#announce.innerHTML = msg;
			this.#announce.className = this.#submitLoading || !msg ? '' : type;

			// If success and message should be removed on success, schedule removal
			if (type === 'success' && this.#dismissMsgOnSuccess) {
				setTimeout(() => {
					if (!this.#announce) return;
					this.#announce.innerHTML = '';
					this.#announce.className = '';
				}, this.#dismissMsgOnSuccess);
			}

			// If currently submitting and showing a loading icon, visually hide the status message
			this.#announce.classList.toggle('visually-hidden', type === 'submitting' && this.#submitLoading);
		}

		/**
		 * Disable the form so it can't be submitted while waiting for an API response
		 */
		#disable() {
			this.setAttribute('is-submitting', '');
		}

		/**
		 * Re-enable the form after the API resolves
		 */
		#enable() {
			this.removeAttribute('is-submitting');
		}

		/**
		 * Check if the form is currently submitting to the API
		 * @return {Boolean} If true, the form is submitting
		 */
		#isDisabled() {
			return this.hasAttribute('is-submitting');
		}

		/**
		 * Reset form element values
		 */
		#reset() {
			if (this.#keepFields) return;
			this.#form?.reset();

			// If there are external forms, clear them, too
			for (const form of this.#getExternalForms()) {
				if (!(form instanceof HTMLFormElement)) continue;
				form.reset();
			}
		}
	},
);

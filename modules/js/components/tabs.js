import { debug } from '../utilities/debug.js';
import { emit } from '../utilities/emit.js';
import { ready } from '../utilities/ready.js';
import { reinit } from '../utilities/reinit.js';

customElements.define('kelp-tabs', class extends HTMLElement {

	/** @type String | null */      #start;
	/** @type Boolean */            #isVertical;
	/** @type HTMLElement | null */ #list;

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Cleanup global events on disconnect
	disconnectedCallback () {
		document.removeEventListener('keydown', this);
		this.setAttribute('is-paused', '');
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		const isInit = reinit(this, () => document.addEventListener('keydown', this));
		if (isInit) return;

		// Get settings
		this.#start = this.getAttribute('start');
		this.#isVertical = this.hasAttribute('vertical');

		// Get the list element
		this.#list = this.querySelector('[tabs]');

		// Render
		if (!this.render()) {
			debug(this, 'No tabs were was found');
			return;
		}

		// Listen for events
		this.#list?.addEventListener('click', this);
		document.addEventListener('keydown', this);

		// Ready
		emit(this, 'tabs', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the TOC
	render () {

		// Get the list items and links
		const listItems = this.#list?.querySelectorAll('li') || [];
		const links = this.#list?.querySelectorAll('a');

		// Make sure there's a list and links
		if (!this.#list || !links?.length) return;

		// Add ARIA to list
		this.#list.setAttribute('role', 'tablist');
		if (this.#isVertical) {
			this.#list.setAttribute('aria-orientation', 'vertical');
		}

		// Add ARIA to the list items
		for (const item of listItems) {
			item.setAttribute('role', 'presentation');
		}

		// Add ARIA to the links and content
		links.forEach((link, index) => {

			// Get the the target element
			const pane = this.querySelector(link.hash);

			// If there's no matching pane, remove the link and skip this one
			if (!pane) {
				(link.closest('li') || link).remove();
				debug(this, `A tab pane for ${link.textContent} with the ID ${link.hash} could not be found. The corresponding tab was removed.`);
				return;
			}

			// Determine if this is the active tab
			const isActive = this.#start ? this.#start === link.hash : index === 0;

			// Create the tab button
			const btn = document.createElement('button');
			btn.innerHTML = link.innerHTML;
			btn.id = link.id || `tab_${pane.id}`;

			// Prevent the button from submitting forms
			btn.setAttribute('type', 'button');

			// Add [role] and [aria-selected] attributes
			btn.setAttribute('role', 'tab');
			btn.setAttribute('aria-controls', link.hash.slice(1));
			btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

			// If it's not the active (first) tab, prevent focus
			if (!isActive) {
				btn.setAttribute('tabindex', '-1');
			}

			// Replace link with button
			link.replaceWith(btn);

			// Add ARIA to tab pane
			pane.setAttribute('role', 'tabpanel');
			pane.setAttribute('aria-labelledby', btn.id);

			// If not the active pane, hide it
			if (!isActive) {
				pane.setAttribute('hidden', '');
			}

		});

		return true;
	}

	/**
	 * Handle events
	 * @param  {Event} event The event object
	 */
	handleEvent (event) {
		if (event.type === 'click') {
			return this.#onClick(event);
		}
		this.#onKeydown(event);
	}

	/**
	 * Handle click events
	 * @param  {Event} event The event object
	 */
	#onClick (event) {

		// Only run on tab buttons
		const btn = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
		if (!btn) return;

		// Ignore the currently active tab
		if (btn.matches('[aria-selected="true"]')) return;

		// Toggle tab visibility
		this.select(btn);

	}

	/**
	 * Handle keydown events
	 * @param  {Event} event The event object
	 */
	#onKeydown (event) {

		// Only run on keyboard events
		if (!(event instanceof KeyboardEvent)) return;

		// Story next and previous keys
		const keyNext = ['ArrowRight'];
		const keyPrev = ['ArrowLeft'];

		// If vertical, check for up/down arrows
		if (this.#isVertical) {
			keyNext.push('ArrowDown');
			keyPrev.push('ArrowUp');
		}

		// Only run for left and right arrow keys
		if (![...keyNext, ...keyPrev].includes(event.key)) return;

		// Prevent page scroll
		event.preventDefault();

		// Only run if element in focus is on a tab
		const tab = document.activeElement?.closest('[role="tab"]');
		if (!tab) return;

		// Only run if focused tab is in this component
		if (!this.#list?.contains(tab)) return;

		// Get the currently active tab
		const currentTab = this.#list.querySelector('[role="tab"][aria-selected="true"]');

		// Get the parent list item
		const listItem = currentTab?.closest('li');

		// If right arrow, get the next sibling
		// Otherwise, get the previous
		const nextListItem = keyNext.includes(event.key) ? listItem?.nextElementSibling : listItem?.previousElementSibling;
		const nextTab = nextListItem?.querySelector('button');
		if (!nextTab) return;

		// Toggle tab visibility
		this.select(nextTab);
		nextTab.focus();

	}

	/**
	 * Toggle tab visibility
	 * @param  {Element} tab The tab to show
	 */
	select (tab) {

		// If there's no tab, bail
		if (!tab) return;

		// Get the target tab pane
		const pane = this.querySelector(`#${tab?.getAttribute('aria-controls')}` || '');
		if (!pane) return;

		// Get the current tab and content
		const currentTab = tab.closest('[role="tablist"]')?.querySelector('[aria-selected="true"]');
		const currentPane = this.querySelector(`#${currentTab?.getAttribute('aria-controls')}` || '');

		// Emit select-before event
		// If cancelled, don't select the tab
		const event = emit(
			this,
			'tabs',
			'select-before',
			{
				currentTab,
				currentPane,
				nextTab: tab,
				nextPane: pane,
			},
			true
		);
		if (!event) return;

		// Update the selected tab
		tab.setAttribute('aria-selected', 'true');
		currentTab?.setAttribute('aria-selected', 'false');

		// Update the visible tabPane
		pane.removeAttribute('hidden');
		currentPane?.setAttribute('hidden', '');

		// Make sure current tab can be focused and other tabs cannot
		tab.removeAttribute('tabindex');
		currentTab?.setAttribute('tabindex', '-1');

		// Emit select event
		emit(this, 'tabs', 'select', { tab, pane });

	}

});

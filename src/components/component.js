import render from './render.js';

/**
 * Create the event handler function
 * @param {Class} instance The instance
 */
function createHandler (instance) {
	return function handler (event) {
		instance.render();
	};
}

/**
 * Component Class
 */
class Component {

	/**
	 * The constructor object
	 * @param  {Node|String} elem     The element or selector to render the template into
	 * @param  {Function}    template The template function to run when the data updates
	 * @param  {Object}      options  Additional options
	 */
	constructor (elem, template, options) {

		// Create instance properties
		this.elem = elem;
		this.template = template;
		this.name = options.name || 'kelp:store';
		this.events = options.events;
		this.handler = createHandler(this);
		this.debounce = null;

		// Init
		this.render();
		this.start();

	}

	/**
	 * Start reactive data rendering
	 */
	start () {
		document.addEventListener(this.name, this.handler);
	}

	/**
	 * Stop reactive data rendering
	 */
	stop () {
		document.removeEventListener(this.name, this.handler);
	}

	/**
	 * Render the UI
	 */
	render () {

		// Cache instance
		let self = this;

		// If there's a pending render, cancel it
		if (self.debounce) {
			window.cancelAnimationFrame(self.debounce);
		}

		// Setup the new render to run at the next animation frame
		self.debounce = window.requestAnimationFrame(function () {
			render(self.elem, self.template(), self.events);
		});

	}

}

/**
 * Create a new listener
 * @param  {Node|String} elem     The element or selector to render the template into
 * @param  {Function}    template The template function to run when the data updates
 * @param  {Object}      options  Additional options
 */
function component (elem, template, options = {}) {
	return new Component(elem, template, options);
}


export default component;
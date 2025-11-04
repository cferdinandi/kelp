/**
 * Emit a custom event
 * @param  {Element} elem       The custom element to emit the event on
 * @param  {String}  component  The name of the component
 * @param  {String}  id         The event ID
 * @param  {*}       detail     Any details about the event (optional)
 * @param  {Boolean} cancelable If true, event can be cancelled
 */
export function emit(elem, component, id, detail = null, cancelable = false) {
	// Create a new event
	const event = new CustomEvent(`kelp-${component}:${id}`, {
		bubbles: true,
		cancelable,
		detail,
	});

	// Dispatch the event
	return elem.dispatchEvent(event);
}

/**
 * Emit a custom event
 * @param  {Element} elem      The custom element to emit the event on
 * @param  {String}  component The name of the component
 * @param  {String}  id        The event ID
 * @param  {*}       detail    Any details about the event (optional)
 */
export function emit (elem, component, id, detail = null) {

	// Create a new event
	const event = new CustomEvent(`kelp:${component}-${id}`, {
		bubbles: true,
		cancelable: true,
		detail
	});

	// Dispatch the event
	return elem.dispatchEvent(event);

}

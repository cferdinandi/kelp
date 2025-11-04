/**
 * Emit a debug event
 * @param  {Element} elem   The element with errors
 * @param  {String}  detail The error details
 */
export function debug(elem, detail = "") {
	// Create a new event
	const event = new CustomEvent("kelp:debug", {
		bubbles: true,
		detail,
	});

	// Dispatch the event
	return elem.dispatchEvent(event);
}

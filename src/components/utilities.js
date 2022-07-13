/**
 * Emit a custom event
 * @param  {String} type   The event type
 * @param  {*}      detail Any details to pass along with the event
 * @param  {Node}   elem   The element to emit the event on
 */
function emit (type, detail, elem = document) {

	// Create a new event
	let event = new CustomEvent(type, {
		bubbles: true,
		cancelable: true,
		detail: detail
	});

	// Dispatch the event
	return elem.dispatchEvent(event);

}


export {emit};
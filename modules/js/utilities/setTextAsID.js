/**
 * Convert element text into a valid ID and set it on the element
 * @param  {Element} elem The heading element
 */
export function setTextAsID(elem) {
	// If the element already has an ID, nothing else to do
	if (elem.id) return;

	// Generate the ID string
	const id = elem.textContent
		?.replace(/[^a-zA-Z0-9-_\u00A0-\uFFEF\s-]/g, '-')
		.replace(/[\s-]+/g, '-');
	if (!id) return;

	// Make sure it's not already in use
	let suffix = 0;
	let existing = document.querySelector(`#kelp_${id}`);
	while (existing) {
		suffix++;
		existing = document.querySelector(`#kelp_${id}_${suffix}`);
	}

	// Set the ID on the element
	elem.id = `kelp_${id}${suffix ? `_${suffix}` : ''}`;
}

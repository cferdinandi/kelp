/**
 * Convert element text into a valid ID and set it on the element
 * @param  {Element} elem The heading element
 */
export function setTextAsID(elem) {
	if (elem.id) return;
	elem.id = `h_${elem.textContent.replace(/[^a-zA-Z0-9-_\u00A0-\uFFEF\s-]/g, '-').replace(/[\s-]+/g, '-')}`;
}

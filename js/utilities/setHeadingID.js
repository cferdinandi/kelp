/**
 * Convert heading text into a valid ID and set it on the element
 * @param  {Element} heading The heading element
 */
export function setHeadingID (heading) {
	if (heading.id) return;
	heading.id = `h_${heading.textContent.replace(/\W/g,'-')}`;
}

/**
 * Get a selector string with certain web components filtered out
 * @param  {String} selector The original selector string
 * @return {String}          The filtered version of the string
 */
export function getFilteredSelector (selector) {
	return `${selector}:not(:is(kelp-tabs, kelp-accordion, dialog, details) ${selector}) `;
}

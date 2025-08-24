const exclude = ['kelp-tabs', 'kelp-accordion', 'dialog'];

/**
 * Get a selector string with certain web components filtered out
 * @param  {String} selector The original selector string
 * @return {String}          The filtered version of the string
 */
export function getFilteredSelector (selector) {
	return `${selector}:not(${exclude.map(elem => `${elem} ${selector}`)}) `;
}

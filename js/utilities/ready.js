/**
 * Run .init() method after DOM is ready
 * @param  {Instance} instance The component class instance
 */
export function ready (instance) {
	if (document.readyState !== 'loading') {
		instance.init();
		return;
	}
	document.addEventListener('DOMContentLoaded', () => instance.init(), {once: true});
}

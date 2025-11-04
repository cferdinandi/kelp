/**
 * Restore properties and behaviors when reconnected to the DOM
 * Only runs if element is currently ready but paused
 * @param  {KelpWCInstance} instance The component class instance
 * @param  {Function}       callback A function to run reinit activities
 * @return {Boolean}                 If true, component is already initialized
 */
export function reinit(instance, callback) {
	// Make sure function should run
	if (!instance.hasAttribute("is-ready")) return false;
	if (!instance.hasAttribute("is-paused") || typeof callback !== "function")
		return true;

	// Run callback and remove paused state
	callback();
	instance.removeAttribute("is-paused");

	return true;
}

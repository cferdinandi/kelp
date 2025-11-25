/**
 * Convert string path to an array
 * @param  {String} path The string path
 * @return {Array}       The path as an array
 */
function stringToPath(path) {
	if (typeof path !== 'string') return [];

	const output = [];
	for (const item of path.split('.')) {
		for (const key of item.split(/\[([^}]+)\]/g)) {
			if (key.length < 1) continue;
			output.push(key);
		}
	}

	return output;
}

/**
 * Get a value from an object from a path
 * @param  {Object | Array | null} obj  The object
 * @param  {String | null}         path The path to follow
 * @return {any}                        The value
 */
export function getFromPath(obj, path) {
	if (!obj || !path) return;

	// Get the path as an array
	const pathArr = stringToPath(path);

	// Cache the current object
	let current = structuredClone(obj);

	// Dig through the object/array path
	for (const key of pathArr) {
		if (!current[key]) return;
		current = current[key];
	}

	return current;
}

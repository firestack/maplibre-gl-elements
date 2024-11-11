/**
 *
 * @param {HTMLElement} e
 * @param {string} key
 * @param {string | undefined} datasetKey
 */
export function getAttributeOrDataset(e, key, datasetKey = undefined) {
	const dataType = e.getAttribute(key)
	if (dataType !== null) {
		return dataType
	}

	const camelCaseKey = datasetKey ?? kebabToCamel(key)

	return e.dataset[camelCaseKey]
}

/**
 * Converts a string from `kebab-case` to `camelCase`.
 *
 * @param {string} input The string in `kebab-case` to be converted
 * @returns {string} The string in `camelCase`
 */
function kebabToCamel(input) {
	let output = ""
	for (let i = 0, char = ""; i < input.length; i++) {
		char = input.charAt(i)
		if (char === "-") {
			output += input.charAt(++i).toUpperCase()
		} else {
			output += char
		}
	}
	return output
}

export default kebabToCamel

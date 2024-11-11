/**
 *
 * @param {Parameters<typeof customElements.define>[1]} elementClass
 * @param {Parameters<typeof customElements.define>[0]} tagName
 */
export function registerTag(elementClass, tagName) {
	if ("customElements" in window) {
		customElements.define(tagName ?? "ml-map", elementClass)
	}
}

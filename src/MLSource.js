import { MLMap } from "./MLMap.js"
import { registerTag } from "./utils/registerTag.js"
import { getAttributeOrDataset } from "./utils/getAttributeOrDataset.js"

export class MLSource extends HTMLElement {
	/**
	 *
	 * @param {string} tagName
	 */
	static register(tagName = "ml-source") {
		registerTag(MLSource, tagName)
	}

	static events = {
		removed: "map.source.removed"
	}

	/**
	 * TODO: make this exist as soon as the element is created
	 * @type {Promise<void> | undefined}
	 */
	sourcePromise

	/**
	 * @type {undefined | null | MLMap}
	 */
	connectedMap

	connectedCallback() {
		this.sourcePromise = this.load()
	}

	async disconnectedCallback() {
		return
		await this.sourcePromise

		if (this?.connectedMap?.map?.getSource(this.id)) {
			this.dispatchEvent(new CustomEvent(MLSource.events.removed, {detail: { id: this.id }}))

			console.debug("removing source", this.id)
			this.connectedMap?.map?.removeSource(this.id)
		} else {
			console.debug("tried to remove source but it was not present", this.id)
		}
	}

	async load() {
		const dataPromise = new Promise((resolve) => resolve(this.data))
		this.connectedMap = MLMap.findMapElement(this)

		if (!this.connectedMap) {
			// TODO: throw error or something
			return
		}

		const [data, map] = await Promise.all([
			dataPromise,
			this.connectedMap.loaded(),
		])

		const dateType = this.dataType()
		if (!dateType) {
			// TODO: report or throw error or something
			return
		}

		if (map.getSource(this.id) !== undefined) {
			console.debug("replacing source", this.id)
			map.removeSource(this.id)
		} else {
			console.debug("adding source", this.id)
		}

		map.addSource(this.id, {
			type: dateType,
			data: data,
		})
	}

	/**
	 *
	 * @returns {undefined | "geojson"} type of data
	 */
	dataType() {
		// TODO: fix: restrict to `addSource` type
		// NOTE: uhh, actually this implementation only seems to support `geojson` right now
		const typeValue = getAttributeOrDataset(this, "type")
		switch (typeValue) {
			// case /* valid value */:
			case "geojson":
				return typeValue
			default:
				return undefined
		}
	}

	get data() {
		// Return the attribute value
		const srcAttribute = this.getAttribute("src")
		if (srcAttribute !== null) {
			return srcAttribute
		}

		// Or parse the inside as JSON
		// TODO: figure this out for if there are configuration parameters like
		// how MLLayer configures via `getProperty`
		return JSON.parse(this.innerText)
	}

	/**
	 *
	 * @param {string} id
	 * @returns {null | MLSource}
	 */
	static findSourceById(id) {
		const element = document.getElementById(id)
		if (!(element instanceof MLSource)) {
			return null
		}
		return element
	}
}
MLSource.register()

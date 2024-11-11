import { MLMap } from "./MLMap.js"
import { registerTag } from "./utils/registerTag.js"
import { MLSource } from "./MLSource.js"
import { getAttributeOrDataset } from "./utils/getAttributeOrDataset.js"
import { Map } from "maplibre-gl"

// import { getProperties } from "./properties.js"

/**
 * @typedef {import("maplibre-gl").LayerSpecification["type"]} LayerTypes
 */

class MLLayer extends HTMLElement {
	/**
	 * @param {string} tagName
	 */
	static register(tagName = "ml-layer") {
		registerTag(MLLayer, tagName)
	}

	/**
	 * @type {undefined | null | MLMap}
	 */
	connectedMap

	async connectedCallback() {
		this.connectedMap = MLMap.findMapElement(this)
		if (!this.connectedMap) { throw new Error("Map not found") }

		const map = await this.connectedMap.loaded()

		const sourceId = this.source()
		if (!sourceId) { throw new Error(`Source(${sourceId}) not found`) }

		const source = MLSource.findSourceById(sourceId)
		if (!source) { throw new Error(`Source(${sourceId}) not found`)}

		await source?.sourcePromise

		source.addEventListener(MLSource.events.removed, () => {
			console.debug("Re-adding layer", this.id)
			map.removeLayer(this.id)
			this.addLayer(map, source)
		})
		this.addLayer(map, source)
	}

	disconnectedCallback() {
		this.connectedMap?.map?.removeLayer(this.id)
	}

	/**
	 *
	 * @param {Map} map
	 * @param {MLSource} source
	 */
	addLayer(map, source) {
		map.addLayer({
			id: this.id,
			type: this.dataType(),
			source: source.id ?? "",
			paint: {
				"line-color": "#FFF",
				"line-width": 2,
			},
			// layout: layout,
			// paint: paint,
		})
	}


	source() {
		return getAttributeOrDataset(this, "source")
	}

	/**
	 * @returns {LayerTypes}
	 */
	dataType() {
		const value =
			/** Force type to be the type we expect so that we get autocomplete in the `switch`
			 * @type {LayerTypes}
			 */ (getAttributeOrDataset(this, "type"))
		switch (value) {
			case "background":
			case "circle":
			case "fill":
			case "fill-extrusion":
			case "heatmap":
			case "hillshade":
			case "line":
			case "raster":
			case "symbol": {
				return value
			}

			// If we didn't match the expected type, it's an error
			default: {
				// TODO: make error better
				throw new Error(
					`Attribute Value ("${value}") is not a valid Layer Type.`
				)
			}
		}
	}
}
MLLayer.register()

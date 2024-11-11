import { Marker } from "maplibre-gl"
import { MLMap } from "./MLMap.js"
import { registerTag } from "./utils/registerTag.js"
import { getAttributeOrDataset } from "./utils/getAttributeOrDataset.js"

class MLMarker extends HTMLElement {
	/**
	 * @param {string} tagName
	 */
	static register(tagName = "ml-marker") {
		registerTag(MLMarker, tagName)
	}

	async connectedCallback() {
		this.marker = new Marker()

		this.updateMarkerLocation()

		const map = await MLMap.findMapElement(this)?.loaded()
		if (!map) { return console.error("Could not resolve map", this) }

		this.marker.addTo(map)
	}

	disconnectedCallback() {
		this.marker?.remove()
	}

	static observedAttributes = [
		"long",
		"data-long",
		"lat",
		"data-lat",
	]

	attributeChangedCallback() {
		this.updateMarkerLocation()
	}

	updateMarkerLocation() {
		if (!this.marker) { return console.error("No marker present", this)}

		const center = this.center()
		if (!center) { return console.error("Element does not have coordinates specified", this) }

		this.marker.setLngLat(center)
	}

	/**
	 * @return {undefined | import("./types.js").GeoCoordinate} Coordinates from the attributes on the element
	 */
	center() {
		const lon = getAttributeOrDataset(this, "long")
		const lat = getAttributeOrDataset(this, "lat")

		if (!lon || !lat) {
			return undefined
		}

		return {
			lat: parseFloat(lat),
			lon: parseFloat(lon),
		}
	}
}
MLMarker.register()

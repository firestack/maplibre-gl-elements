import { Map } from "maplibre-gl"
import { registerTag } from "./utils/registerTag.js"
import { getAttributeOrDataset } from "./utils/getAttributeOrDataset.js"

/**
 * @typedef {Object} MapReference Object which contains a {@linkcode Map}
 * @property {Map} [map] {@linkcode Map} reference
 *
 * @typedef {HTMLElement & MapReference} MapReferenceElement HTML Element which stores a {@linkcode Map} on it
 */

class MapContainerNotFoundError extends Error {
	/**
	 * @param {string} mapId
	 */
	constructor(mapId) {
		const message = "Map Container not found"
		super(message)
		this.targetId = mapId
	}
}

/**
 * An HTML Custom Element which creates and manages a {@linkcode Map}
 *
 * Coordinates interactions between other declarative map components and
 * the MapLibre {@linkcode Map}
 */
export class MLMap extends HTMLElement {
	static events = {
		map: {
			loaded: "map.loaded",
		},
	}

	static #events = {
		map: {
			loaded: new Event(MLMap.events.map.loaded)
		}
	}

	/**
	 * The default HTML Tag that this element is registered under
	 * @constant {string}
	 * @default
	 */
	static customTagName = "ml-map"

	//#region HTML Custom Elements
	/**
	 * Defines a {@linkcode MLMap} {@link customElements HTML Custom Element}
	 * @param {string | undefined} [tagName] defaults to {@linkcode MLMap.customTagName}
	 */
	static register(tagName = MLMap.customTagName) { registerTag(MLMap, tagName) }

	connectedCallback() {
		this.#loadMap()
		this.addEventListener("test", () => console.debug("received", this))
	}

	adoptedCallback() {
		// TODO: check that this is what should be done when adopted
		this.#loadMap()
	}

	//#region Element Attributes

	/**
	 * @return {undefined | import("./types.js").GeoCoordinate}
	 */
	center() {
		const lon = getAttributeOrDataset(this, "center-long")
		const lat = getAttributeOrDataset(this, "center-lat")

		if (!lon || !lat) {
			return undefined
		}

		return {
			lat: parseFloat(lat),
			lon: parseFloat(lon),
		}
	}

	/**
	 * @return {number}
	 */
	zoom() {
		// TODO: Implement dynamic zoom?
		const initialZoomAttr = getAttributeOrDataset(this, "zoom")
		if (initialZoomAttr) {
			return parseFloat(initialZoomAttr)
		}

		const initialZoomData = this.dataset.initialZoom
		if (initialZoomData) {
			return parseFloat(initialZoomData)
		}

		return 16
	}

	/**
	 * @return {string}
	 */
	mapStyle() {
		return (
			this.attributes.getNamedItem("map-style")?.value ||
			"https://api.maptiler.com/maps/satellite/style.json"
		)
	}
	//#endregion Element Attributes
	//#endregion HTML Custom Elements

	//#region Child Element Utility Interface
		// TODO: Revisit design
	/**
	 * @param {HTMLElement} self
	 * @returns {Map | null}
	 */
	static getMap(self) {
		return MLMap.findMapElement(self)?.map ?? null
	}

	/**
	 * Finds the closest {@linkcode tagName} and asserts it is a {@linkcode MLMap}
	 * @param {HTMLElement} self
	 * @param {string} tagName the tag to search for.
	 * @returns {MLMap | null}
	 */
	static findMapElement(self, tagName = MLMap.customTagName) {
		const element = self.closest(tagName)
		if (!(element instanceof MLMap)) {
			return null
		}
		return element
	}

	/**
	 * Calls {@linkcode MLMap.findMapElement} and throws an error if it's not found
	 * @param {HTMLElement} self
	 * @param {string} tagName the tag to search for.
	 * @returns {MLMap}
	 */
	static requireMapElement(self, tagName = MLMap.customTagName) {
		const map = MLMap.findMapElement(self, tagName)
		if (!map) { throw new Error("Map not found") }
		return map
	}

	/**
	 *
	 * @returns {Promise<Map>} a promise that resolves once the map has loaded
	 */
	async loaded() {
		if (this.map?.loaded()) {
			return this.map
		}

		return new Promise((resolve) => {
			const eventListener = () => {
				this.removeEventListener(MLMap.events.map.loaded, eventListener)

				if (!this.map) {
					throw Error("Bad State: Map is not present")
				}
				resolve(this.map)
			}

			this.addEventListener(MLMap.events.map.loaded, eventListener)
		})
	}
	//#endregion Child Element Utility Interface

	//#region MapLibre Map
	/**
	 * @type {undefined | Map}
	 */
	get map() {
		const map = this.container?.map

		if (!map) { return undefined }

		return map
	}

	/**
	 * Private setter for {@linkcode MLMap#map}
	 * @param {Map} value
	 */
	set #map(value) {
		if (!this.container) { throw new Error("Container not found!")}
		this.container.map = value
	}

	#loadMap() {
		// Check if there is an existing map?
		const container = this.#findContainer()
		if (container instanceof MapContainerNotFoundError) {
			throw container
		}

		this.#mapContainer = container

		// Initialize Map on Container
		if (!this.map) {
			const settings = {
				style: getAttributeOrDataset(this, "style"),
				center: this.center(),
				zoom: this.zoom()
			}
			this.#map = new Map({
				// TODO: Check assumption, what if the container is removed between setting and using this?
				container: this.#mapContainer,
				...settings
			})
		}

		// Fire connected event
		const map = this.map
		if (!map) { throw new Error("inconsistent map state")}

		// - If map is already loaded, fire event
		if (this.map.loaded()) {
			this.dispatchEvent(MLMap.#events.map.loaded)
		}
		// - If map is not loaded, connect event to "load" event
		else {
			this.map.on("load", () => this.dispatchEvent(MLMap.#events.map.loaded))
		}
	}
	//#endregion MapLibre Map

	//#region Map Container
	/**
	 * Internal cached reference to the Map Container
	 * @type {undefined | MapReferenceElement}
	 */
	#mapContainer

	/**
	 * @returns {boolean} If {@linkcode #mapContainer} is in the document
	 */
	#containerInDocument() {
		return document.contains(this.#mapContainer ?? null)
	}

	/**
	 * The current container that this map is currently the MapLibre element
	 * @type {undefined | MapReferenceElement}
	 */
	get container() {
		if (!this.#mapContainer) { return undefined }

		if (!this.#containerInDocument()) {
			// TODO: Check assumptions, unsure if this is correct
			this.#mapContainer = undefined
			return undefined
		}

		return this.#mapContainer
	}

	/**
	 * @returns {MapReferenceElement | MapContainerNotFoundError}
	 * 	container to use for the map
	 */
	#findContainer() {
		const mapId = getAttributeOrDataset(this, "map-id")

		if (!mapId) {
			console.debug("`map-id` not specified, using `this`", this)
			return this
		}

		const container = document.getElementById(mapId)
		if (!container) { return new MapContainerNotFoundError(mapId) }

		return container
	}
	//#endregion Map Container
}
MLMap.register()

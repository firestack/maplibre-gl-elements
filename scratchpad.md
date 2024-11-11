
# MapLibre Custom Elements Design

## Ideas
### What if the actual maplibre object is stored on the container element?
So if the `ml-map` is recreated by liveview, I don't actually know if I want that
map to be recreated or not (probably create an ID?)

Anything that can control the map shouldn't rely on map creation, because the map
should be reused if possible to avoid any re-initialization

- the map should be able to recover from changes without affecting the user
State should ideally be in the query parameters or the DOM, so any state of the map
should be recoverable

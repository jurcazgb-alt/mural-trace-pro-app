# MURAL TRACE PRO V5.3.1 — correction

- Uses full image aspect ratio for fitting viewport; the trace resolution slider does not crop the source.
- SVG root is normalized to a 0 0 width height viewBox based on actual processed dimensions.
- Persistent pointer panning, independent zoom, fit/reset and proper pointer cancellation.
- SVG-to-PNG exports draw to the entire expected output area.
- Increased detail slider ceiling from 1000 to 2400 px (large images may overwhelm mobile memory).
- Updated service worker cache key to avoid stale deployments.

**Known limitations**: WASM on a physical iPad and production GitHub Pages deployment not verified here. VTracer paths are not exact deduplicated topology. Increase resolution carefully if Safari runs out of memory.

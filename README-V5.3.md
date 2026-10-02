# MURAL TRACE PRO V5.3 — SVG geometry bridge

This version links VTracer SVG paths to Outline, Boundaries and Kolorit views.

All outputs reuse exactly the same original VTracer SVG path `d` data; the derived views only modify presentation attributes.

**Important limitations:** Stroke outlines follow each SVG path, not a deduplicated shared-boundary graph. Overlapping paths may create duplicate outlines, white gaps, occluded edges, or ordering artifacts; this is not exact topological edge extraction. Color mapping is based on path fill colors or inherited SVG fill attributes, with luminance thresholds and a helper palette. Any CSS styles in the SVG are stripped in derived views. Full semantic grayscale classification, face-aware preservation and AI photo editing are not implemented. Browser and iPad functionality have not been validated by real-device execution.

To deploy: upload all files from this folder to the repository root, retaining `.github/workflows` and `vendor/vtracer`, commit on branch `v5.2-local-wasm`, then check GitHub Actions Pages deployment. Update `index.html` title if desired.

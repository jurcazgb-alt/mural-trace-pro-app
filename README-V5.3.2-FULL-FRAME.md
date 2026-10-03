# MURAL TRACE PRO V5.3.2 — FULL FRAME SVG

Fix: mandatory `viewBox=0 0 width height` at SVG preview, source views, and SVG export boundaries. This prevents VTracer coordinate content from being clipped when a portrait SVG is displayed at a smaller CSS width. Original geometry untouched.

Deploy: upload the contents of this folder maintaining paths, to branch `v5.3-svg-bridge`. Wait for Pages Actions deploy. Open with `?v=532`, or reload Safari after updating its service worker.

Test: same image Original and Vector at 100%, 41%, then SVG export. Confirm both shoulders and both sides of the face and hands.

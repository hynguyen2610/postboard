# Web Vitals Measurement Log

Use Chrome DevTools with `http://localhost:5173/?tab=windowed`. The application’s top-right `web-vitals` panel is optional; DevTools Performance and Network are the source of record for these lab runs.

## Run configuration

Record this once for each comparison pair. Keep every setting identical between the normal and windowed timelines.

| Setting | Value |
| --- | --- |
| Date / operator | |
| Chrome version | |
| Viewport / device emulation | |
| Network throttling | |
| CPU throttling | |
| Cache state | Cold / disabled cache |
| URL | `http://localhost:5173/` and `http://localhost:5173/?tab=windowed` |
| Test action | Initial load / scroll / tab switch / search |

## Initial-load comparison

1. Open the normal timeline URL in a new tab.
2. Open DevTools → Performance, enable screenshots and Web Vitals, then record a reload.
3. Note the LCP element and LCP time, plus every layout shift.
4. Repeat with the same configuration at the direct windowed timeline URL.

| Metric | Normal timeline | Web Vitals timeline (windowed) | Notes |
| --- | --- | --- | --- |
| LCP | | | Include the LCP element. |
| CLS | | | Include shifted element(s). |
| Total DOM nodes | | | DevTools → Elements / Performance. |
| Initial image requests | | | DevTools → Network → Img. |
| Image response format / dimensions | | | Record AVIF/WebP and selected `srcset` width. |
| Image transfer / cache headers | | | Compare raw GitHub JPEG with optimized immutable derivative. |
| JS heap / memory observation | | | Record the capture method. |

## Interaction comparison

Use a separate Performance recording for each action. Repeat the action in both modes.

| Action | Virtualized interaction / long task | Baseline interaction / long task | Notes |
| --- | --- | --- | --- |
| Switch between timelines | | | Inspect the click and next paint. |
| Scroll through the feed | | | Look for long tasks and dropped frames. |
| Search input | | | The main timeline must be selected for API search. |
| Load more | | | The main timeline must be selected. |

## Evidence checklist

- [ ] Screenshot or export of each Performance trace is saved outside the repository or linked here.
- [ ] Network waterfall confirms only the expected initial image is high priority.
- [ ] Layout Shift Regions show whether image loading shifts content.
- [ ] The actual LCP element is recorded; it is not assumed to be the first image.
- [ ] A before/after conclusion names the measured condition and result.

## Result summary

| Run version | Outcome | Next decision |
| --- | --- | --- |
| | | |

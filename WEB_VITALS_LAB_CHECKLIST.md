# Web Vitals Image Feed Lab Checklist

Goal: use the second timeline tab to learn how a 2,000-post, image-heavy feed affects LCP, INP, and CLS.

Reference: `web-vitals-fe-interview-prep (1).md`

## Build the fixture

- [ ] Create a deterministic, client-side fixture containing exactly 2,000 posts.
- [ ] Keep fixture posts separate from the API-backed, cursor-paginated main timeline.
- [ ] Assign one image to odd-numbered posts and two images to even-numbered posts.
- [ ] Cycle image paths through `sample-images/docs/image-1.jpg` through `image-2000.jpg`.
- [ ] Serve the image directory at a stable static URL, for example `/sample-images/image-42.jpg`.
- [ ] Do not import all images into JavaScript or embed them as data URLs.

## Build a stable virtualized timeline

- [ ] Keep the React Window viewport limited to five visible rows.
- [ ] Set a small `overscanCount` and record its value in the UI or code comment.
- [ ] Use a fixed row height with a fixed-ratio media area so `FixedSizeList` remains correct.
- [ ] Display two-image posts in a two-column media grid inside the row.
- [ ] Use `object-fit: cover` for consistent image crops.
- [ ] Set explicit `width` and `height` attributes and/or `aspect-ratio` on every image container.
- [ ] Confirm image loads do not move titles, captions, or following posts.

## Apply an image-loading strategy

- [ ] Make the first visible post image eager and high priority with `loading="eager"` and `fetchPriority="high"`.
- [ ] Do not lazy-load the expected LCP image.
- [ ] Use `loading="lazy"` and `decoding="async"` for all other images.
- [ ] Verify the network panel does not request images far outside the initial viewport.
- [ ] Record whether source images need resized, compressed, WebP, or AVIF variants for a production-quality version.

## Instrument Web Vitals

- [ ] Install and initialize the `web-vitals` package.
- [ ] Capture LCP with `onLCP`.
- [ ] Capture CLS with `onCLS`.
- [ ] Capture INP with `onINP`.
- [ ] Include metric value, rating, metric ID, navigation type, and attribution when available in each report.
- [ ] Report metrics to a temporary in-app panel or the console during development.
- [ ] Add `performance.mark()` calls for lab-tab activation, first list render, Load more, and search updates.
- [ ] Add a direct URL state such as `?tab=windowed` so initial-navigation LCP can be measured.

## Measure a baseline and improvement

- [ ] Add a temporary unvirtualized 2,000-post mode using the identical fixture and image rules.
- [ ] Keep network, CPU throttling, viewport, and cache state identical for comparison runs.
- [ ] Record DOM-node count, initial image request count, memory behavior, and scroll performance for both modes.
- [ ] Capture a DevTools Performance trace for initial load, rapid scrolling, tab switching, search, and Load more.
- [ ] Run Lighthouse with cold cache, mobile emulation, Slow 4G, and CPU throttling.
- [ ] Use Layout Shift Regions or the Performance panel to identify every layout-shift source.
- [ ] Use the Network waterfall to identify the actual LCP image and render-blocking resources.

## Validate targets

- [ ] LCP is below 2.5 seconds in the chosen lab profile.
- [ ] CLS is below 0.1, ideally near zero while images load.
- [ ] INP is below 200 ms for tab switching, search, scrolling, and Load more.
- [ ] The virtualized mode mounts only visible rows plus overscan, never all 2,000 cards.
- [ ] The first image is the LCP candidate by evidence, not assumption.
- [ ] Record before-and-after results, device/network profile, and remaining bottlenecks.

## Interview summary

- [ ] Explain that virtualization reduces DOM and render work, helping scroll responsiveness and INP.
- [ ] Explain that lazy loading and resource priority affect image network work and LCP.
- [ ] Explain that reserved image geometry prevents CLS.
- [ ] Explain that Lighthouse is lab data; real-user instrumentation is field data.
- [ ] Explain why a tab-only test is insufficient for initial-navigation LCP without a direct lab URL.

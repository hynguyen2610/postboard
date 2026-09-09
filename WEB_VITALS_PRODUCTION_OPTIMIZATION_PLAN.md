# Production Web Vitals Optimization Plan

Source: `report_2.json`, a Lighthouse navigation run against the production preview at `http://localhost:4173/?tab=windowed`.

## Current production baseline

| Metric | Result | Assessment |
| --- | ---: | --- |
| Performance | 98 | Strong baseline |
| FCP | 0.9 s | Good |
| LCP | 0.9 s | Good |
| CLS | 0.001 | Good |
| TBT | 0 ms | Good |
| Total transfer | 1.85 MiB | Dominated by images |

The report loaded seven remote GitHub JPEGs totalling approximately 1.65 MiB. Lighthouse estimates 966 KiB of image-delivery savings and 1.55 MiB of cache-lifetime savings. The report also identifies the Google Fonts stylesheet as a render-blocking request.

## Goals

- Preserve LCP below 2.5 s, CLS below 0.1, and TBT at or near zero.
- Reduce image bytes and repeat-visit transfer without changing the GitHub sample-image repository as the source of truth.
- Confirm the actual LCP element before prioritizing or preloading additional resources.
- Keep the normal and Web Vitals timelines comparable: both use the same remote image source, while the optimized timeline retains virtualization and stable media layout.

## Phase 0 — Establish clean measurement evidence

### Work

- Run Lighthouse in Incognito or another profile with browser extensions disabled.
- Use the production preview and the direct URL `?tab=windowed`.
- Keep viewport, network throttling, CPU throttling, and cache state identical for each comparison.
- Record the actual LCP element in DevTools Performance, plus Network image priorities and any layout shifts.

### Why

The report includes browser-extension scripts in unused/unminified JavaScript audits. These are not application bytes. LCP equals FCP at 0.9 s, which suggests the LCP candidate may be text rather than the first image; this must be confirmed before adding an image preload.

### Exit criteria

- [ ] A clean-profile Lighthouse JSON report is saved.
- [ ] The LCP element is recorded from DevTools.
- [ ] A virtualized-versus-normal comparison uses identical throttling and cache settings.

## Phase 1 — Optimize image delivery

### Work

- Keep `yavuzceliker/sample-images` as the canonical image source.
- Select an image CDN or an application-owned image proxy that can fetch the source image and return cached derivatives.
- Generate at least `320w`, `640w`, and `1280w` variants in AVIF or WebP, with JPEG fallback where required.
- Update `sampleImageCatalog.js` to provide the derivative URLs.
- Add `srcset` and `sizes` to optimized timeline images:
  - two-image card slot: approximately 314 CSS pixels;
  - one-image card slot: approximately 636 CSS pixels.
- Version transformed URLs and return `Cache-Control: public, max-age=31536000, immutable` for immutable variants.

### Why

The current raw GitHub JPEGs are often 1280 pixels wide but are rendered in 314- or 636-pixel slots. Their observed cache lifetime is only five minutes. These two issues account for almost all of Lighthouse’s remaining performance opportunity.

### Dependency / decision

Choose one implementation path before coding:

1. Managed image CDN with remote-source transformations.
2. Backend image proxy with resize, format negotiation, and edge/browser caching.
3. A separately deployed derivative-image service.

This choice changes external infrastructure and must be approved before implementation.

### Exit criteria

- [ ] Lighthouse image-delivery savings drop materially from the 966 KiB baseline.
- [ ] Repeat-visit cache-lifetime savings drop materially from the 1.55 MiB baseline.
- [ ] Network shows variants appropriate to each image slot.
- [ ] The actual LCP remains at or below the Phase 0 result, or any regression is explained and resolved.

## Phase 2 — Reduce font critical-path cost

### Work

- Inventory actual Inter and Source Serif weights used above the fold.
- Self-host or subset only those WOFF2 files.
- Preload the single critical font file only if the Phase 0 trace shows it blocks the LCP candidate.
- Keep `font-display: swap` or use system fallbacks where layout stability remains acceptable.

### Why

Lighthouse identifies the Google Fonts stylesheet as the render-blocking path, with an estimated 311 ms impact.

### Exit criteria

- [ ] The font stylesheet is removed from the render-blocking chain or justified by evidence.
- [ ] FCP and LCP remain equal to or improve on the Phase 0 baseline.
- [ ] No new layout shift is introduced by font loading.

## Phase 3 — Validate interaction cost; defer premature React work

### Work

- Capture DevTools Performance traces for scrolling, search, switching render modes, and Load more.
- Compare normal, virtualized, and unvirtualized-baseline modes using the measurement log.
- Inspect the existing 54 ms long task only if it repeats or affects an observed interaction.

### Why

Production TBT is zero, boot-up JavaScript is about 118 ms, and Lighthouse estimates no FCP/LCP time savings from unused application JavaScript. Code splitting or further virtualization tuning is therefore not a current navigation priority.

### Exit criteria

- [ ] The slowest meaningful interaction is documented.
- [ ] INP evidence or Performance traces support any subsequent React change.
- [ ] No optimization is merged based only on a development-server audit.

## Parallel quality cleanup

These findings do not materially block Web Vitals, but they explain the 93 accessibility and 83 SEO scores.

- [x] Add a `<main>` landmark around primary content.
- [x] Fix React Window’s ARIA list structure so `role="listitem"` has a valid `role="list"` parent.
- [x] Add a useful meta description.
- [x] Add a valid `robots.txt` rather than falling back to `index.html` for that request.

## Measurement record

Store each run in `WEB_VITALS_MEASUREMENT_LOG.md` and add behavior-changing performance work to `WEB_VITALS_ENHANCEMENTS.md`. Do not mark a target as achieved from code review alone; record the production measurement and test configuration.

# Web Vitals Enhancement Register

This register tracks enhancements applied to the image-feed lab. “Applied” means the code is present and has passed the production build; it does not mean a Core Web Vitals target has been measured or met.

## Current capability

The lab is available at `?tab=windowed`. Both timelines render the same backend post response and derive equivalent catalog media from each post ID:

- **Normal timeline:** renders the backend posts without virtualization.
- **Web Vitals timeline:** React Window renders a five-row viewport with two overscan rows.

## Applied enhancements

| Version | Commit | Enhancement | Primary Web Vitals effect | Status |
| --- | --- | --- | --- | --- |
| 0.1.0 | `6682a1a` | Added the Windowed lab tab using React Window. | Establishes a virtualized rendering path for INP and scroll-work comparison. | Applied |
| 0.2.0 | `5481461` | Added a separate deterministic 2,000-post image fixture and static image serving. | Provides a reproducible, image-heavy workload. | Applied |
| 0.3.0 | `e3d9969` | Fixed the list to five visible rows, added two-row overscan, and stabilized media geometry. | Reduces mounted DOM work; reserved media space protects CLS. | Applied |
| 0.4.0 | `381605e` | Made the first post image eager/high priority; lazy-loads and asynchronously decodes every other image. | Prioritizes the expected LCP candidate and limits below-the-fold image work. | Applied |
| 0.5.0 | `c70aded` | Added `web-vitals` LCP, CLS, and INP reporting, attribution, a live panel, console output, and performance marks. | Provides browser-measured evidence for all three Core Web Vitals. | Applied |
| 0.6.0 | `14f5bc2` | Added `?tab=windowed` direct navigation and suppressed API-feed requests for that lab navigation. | Made initial-navigation LCP testing more focused and repeatable. | Superseded in 1.1.0 |
| 0.7.0 | `5cf958f` | Added the unvirtualized 2,000-row baseline mode. | Created a controlled comparison for DOM size, scroll responsiveness, memory, and interaction cost. | Superseded in 1.1.0 |
| 0.8.0 | Uncommitted | Switched both timelines to the remote image catalogue, made the first tab the normal image-feed comparison, and made the second tab the optimized comparison with persistent metrics. | Removes local asset copying, makes timeline-media coverage explicit, and keeps metric visibility available during either comparison. | Ready for commit |
| 0.9.0 | Uncommitted | Added semantic landmarks, valid virtual-list ARIA ownership, metadata, and `robots.txt`. | Resolves the production Lighthouse accessibility and SEO findings without changing the measured Web Vitals path. | Ready for commit |
| 1.0.0 | Uncommitted | Added an allowlisted same-origin image-derivative API, responsive AVIF/WebP `srcset`s, browser-immutable caching, and preview API proxying for the optimized timeline. | Reduces oversized-image transfer and improves repeat-visit caching while retaining the canonical GitHub source. | Ready for measurement |
| 1.0.1 | Uncommitted | Replaced remote Google Fonts with local/system font stacks. | Removes render-blocking font requests and eliminates the measured late font-swap CLS cause on mobile. | Ready for measurement |
| 1.1.0 | Uncommitted | Replaced the separate fixture and baseline renderer with a shared backend post feed; retained the windowed renderer as the Web Vitals comparison. | Compares normal and windowed rendering of equivalent backend content and media. | Ready for measurement |

## How each enhancement should be evaluated

| Area | Applied implementation | Evidence to collect next |
| --- | --- | --- |
| LCP | First backend-post image uses eager loading and high fetch priority; optimized image slots request responsive derivatives. | Lighthouse/Performance trace confirming the actual LCP element and its timing. |
| CLS | Every image has dimensions, fixed media space, and crop behavior. | Layout Shift Regions and a browser trace confirming no shifts during image load. |
| INP | Five-row virtualization, two-row overscan, lazy media, and interaction performance marks. | DevTools Performance recordings for tab switching, search, scrolling, and loading more posts. |
| Controlled comparison | Both timelines share the backend post response and source image mapping; only the Web Vitals timeline is windowed and uses optimized derivatives. | DOM-node count, memory, request count, and trace comparisons under identical conditions. |

## Measurement status

No performance target has been claimed yet. The following evidence remains required:

- [ ] Browser Network-panel capture: initial image requests and loading priorities.
- [ ] Layout Shift Regions or Performance trace: image loading causes no shift.
- [ ] Lighthouse run: mobile emulation, Slow 4G, CPU throttling, cold cache.
- [ ] DevTools Performance traces: normal and windowed timelines under identical conditions.
- [ ] Recorded LCP, CLS, and INP results against the lab targets.
- [ ] Lighthouse comparison quantifies image-transfer and cache-lifetime change after v1.0.0.

## Versioning rules

- Add a new row for every behavior-changing Web Vitals enhancement.
- Use a new minor version for an independently testable lab capability; use a patch version for an adjustment to an existing capability.
- Record the implementation commit and change the status to `Applied` after the relevant production build succeeds and the commit is created.
- Update the measurement status when browser evidence is collected; never infer target compliance from code review alone.

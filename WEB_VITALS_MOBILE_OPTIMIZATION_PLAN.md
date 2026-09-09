# Mobile Web Vitals Optimization Plan

Source: `mobile_report.json`, Lighthouse mobile navigation at `http://localhost:4173/?tab=windowed` on 2026-09-09.

## Evidence and interpretation

| Metric | Mobile report | Target | Interpretation |
| --- | ---: | ---: | --- |
| Performance | 83 | 90+ | Meaningful opportunity, but this run is not a valid image-delivery comparison. |
| FCP | 3.2 s | <= 1.8 s | The render-blocking Google Fonts stylesheet is the primary reported opportunity. |
| LCP | 3.2 s | <= 2.5 s | LCP is the lab note text, not an image. Do not preload an image for this result. |
| CLS | 0.113 | <= 0.1 | 0.110 comes from Inter swapping after the feed has rendered. |
| TBT | 0 ms | <= 200 ms | No JavaScript execution optimization is justified by this run. |
| Total transfer | 232 KiB | — | Artificially low because all ten initial optimized image requests failed. |

Lighthouse records ten `404` responses for `/api/images/...` and corresponding console errors. This usually means the preview server was started but the API server on port 4000 was not restarted after the image-derivative route was added. The WebP/AVIF proxy itself is therefore unmeasured by this report.

## Phase 0 — Repair the measurement path first

### Work

- Stop and restart the backend from the current working tree on port 4000.
- Start the frontend production preview (`npm run build`, then `npm run preview`) so Vite proxies `/api` to that backend.
- Before Lighthouse, open `http://localhost:4173/api/images/image-1.jpg?v=1&width=320&format=webp` and confirm:
  - HTTP 200;
  - `Content-Type: image/webp` (or AVIF for the AVIF URL);
  - `Cache-Control: public, max-age=31536000, immutable`.
- Run Lighthouse in an Incognito/profile-without-extensions session, with a cold cache and the same mobile settings as this report.

### Exit criteria

- [ ] No `/api/images` 404s or console errors.
- [ ] Network shows actual AVIF/WebP bytes rather than 161-byte HTML error pages.
- [ ] The replacement report is saved separately and is labelled as the valid v1.0.0 mobile baseline.

## Phase 1 — Remove font-driven CLS and FCP delay

### Evidence

The external Google Fonts stylesheet is render blocking, with an estimated 902 ms contribution under Lighthouse's mobile simulation. Its Source Serif font response is about 122 KiB and Inter about 48 KiB. Lighthouse attributes 0.110 CLS to the Inter web-font swap; the remaining panel shifts total only about 0.003.

### Work

1. Inventory the exact Inter and Source Serif weights used above the fold, including the Web Vitals panel.
2. Create a controlled font experiment, one option at a time:
   - use system fallbacks for the lab shell, or
   - self-host/subset only required WOFF2 faces, or
   - retain `font-display: swap` with metric-compatible fallbacks (`size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override`).
3. Prefer the option that reduces CLS below 0.1 without harming readability or changing the learning lab's layout intent.
4. Re-run the same mobile test and compare FCP, LCP, CLS, font transfer, and visual appearance.

### Exit criteria

- [ ] CLS is <= 0.1 in repeated mobile runs.
- [ ] Font loading no longer creates the dominant layout shift.
- [ ] FCP/LCP improve, or a trace explains why they do not.

## Phase 2 — Verify responsive image selection on a real mobile viewport

### Work

- In Network, verify the first one-image post selects an appropriate derivative for its ~380 CSS-pixel mobile slot (normally 640w, depending on DPR).
- Verify two-image posts select a smaller candidate (normally 320w or 640w, depending on DPR).
- Confirm AVIF is selected in Chrome and WebP remains the fallback path.
- Compare image transfer and repeat-load caching with the previous raw-GitHub-JPEG baseline.

### Guardrails

- The current LCP element is text, so image preload is not a Phase 2 action.
- Keep image dimensions and fixed media geometry; the report does not attribute CLS to images.
- Do not interpret the current 232 KiB transfer size as an improvement: it includes failed image responses.

### Exit criteria

- [ ] Image responses are 200 and use expected dimensions/formats.
- [ ] Lighthouse reports no image-delivery regression.
- [ ] Repeat navigation uses immutable browser-cache entries where the browser cache is enabled.

## Phase 3 — Consider JavaScript splitting only after valid re-measurement

Lighthouse estimates 22 KiB unused application JavaScript, but reports no FCP/LCP savings and TBT is zero. It also includes 37 KiB of extension-script waste; use a clean profile before acting on that audit.

### Decision rule

- If the repaired mobile report still shows a meaningful application-JS opportunity or an interaction trace shows a delay, split the non-initial timeline code and defer the inactive normal-timeline path.
- Otherwise, keep the current single bundle: adding splitting complexity without a measured navigation or interaction gain is not justified.

## Measurement checklist

- [ ] Backend restarted from the branch containing `/api/images/{name}`.
- [ ] Production preview and backend are both running before the audit.
- [ ] Incognito/no-extension Lighthouse run completed.
- [ ] LCP element, LCP breakdown, and layout-shift culprits recorded.
- [ ] 200 image responses, formats, widths, cache headers, and transfer sizes recorded.
- [ ] Valid mobile before/after values copied to `WEB_VITALS_MEASUREMENT_LOG.md`.

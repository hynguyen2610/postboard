# Project rules

- Avoid deprecated APIs and dependencies when a supported alternative is practical.
- Use the `yavuzceliker/sample-images` GitHub repository as the source for timeline media. Reference images through `frontend/src/labs/sampleImageCatalog.js`; do not add local image copies or bundle post-media files without explicit approval.
- Every post shown in either timeline must include at least one image.
- Keep the first timeline as the normal comparison and the second timeline as the Web Vitals-optimized comparison. Preserve equivalent post-media content when comparing their performance.
- Keep the Web Vitals report visible in the page’s persistent top-right panel.

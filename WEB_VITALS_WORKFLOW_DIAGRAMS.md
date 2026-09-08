# Web Vitals Workflow Diagrams

These diagrams describe the current comparison lab. They are a guide for measurement and investigation, not evidence that any Core Web Vitals target has been met.

## 1. Timeline comparison and metric reporting

```mermaid
flowchart TD
    U[User opens Postboard] --> Q{URL has tab=windowed?}

    Q -->|No| N[Normal timeline]
    N --> A[Posts API and cursor pagination]
    A --> P[PostList and PostItem]
    P --> R1[Remote sample image catalogue]

    Q -->|Yes| W[Web Vitals timeline]
    W --> F[Deterministic 2,000-post fixture]
    F --> M{Render mode}
    M -->|Virtualized| V[React Window: 5 visible rows + 2 overscan rows]
    M -->|Baseline| B[All 2,000 rows mounted]
    V --> R2[Remote sample image catalogue]
    B --> R2

    R1 --> BR[Browser rendering and interactions]
    R2 --> BR
    BR --> WV[web-vitals observers: LCP, CLS, INP]
    WV --> REP[Metric report: value, rating, ID, navigation type, attribution]
    REP --> CON[DevTools console]
    REP --> PAN[Persistent top-right Web Vitals panel]
```

The normal timeline is the comparison path. The Web Vitals timeline is the optimized path: fixed virtual rows, reserved media space, and a prioritized first image. Its optional baseline mode is retained to isolate the effect of list virtualization while preserving the same fixture and image rules.

## 2. Initial navigation and metric lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant Main as main.jsx
    participant App as App
    participant Feed as Timeline or fixture
    participant Img as GitHub image source
    participant Obs as web-vitals observers
    participant Panel as Top-right panel

    U->>B: Open /?tab=windowed
    B->>Main: Load application
    Main->>Obs: startWebVitals()
    Main->>App: Render
    App->>App: Read tab=windowed
    App->>Feed: Render 2,000-post fixture
    Feed->>Img: First image: eager and high priority
    Feed->>Img: Other rendered images: lazy and async decode
    Img-->>B: Image responses
    B->>Obs: Largest contentful paint candidate
    Obs-->>Panel: LCP report and attribution

    B->>Obs: Layout shifts as content paints
    Obs-->>Panel: CLS report and attribution

    U->>B: Scroll, switch mode, search, or load more
    B->>Obs: Interaction and next paint
    Obs-->>Panel: INP report and attribution
    Obs-->>B: Console log with full metric record
```

## Metric interpretation

| Metric | What the diagram shows | What must still be confirmed in DevTools |
| --- | --- | --- |
| LCP | The optimized timeline prioritizes its first image as the expected candidate. | Whether that image is actually the largest contentful element. |
| CLS | Optimized rows reserve media space before an image loads. | Whether any image, font, or panel movement still shifts content. |
| INP | Browser interactions are reported after a next paint; virtualization reduces mounted-row work. | The slowest observed interaction under the selected test profile. |

## Assumptions and conformance

- Remote image URLs come only from `frontend/src/labs/sampleImageCatalog.js`.
- The normal and optimized timelines both render at least one image per post.
- The panel is rendered at the application level and fixed to the top-right, so it is available on either timeline.
- Direct navigation to `?tab=windowed` skips API-feed loading to isolate the optimized lab’s initial-navigation measurement.

Relevant code: `frontend/src/App.jsx`, `frontend/src/components/PostItem.jsx`, `frontend/src/components/WindowedPostTimeline.jsx`, `frontend/src/webVitals.js`, and `frontend/src/components/WebVitalsPanel.jsx`.

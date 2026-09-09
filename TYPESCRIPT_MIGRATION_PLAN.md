# TypeScript Migration Plan

## Objective

Convert the frontend and backend from JavaScript to TypeScript without changing
the public HTTP contract, timeline behavior, image-source rules, or Web Vitals
comparison.  Each phase must leave both applications runnable.

## Current state and boundaries

- The repository contains two independent ESM packages: `frontend/` (Vite +
  React) and `backend/` (Node + Express).
- There are no TypeScript configurations, type-check commands, or automated
  tests today.
- `docs/openapi.yaml` is the API contract. It covers posts, comments, load
  simulation, health, and image derivatives.
- The backend's `Map`-based image derivative cache is process memory only. The
  migration must not turn it into a disk or browser-storage cache.
- Both timelines must continue to use the approved remote sample-image
  catalogue, show at least one image per post, and preserve equivalent media.

## Decisions

| Concern | Decision |
| --- | --- |
| Module system | Keep ESM in both packages (`"type": "module"`). |
| Frontend execution | Vite transpiles `.ts`/`.tsx`; `tsc --noEmit` supplies the authoritative type check. |
| Backend execution | Compile TypeScript to `backend/dist/` with `tsc`; production `start` runs the emitted ESM JavaScript. Use `tsx` only for development watch mode. |
| HTTP types | Treat `docs/openapi.yaml` as the source of truth. Generate frontend request/response declarations with `openapi-typescript`; do not duplicate API shapes across React components. |
| Backend domain types | Define explicit domain and request types near the store/routes, and use the OpenAPI contract as the compatibility check rather than importing frontend code into the server. |
| Strictness | Start with `strict: true`; allow only narrowly documented interop exceptions while converting untyped third-party APIs. Do not use broad `any` or a project-wide `skipLibCheck` workaround. |

## Phase 0 — Establish the safety net

1. Record baseline behavior:
   - start both services;
   - exercise post creation, search, pagination, comments through depth 3, and
     load simulation;
   - load both timeline tabs and verify the Web Vitals panel remains visible;
   - request one AVIF and one WebP image derivative.
2. Add a root-level migration note to the developer documentation describing
   the two-package build order and generated-file policy.
3. Add typecheck scripts before converting source:
   - `frontend`: `typecheck` runs `tsc --noEmit`;
   - `backend`: `typecheck` runs `tsc --noEmit`;
   - retain existing dev/build/start commands until their replacements have
     been validated.
4. Add `.gitignore` entries for `backend/dist/` and TypeScript incremental
   build metadata, if emitted. Do not ignore generated API declarations if the
   team chooses to commit them.

Exit criteria: the current JavaScript application still builds/runs, each
package has a repeatable typecheck command, and generated-output policy is
written down.

## Phase 1 — Add configuration and the API type boundary

1. Install package-local TypeScript tooling and declarations:
   - frontend: `typescript`, React/React DOM declarations, and any necessary
     declarations for `react-window`;
   - backend: `typescript`, `tsx`, Node declarations, Express/CORS
     declarations, and `openapi-typescript` where generation is run.
2. Create `frontend/tsconfig.json` with browser DOM libraries, JSX support,
   `moduleResolution: "Bundler"`, `noEmit: true`, and strict checking.
3. Create `backend/tsconfig.json` with Node types, ESM-compatible module and
   module resolution settings, strict checking, `rootDir: "."`, and
   `outDir: "dist"`.
4. Add a generator script that converts `../docs/openapi.yaml` into a clearly
   owned file such as `frontend/src/api/openapi.d.ts`. Include a `generate:api`
   command and document whether this declaration file is committed.
5. Add small typed API adapters in `frontend/src/api.ts` rather than exposing
   generated operation shapes throughout UI code. The adapters should define
   `Post`, `Comment`, `CommentTree`, `CreatePostInput`, `CreateCommentInput`,
   pagination, image-derivative parameters, and a typed API error.

Exit criteria: `generate:api` is reproducible, a changed OpenAPI schema causes
frontend adapter type failures where appropriate, and no runtime behavior has
changed.

## Phase 2 — Convert the frontend incrementally

Convert in dependency order, renaming each file only after it typechecks:

1. Foundation modules:
   - `src/api.js` → `src/api.ts`;
   - `src/utils.js` → `src/utils.ts`;
   - `src/labs/sampleImageCatalog.js` → `.ts`;
   - `src/labs/windowedPostFixture.js` → `.ts`;
   - `src/webVitals.js` → `.ts`.
2. Define and reuse types for sample images, lab posts, Web Vitals reports,
   API posts, comments, nested comments, and callback/updater functions.
   Keep the fixture's media mapping deterministic; do not import or bundle its
   images.
3. Convert leaf React components to `.tsx`:
   `CommentForm`, `NewPostForm`, `WebVitalsPanel`, `PostList`, and `Header`.
   Type props, form events, nullable/loading state, and API error handling.
4. Convert recursive and data-owning components:
   `CommentThread`, `PostItem`, `WindowedPostTimeline`, and `App`.
   In particular, type `react-window` row/inner-element props, ref forwarding,
   abort-controller state, and state-updater callbacks.
5. Convert `main.jsx` to `main.tsx`, update imports to the renamed modules,
   and remove obsolete explicit `.js`/`.jsx` extensions where TypeScript's
   resolver requires it.
6. Run `npm run typecheck` and `npm run build` after every coherent batch.

Exit criteria: no frontend JavaScript source remains under `src/` other than
intentional configuration files; Vite production build and normal/Web Vitals
timeline checks pass; the Web Vitals panel stays persistent in the top-right.

## Phase 3 — Convert the backend

1. Create `backend/src/` and move/rename `store.js` and `server.js` to
   `src/store.ts` and `src/server.ts`. Update package scripts and output paths
   only after verifying the compiled entry point.
2. Define domain types in the backend:
   - `Post`, `Comment`, and `CommentWithReplies`;
   - create-post/create-comment inputs and store result unions;
   - paginated post result and image derivative type;
   - validated image width/format unions (`320 | 640 | 1280` and
     `"avif" | "webp"`).
3. Type Express handlers explicitly, including route parameters, query values,
   JSON response shapes, and error paths. Keep runtime validation—TypeScript
   does not validate untrusted HTTP input.
4. Type the image pipeline so `Buffer`, MIME type, cache key, and the bounded
   in-memory `Map` are explicit. Preserve the current 128-entry eviction and
   immutable response headers.
5. Change scripts to:
   - `dev`: run `tsx watch src/server.ts`;
   - `build`: run `tsc -p tsconfig.json`;
   - `start`: build first in deployment automation, then run
     `node dist/server.js`.
   Keep `start` deterministic; it should not silently rely on a globally
   installed TypeScript runtime.
6. Validate OpenAPI after route conversion and manually verify all documented
   status codes, especially invalid derivative requests and comment nesting.

Exit criteria: the backend compiles cleanly, starts from `dist/`, preserves
the documented API behavior, and retains RAM-only derivative caching.

## Phase 4 — Make type safety enforceable

1. Add a root convenience command (or documented CI sequence) that runs:

   ```text
   frontend: generate:api → typecheck → build
   backend: typecheck → build
   OpenAPI validation
   ```

2. Add focused tests before tightening difficult areas:
   - store pagination, search, and comment-depth rules;
   - image derivative parameter validation and cache eviction;
   - frontend API adapter response/error handling;
   - fixture media invariants (one-or-more image per post and stable mapping).
3. Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` after
   the initial conversion, addressing each result rather than suppressing it.
4. Add CI checks for generated API types being current and for both package
   typechecks/builds.

Exit criteria: a pull request cannot merge with stale contract declarations,
type errors, or a broken package build.

## Validation matrix

| Area | Required evidence |
| --- | --- |
| Contract | OpenAPI validation passes; generated declarations are current. |
| Backend | Typecheck/build pass; posts, comments, load simulation, and image error/success paths return the same statuses and shapes. |
| Frontend | Typecheck/build pass; post creation, search, load more, comments, and error messages work. |
| Image lab | Both timelines retain equivalent remote sample media; every post has image media; optimized derivatives still use AVIF/WebP `srcset`. |
| Web Vitals | Persistent panel is present in both tabs; optimized timeline still uses fixed virtual rows and image geometry. |
| Deployment | Backend is run from compiled `dist/`; no generated build output is committed. |

## Rollout and commits

Keep the migration reviewable with separate Conventional Commits:

1. `build: add TypeScript tooling and API type generation`
2. `refactor(frontend): migrate React application to TypeScript`
3. `refactor(backend): compile Express API from TypeScript`
4. `test: enforce TypeScript contract and build checks`

Do not combine runtime feature work, changes to the OpenAPI behavior, or cache
architecture changes with this migration. If a type discovery exposes a real
API mismatch, correct the contract and implementation together in a dedicated
change.

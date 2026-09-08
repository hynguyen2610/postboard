# Postboard

A small full-stack app: create posts, view them in a top-down timeline, search,
load more, and comment with up to 3 levels of nested replies. The backend also
has a button to simulate a heavily-loaded feed.

## Stack

- **Backend:** Node.js + Express, in-memory data store (no DB setup needed)
- **Frontend:** React + Vite, plain CSS (no UI framework)

## Project layout

```
postboard/
  backend/     Express API (posts, comments, load simulation)
  frontend/    React app (timeline, search, composer, comment threads)
```

## Running it

You need two terminals — one for each half of the stack.

**1. Backend** (starts on http://localhost:4000)

```bash
cd backend
npm install
npm start
```

**2. Frontend** (starts on http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The dev server proxies `/api/*` requests to
the backend, so no extra config is needed.

## Features

- **Timeline** — posts render newest-first, top to bottom.
- **Search** — debounced search across title, body, and author; resets pagination.
- **Load more** — cursor-based pagination, 10 posts per page.
- **New post** — a small composer with author, title, and body.
- **Comments, 3 levels deep** — top-level comment → reply → reply-to-reply.
  The "Reply" button disappears once a comment is at max depth, and the
  backend also rejects a 4th-level reply server-side.
- **Simulate heavy load** — a button in the header that asks the backend to
  generate 500 more synthetic posts (scattered across the past 30 days) so
  you can see how the feed, search, and pagination hold up as the dataset
  grows. Reads get a small artificial delay that scales with the total post
  count, standing in for "no index / full scan" behavior under load.

## API summary

| Method | Path                        | Purpose                                  |
|--------|-----------------------------|-------------------------------------------|
| GET    | `/api/posts?q=&cursor=&limit=` | Paginated, searchable timeline          |
| POST   | `/api/posts`                | Create a post                            |
| GET    | `/api/posts/:id`            | Fetch a single post                      |
| GET    | `/api/posts/:id/comments`   | Fetch a post's comment tree              |
| POST   | `/api/posts/:id/comments`   | Add a comment or reply (`parentId`)      |
| POST   | `/api/simulate-load`        | Bulk-generate posts (`{ count }`)        |

## Notes / things to extend

- Data is in-memory only — restarting the backend resets everything. Swapping
  `store.js` for a real database (Postgres, SQLite, etc.) would be the
  natural next step and wouldn't require changing the route handlers much.
- There's no auth — `author` is just a free-text field on posts/comments.
- The "heavy load" simulation is a simplified stand-in for real load testing.
  For something closer to production load testing you'd want a tool like
  k6 or autocannon hitting the API from outside the process.

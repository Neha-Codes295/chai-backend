# Playtube

Express + MongoDB API in [`backend/`](backend/), Vite + React + TypeScript UI in [`frontend/`](frontend/).

## Prerequisites

- Node.js (LTS), MongoDB, [Cloudinary](https://cloudinary.com/) (avatars and media uploads)

## Run locally

```bash
cd backend && npm install
```

Copy [`backend/.env.sample`](backend/.env.sample) → `backend/.env`, fill values, then:

```bash
npm run dev
```

API default: **http://localhost:8001**. Use **`CORS_ORIGIN=http://localhost:5173`** when the browser hits that origin (cookies).

```bash
cd frontend && npm install && npm run dev
```

UI: **http://localhost:5173**. Dev server proxies **`/api`** to the backend; fetches use **`credentials: 'include'`**.

## Environment

Never commit secrets. Templates: **`backend/.env.sample`**, [`frontend/.env.example`](frontend/.env.example). Ignored: `.env`, builds — see [`.gitignore`](.gitignore).

| File | Role |
|------|------|
| `backend/.env` | Mongo URI, JWT secrets, Cloudinary, `PORT`, `CORS_ORIGIN` |
| `frontend/.env` | Optional in dev. For **`npm run build`**, set **`VITE_API_URL`** (API origin, no trailing slash). |

## UI coverage

**Done:** auth (register / login / logout, refresh on 401 via `apiFetchWithRefresh`), home feed + load more + `/?q=` filter on loaded items, watch page (player, description, like when signed in, comments with edit/delete/like, history on first play).

**Not built yet:** upload/studio, real channel page, playlists, library/settings screens (routes may exist as stubs).

**Quirks:** video like UI doesn’t know “already liked” until you toggle — `GET /videos/:id` doesn’t include that. Channel JSON route **`GET /users/c/:username`** requires JWT on the backend today.

## Production build

```bash
cd frontend && npm run build
```

Output: `frontend/dist/`. Set **`VITE_API_URL`** before building.

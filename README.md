# Playtube

Full-stack video app: **Express + MongoDB** in [`backend/`](backend/), **Vite + React + TypeScript** in [`frontend/`](frontend/).

## What you need

- Node.js (LTS)
- MongoDB (local or Atlas)
- [Cloudinary](https://cloudinary.com/) — avatars, video, and thumbnail uploads use it

## Run locally

**API**

```bash
cd backend
npm install
```

Copy [`backend/.env.sample`](backend/.env.sample) to `backend/.env`, fill in values, then:

```bash
npm run dev
```

Default: **http://localhost:8001**. Set **`CORS_ORIGIN=http://localhost:5173`** if anything calls the API from the browser on that origin (cookies).

**UI**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. In dev, **`/api`** is proxied to the backend; auth relies on **cookies** (fetches already use `credentials: 'include'`).

## Environment files

Do **not** commit real secrets.

| Path | Notes |
|------|--------|
| `backend/.env` | From `.env.sample`. Mongo URI, JWT secrets, Cloudinary, `CORS_ORIGIN`, etc. |
| `frontend/.env` | Optional. Start from [`frontend/.env.example`](frontend/.env.example). For **production builds**, set **`VITE_API_URL`** to your API base URL (no trailing slash). |

Repo [**`.gitignore`**](.gitignore) ignores `.env` and build artifacts; keep **`.env.sample`** / **`.env.example`** in Git as templates.

## Frontend status

**Working:** shell (layout, routes, auth guards), register / login / logout, session refresh on failed authed requests (`apiFetchWithRefresh`), home feed of **published** videos with **Load more**, header search as **client-side filter** on already loaded items (`/?q=`).

**Still stubs:** watch page (no player yet), upload/studio, channel, playlists, history, subscriptions, settings, etc.

**Backend note:** `GET /api/v1/users/c/:username` is JWT-protected — channel pages expect the user to be signed in unless you change the API.

## Production UI

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`. Set **`VITE_API_URL`** before building so the app talks to your hosted API.

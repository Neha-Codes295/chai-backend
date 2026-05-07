# Playtube

Monorepo: [`backend/`](backend/) (Express + MongoDB) and [`frontend/`](frontend/) (Vite + React + TypeScript).

## Backend

```bash
cd backend
npm install
copy .env.sample .env   # then edit
npm run dev
```

Default API: **http://localhost:8001**. Set **`CORS_ORIGIN=http://localhost:5173`** when the browser calls the API directly (cookies).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev UI proxies **`/api`** → **`http://localhost:8001`**. Use **`credentials: 'include'`** (already wired) so login cookies work.

### App features

- Home feed, search (client filter), watch with comments, likes, subscribe, save to playlist  
- Register / login / logout (JWT cookies + refresh retry)  
- Upload video, Studio (stats + manage videos), playlists, channel (playlists + community tweets)  
- History, liked videos, subscriptions, account settings (profile, avatar, cover, password)

**Note:** Channel profile (`GET /users/c/:username`) is protected by the backend JWT middleware — users must be signed in to open channel pages.

## Environment files (never commit secrets)

- **`backend/.env`** — created locally from [`backend/.env.sample`](backend/.env.sample). Gitignored.
- **`frontend/.env`** — optional; copy from [`frontend/.env.example`](frontend/.env.example). Gitignored.

Tracked templates only: **`.env.sample`** / **`.env.example`**. Root [`.gitignore`](.gitignore) also ignores `*.local` and common build artifacts.

## Production UI build

```bash
cd frontend
npm run build
```

Set **`VITE_API_URL`** to your deployed API origin (no trailing slash).

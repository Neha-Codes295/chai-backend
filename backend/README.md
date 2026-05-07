# Playtube

Node API and Vite/React frontend for this project. Run installs and dev servers from this folder unless noted below.

## Backend API

```bash
cp .env.sample .env   # then edit values
npm install
npm run dev
```

Place `.env` next to `package.json`. Paths like `public/temp` assume the current working directory is this folder.

Deployment: point your host **root directory** here (or run `npm install && npm run dev` after `cd` into this folder).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

Original backend tutorial series: *chai aur backend* (JavaScript backend).

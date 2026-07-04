# CollaboDraw

Real-time collaborative whiteboard — 48-hour solo hackathon project.

This repo is currently a **scaffold only**: it compiles and runs end to end
(frontend, backend, MongoDB connection, Socket.IO handshake), but no
feature logic — auth, drawing, sync — has been implemented yet. See
`CollaboDraw_Architecture_Simplified.md` for the full build plan and phase
order; do not implement features out of phase order.

---

## Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine) and its connection string

---

## 1. Clone & install

```bash
git clone <your-repo-url> collabodraw
cd collabodraw

cd client
npm install

cd ../server
npm install
```

## 2. Configure environment variables

**server/.env** (copy from `server/.env.example`):

```bash
cd server
cp .env.example .env
```

Fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — `http://localhost:5173` for local dev

**client/.env** (copy from `client/.env.example`):

```bash
cd client
cp .env.example .env
```

Defaults (`VITE_API_URL=http://localhost:5000/api`,
`VITE_SOCKET_URL=http://localhost:5000`) are already correct for local dev.

## 3. Run

In one terminal:

```bash
cd server
npm run dev
```

In a second terminal:

```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health → `{"status":"ok"}`

## 4. Verify the scaffold

- Visiting http://localhost:5173 redirects to `/dashboard` and renders the
  placeholder Dashboard page inside the shared layout, styled with Tailwind.
- `/login`, `/register`, and `/board/:shareId` all render their placeholder
  pages via React Router.
- The backend terminal logs `MongoDB connected` and
  `Server running on port 5000` on boot.
- Opening the browser console shows no Socket.IO connection errors (the
  client socket is instantiated but not auto-connected yet — that's expected
  until Phase 4).

---

## Project structure

See `CollaboDraw_Architecture_Simplified.md` for the full annotated tree,
database schema, API list, Socket.IO event list, and phase-by-phase
timeline. This scaffold matches that document exactly.

## Git initialization

```bash
git init
git add .
git commit -m "chore: project scaffold per finalized architecture"
```

(A `.gitignore` is already present in both `client/` and `server/` so
`node_modules` and `.env` files are never committed.)

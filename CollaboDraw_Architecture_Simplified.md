# CollaboDraw — SIMPLIFIED Architecture & Build Plan (v2)
### Real-Time Collaborative Whiteboard — 48-Hour Solo Hackathon
### Optimized for: fastest path to a polished, working MVP

---

## 1. Tech Stack (unchanged)

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + TypeScript |
| Canvas Library | Konva.js (`react-konva`) |
| Real-time Library | Socket.IO (client + server) |
| Backend | Node.js + Express — **plain JavaScript** |
| Database | MongoDB (Atlas free tier) via Mongoose |
| Authentication | JWT (email + password, bcrypt hashing) — no email verification |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Deployment | Frontend → Vercel · Backend + Sockets → Render |

---

## 2. What Changed vs v1 (summary)

- ❌ `drawEvents` collection removed → shapes now live in `board.elements[]`
- ❌ Collaborative/global undo-redo removed → **local-only undo, server-relayed for sync**
- ❌ Backend TypeScript removed → plain JS (frontend keeps TS)
- ❌ `nanoid` removed → `uuid` used for both `shapeId` and `shareId`
- ❌ Email verification removed → register/login/JWT only
- ❌ `GET /boards/:shareId/events` removed → folded into board fetch
- ❌ Separate route/controller files and separate socket handler files merged (solo-dev flattening)
- ⏸ Level 3 features (shape manipulation, text tool, image support, export, board history, permissions) explicitly postponed until Level 1 + Level 2 are verified working across two browser tabs

---

## 3. Folder Structure

```
collabodraw/
├── client/                          # React frontend (TypeScript kept)
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.ts         # single axios instance + auth/board calls
│   │   ├── socket/
│   │   │   └── socketClient.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── boardStore.ts        # shapes (Map<shapeId, Shape>), local undo/redo stack
│   │   │   └── presenceStore.ts     # connected users, cursors (isolated from boardStore)
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   ├── Whiteboard.tsx
│   │   │   │   ├── ShapeLayer.tsx
│   │   │   │   ├── CursorLayer.tsx
│   │   │   │   └── shapes/
│   │   │   ├── toolbar/
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── ColorPicker.tsx
│   │   │   │   └── StrokeWidth.tsx
│   │   │   ├── presence/
│   │   │   │   ├── UserAvatars.tsx
│   │   │   │   └── LiveCursor.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── BoardCard.tsx
│   │   │   │   └── CreateBoardModal.tsx
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── BoardPage.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useCanvasTools.ts
│   │   │   └── useUndoRedo.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                          # Node backend — PLAIN JAVASCRIPT
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Board.js             # elements[] lives here now
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # route + handler logic combined
│   │   │   └── boardRoutes.js       # route + handler logic combined
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── sockets/
│   │   │   └── index.js             # join/leave/draw/undo/presence/cursor — one file
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   └── server.js
│   └── package.json
│
└── README.md
```

---

## 4. Database Schema (MongoDB / Mongoose)

**users**
```
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  passwordHash: String,
  createdAt: Date
}
```

**boards**  (drawEvents merged in as `elements`)
```
{
  _id: ObjectId,
  title: String,
  ownerId: ObjectId (ref: users),
  collaborators: [ObjectId] (ref: users),
  shareId: String (unique, short, indexed, generated via uuid),
  elements: [
    {
      shapeId: String,     // uuid, stable across the shape's lifetime
      userId: ObjectId,
      type: String,        // "freehand" | "line" | "rect" | "circle" | "erase"
      data: Mixed,          // tool-specific payload (same shapes as v1 §9)
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

No separate `drawEvents` collection. `$push` on `draw:end`, `$pull` on `shape:undo`, `$set elements: []` on clear.

---

## 5. Backend API (REST)

**Auth**
```
POST   /api/auth/register        { name, email, password } → { token, user }
POST   /api/auth/login           { email, password }        → { token, user }
GET    /api/auth/me              (auth required)             → { user }
```

**Boards**
```
GET    /api/boards               (auth) → boards owned by / shared with user
POST   /api/boards               (auth) { title } → creates board, returns shareId
GET    /api/boards/:shareId      (auth) → board metadata + elements[] (history hydration folded in)
DELETE /api/boards/:id           (auth) → only ownerId can delete
```

Drawing never goes through REST — only Socket.IO. REST is auth, board CRUD, and initial load only.

---

## 6. Socket.IO Events

**Client → Server**
```
"board:join"        { boardId, user }
"board:leave"        { boardId }
"draw:start"         { boardId, shapeId, type, data }
"draw:update"        { boardId, shapeId, data }        // throttled, in-progress freehand points
"draw:end"           { boardId, shapeId, data }        // triggers $push into board.elements
"canvas:clear"       { boardId }                        // triggers elements: []
"shape:undo"         { boardId, shapeId }               // triggers $pull
"shape:redo"         { boardId, shapeId, data }         // triggers $push
"cursor:move"        { boardId, userId, x, y }          // throttled ~20/sec client-side
```

**Server → Clients (room broadcast)**
```
"board:history"       [ element, element, ... ]   // = board.elements, sent once on join
"board:userJoined"    { userId, name }
"board:userLeft"      { userId }
"draw:broadcast"      { shapeId, type, data, userId }
"canvas:cleared"      { by: userId }
"shape:undone"        { shapeId }
"shape:redone"        { shapeId, data }
"cursor:broadcast"    { userId, x, y, name }
```

Rooms = board IDs. Undo/redo stack is local to each client (only their own `shapeId`s), but the removal/re-add is always relayed through the server so every connected client — including the author after a refresh — stays consistent.

---

## 7. 48-Hour Development Timeline (revised)

**Phase 1 — Foundation (Hours 0–5)**
Repo setup, plain-JS Express server boots, MongoDB connects, React app boots and hits a test route.
*Milestone: full-stack "Hello World" round-trip.*

**Phase 2 — Auth + Dashboard (Hours 5–10)**
Register/login/JWT middleware, Dashboard page, Create/List/Delete board REST + UI.
*Milestone: register → log in → create board → see it in list → delete it.*

**Phase 3 — Local Canvas (Hours 10–18)**
Konva stage, all 5 drawing tools, color/stroke controls, clear canvas, **local-only undo/redo** on own shapes.
*Milestone: one tab, full drawing experience works end to end.*

**Phase 4 — Real-Time Sync (Hours 18–27)**
Socket.IO wired up, JWT-authenticated handshake, room join/leave, draw broadcast, `board.elements` persistence via `$push`, history hydration on join. Test constantly with 2+ tabs.
*Milestone: two tabs draw simultaneously and stay in sync.*

**Phase 5 — Undo/Redo Sync + Persistence Check (Hours 27–31)**
`shape:undo`/`shape:redo` relayed to all clients, `$pull`/`$push` on board doc, refresh-mid-drawing test.
*Milestone: undo/redo is visible to everyone; refresh restores exact state.*

**Phase 6 — Presence + Cursors (Hours 31–35)**
Live user list, throttled cursor broadcasting, avatars/names.
*Milestone: you can see who else is on the board and where their cursor is.*

**Phase 7 — Polish + Early Deploy (Hours 35–40)**
Responsive Tailwind pass, loading/error/empty states, shareable link copy button, **deploy to Render/Vercel now** (moved earlier than v1 on purpose — surfaces CORS/env var/WebSocket-over-HTTPS bugs while you still have slack time).

**Phase 8 — Cross-Device Test + Fixes (Hours 40–44)**
Test deployed URLs on a second device/network, fix anything deployment-specific.

**Phase 9 — Buffer + Submission (Hours 44–48)**
README, demo script, screenshots, sleep buffer. No new features.

---

## 8. NPM Packages (final)

**Client**
```
react, react-dom, react-router-dom
zustand
socket.io-client
konva, react-konva
axios
tailwindcss, postcss, autoprefixer
uuid
typescript, @types/react, @types/react-dom
vite, @vitejs/plugin-react
```

**Server**
```
express
socket.io
mongoose
bcryptjs
jsonwebtoken
cors
dotenv
uuid              (replaces nanoid — used for shareId too)
```

No `nanoid`, no `ts-node`, no `typescript`/`@types/*` on the server.

---

This is the final blueprint. Build strictly in the order of Phases 1–9; do not start any Level 3 feature until Phase 6's milestone is verified in two simultaneous tabs.

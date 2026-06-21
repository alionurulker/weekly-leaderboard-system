# 🏆 Weekly Leaderboard System

A production-ready competitive leaderboard with real-time updates, automatic prize pool distribution, and a polished dark-arena UI built for competitive players.
https://weeklyleaderboard.onrender.com/
---

## ✨ Features

| Feature | Detail |
|---|---|
| ⚡ Real-time updates | WebSocket pushes rank changes instantly to all clients |
| 💰 Auto prize pool | 2% of earnings collected weekly, auto-distributed Monday 00:00 UTC |
| 🥇 Top 100 ranking | Redis Sorted Sets (`ZADD`, `ZREVRANK`) for O(log N) operations |
| 📍 Player context | Outside top 100? Shows 3 players above + 2 below you |
| 📱 Responsive | Mobile-first layout, works on all screen sizes |
| 🔄 Stateless backend | Every request self-contained — scales horizontally |
| 🐳 Docker ready | One command to spin up all databases locally |
| 🚀 Render deploy | `render.yaml` included for zero-config cloud deploy |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Redux Store ← WebSocket Hook ← WS /ws                  │
│  LeaderboardScreen                                       │
│    ├── PrizePoolBanner    (animated prize counter)       │
│    ├── CountdownTimer     (weekly reset countdown)       │
│    ├── PodiumDisplay      (top 3 special view)           │
│    ├── LeaderboardTable   (top 100 + player context)     │
│    └── EarningsSimulator  (demo: add earnings)           │
└────────────────────┬────────────────────────────────────┘
                     │ REST + WebSocket
┌────────────────────▼────────────────────────────────────┐
│                    BACKEND (Node.js)                     │
│  Express (stateless) + WebSocket Server                  │
│  Routes: /api/leaderboard  /api/players  /api/rewards    │
│  Services: leaderboardService  rewardService             │
│  Cron: weeklyReset (every Monday 00:00 UTC)              │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼──────┐  ┌───────▼────────┐
│    Redis    │  │  PostgreSQL   │  │    MongoDB     │
│             │  │               │  │                │
│ Sorted Set  │  │ players       │  │ score_events   │
│ ZADD scores │  │ weekly_snap   │  │ week_reset_log │
│ Prize pool  │  │ prize_pools   │  │ (analytics)    │
│ Player meta │  │ reward_txns   │  │                │
└─────────────┘  └───────────────┘  └────────────────┘
```

### Data Flow: Score Update
```
Player earns $1,000
       │
       ▼
POST /api/leaderboard/score { earnings: 1000 }
       │
       ├─► Redis: ZADD leaderboard:weekly INCR 1000 <playerId>
       ├─► Redis: INCRBYFLOAT leaderboard:prize_pool 20  (2%)
       ├─► Redis: ZREVRANK → new rank
       │
       ├─► WS broadcast → all clients: LEADERBOARD_UPDATE
       ├─► WS direct   → player:    PLAYER_SCORE_UPDATE
       │
       ├─► PostgreSQL: UPDATE players SET total_earnings += 1000  (async)
       └─► MongoDB:    INSERT score_events (audit trail, async)
```

### Prize Distribution (Monday 00:00 UTC)
```
Total Pool (collected all week via 2% contributions)
       │
       ├── Rank 1:    20% of pool
       ├── Rank 2:    15% of pool
       ├── Rank 3:    10% of pool
       └── Rank 4-100: 55% split by inverse-rank weight
                       (rank 4 gets most, rank 100 gets least)
                       weight(r) = 101 - r
                       share = 0.55 × weight(r) / Σweight(4..100)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose (for databases only)
- Node.js 20+

### 1. Clone & configure

```bash
git clone <repo-url>
cd weekly-leaderboard-system
cp .env.example backend/.env
```

### 2. Fill in `backend/.env`

The `.env` file lives inside the `backend/` folder. Update it with the following values for local development:

```dotenv
# Server
NODE_ENV=development
PORT=3001

# PostgreSQL
DATABASE_URL=postgresql://leaderboard:leaderboard_secret@localhost:5432/leaderboard

# Redis
REDIS_URL=redis://localhost:6379

# MongoDB (optional — analytics/audit trail only)
MONGODB_URI=mongodb://leaderboard:leaderboard_secret@localhost:27017/leaderboard?authSource=admin

# Auth
JWT_SECRET=dev-jwt-secret-change-in-production-please
ADMIN_SECRET=dev-admin-secret

# CORS
FRONTEND_URL=http://localhost:5173

# Cron (keep false in development)
ENABLE_CRON=false

# Frontend (only needed for production/Render deploys)
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=wss://your-backend.onrender.com/ws
```

> **Note:** `dotenv` loads from `backend/.env` automatically when running `npm run dev` from inside the `backend/` directory.

### 3. Start databases with Docker

Only the databases run in Docker. Backend and frontend are started manually.

```bash
docker compose up
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **MongoDB** on `localhost:27017`

Verify all three are healthy:

```bash
docker compose ps
```

You should see all containers with `(healthy)` status.

### 4. Start the backend

Open a new terminal:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`.

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. All `/api/*` requests are proxied to the backend automatically via Vite's proxy config.

### 6. Seed demo data

With the backend running, open a new terminal and run:

```bash
cd backend
npm run seed
```

This creates **250 players** with realistic Pareto-distributed scores plus a demo player (`YouAreHere`) positioned around rank 47.

Expected output:
```
Starting seed...
Redis connected
PostgreSQL connected
Created 50/250 players
Created 100/250 players
Created 150/250 players
Created 200/250 players
Created 250/250 players
Seed complete!
Players in leaderboard: 251
Prize pool: $xxxxxx
Demo credentials:
  Email: demo@leaderboard.com
  Password: password123
  Player ID: 00000000-0000-0000-0000-000000000001
```

### 7. Log in and test

Open `http://localhost:5173` and log in as the demo player (`YouAreHere`) using real JWT authentication. Once logged in:

- Your rank (~47th) appears in the banner at the top
- The **SIMULATE EARNINGS** panel appears on the left
- Click any quick amount or use the slider, then **ADD EARNINGS** to update your rank in real time

---

## 🗂️ Project Structure

```
weekly-leaderboard-system/
├── shared/
│   └── types/index.ts              # Shared TypeScript types
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts         # PostgreSQL pool + schema init
│   │   │   ├── redis.ts            # ioredis client + key constants
│   │   │   └── mongodb.ts          # Mongoose + event schemas
│   │   ├── services/
│   │   │   ├── leaderboardService.ts
│   │   │   ├── rewardService.ts
│   │   │   └── playerService.ts
│   │   ├── routes/
│   │   │   ├── leaderboard.ts
│   │   │   ├── players.ts
│   │   │   └── rewards.ts
│   │   ├── jobs/
│   │   │   └── weeklyReset.ts      # node-cron every Monday 00:00 UTC
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT middleware
│   │   ├── scripts/
│   │   │   └── seed.ts             # Demo data generator (250 players)
│   │   ├── websocket.ts
│   │   └── index.ts
│   ├── .env                        # Local env vars (not committed)
│   ├── Dockerfile                  # Not used in local dev
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/Leaderboard/
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   ├── PrizePoolBanner.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── PodiumDisplay.tsx
│   │   │   ├── LeaderboardTable.tsx
│   │   │   ├── PlayerRow.tsx
│   │   │   └── EarningsSimulator.tsx
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── leaderboardSlice.ts
│   │   │   └── playerSlice.ts      # loginDemoPlayer thunk for DEMO MODE
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── utils/
│   │   │   └── format.ts
│   │   ├── types/index.ts
│   │   ├── theme.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile                  # Not used in local dev
│   ├── nginx.conf
│   ├── index.html
│   ├── vite.config.ts              # Proxies /api and /ws to localhost:3001
│   └── package.json
│
├── docker-compose.yml              # Databases only (postgres, redis, mongodb)
├── render.yaml                     # Full stack deploy config for Render
├── .env.example                    # Template — copy to backend/.env
└── README.md
```

---

## 📡 API Reference

### Leaderboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leaderboard` | Optional | Top 100 + current player context |
| `POST` | `/api/leaderboard/score` | Required | Add earnings, update rank |
| `GET` | `/api/leaderboard/player/:id` | Optional | Specific player rank |

### Players
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/players/register` | — | Register new player |
| `POST` | `/api/players/login` | — | Login, get JWT |
| `GET` | `/api/players/me` | Required | My profile |
| `GET` | `/api/players/me/history` | Required | My weekly history |

### Rewards
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/rewards/current-pool` | — | Current prize pool amount |
| `GET` | `/api/rewards/history` | Required | My reward history |
| `POST` | `/api/rewards/distribute` | Admin | Manually trigger distribution |

### WebSocket Events
Connect to `ws://localhost:3001/ws?token=<jwt>`

| Event (server → client) | Payload |
|--------------------------|---------|
| `LEADERBOARD_UPDATE` | `{ top100, prizePool, totalPlayers }` |
| `PLAYER_SCORE_UPDATE` | `{ newRank, newScore, prizePool }` |
| `WEEK_RESET` | `{ previousWeek: { totalPool, distributions } }` |
| `CONNECTED` | `{ authenticated, serverTime }` |

---

## ⚙️ Redis Key Schema

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `leaderboard:weekly` | Sorted Set | None | Player scores (ZADD/ZREVRANK) |
| `leaderboard:prize_pool` | String | None | Cumulative 2% pool |
| `leaderboard:week_start` | String | None | Current week start ISO |
| `player:meta:<id>` | String (JSON) | 7d | Username/avatar/country cache |
| `player:prev_rank:<id>` | String | 7d | Previous rank for change indicator |

---

## 🌐 Deploy to Render

### Option A: render.yaml (recommended)
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your repo — Render reads `render.yaml` automatically
4. Set environment variables in the dashboard:
   - `JWT_SECRET` (generate a random 64-char string)
   - `ADMIN_SECRET`
   - `FRONTEND_URL` (your frontend Render URL)
   - `VITE_API_URL` / `VITE_WS_URL` (your backend Render URL)

### Option B: Manual
1. **Create Render PostgreSQL** → copy Internal URL
2. **Create Render Redis** → copy Internal URL
3. **Deploy backend** as a Web Service:
   - Root dir: `backend/`
   - Build: `npm ci && npm run build`
   - Start: `node dist/index.js`
   - Add env vars from `.env.example`
4. **Deploy frontend** as a Static Site:
   - Root dir: `frontend/`
   - Build: `npm ci && npm run build`
   - Publish: `dist/`
   - Add redirect rule: `/* → /index.html` (200)

---

## 🔒 Security Checklist

- [x] JWT authentication with 7-day expiry
- [x] bcrypt password hashing (12 rounds)
- [x] Helmet.js security headers
- [x] Express rate limiting (500 req/15min global, 10 req/s for score updates)
- [x] Input validation via express-validator
- [x] SQL injection prevention (parameterized queries)
- [x] Non-root Docker user
- [x] SSL enforcement on Render (automatic)
- [x] Admin endpoints protected by secret header

---

## 📊 Performance Notes

- **Score update latency**: < 5ms (Redis pipeline, 2 commands)
- **Leaderboard read**: < 10ms (Redis ZREVRANGE top 100 + MGET metadata)
- **WebSocket broadcast**: < 1ms per client (JSON serialized once)
- **Weekly distribution**: < 500ms for 100 players (single PG transaction)
- Redis sorted set supports millions of players with O(log N) rank operations

---

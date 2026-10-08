# Football Player Performance Analytics Dashboard — MVP Plan

## Overview

Build a web-based football player performance analytics dashboard covering Phase 1 (Foundation & Player Profiles) and Phase 2 (Match Reports & Comparison). The application uses mock/seed data for demo purposes, exposes a Python FastAPI backend with SQLite, and a React + TypeScript + Tailwind CSS frontend with Recharts and D3.js visualisations. A basic username/password authentication layer gates all routes.

**Non-goals (MVP):**
- No AI/ML features (no xG models, no recommendation engine)
- No live data feeds or third-party API integrations
- No CSV upload in the MVP

---

## Architecture

```
football_demo/
├── backend/                  # Python FastAPI application
│   ├── main.py               # App entry point, route registration
│   ├── database.py           # SQLite connection + SQLAlchemy setup
│   ├── models.py             # ORM table definitions
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── seed.py               # Mock data generator / seeder script
│   ├── auth.py               # JWT-based login + password hashing
│   └── routers/
│       ├── auth.py           # POST /auth/login
│       ├── players.py        # GET /players, /players/:id/stats, /players/:id/heatmap, /players/:id/shots
│       ├── teams.py          # GET /teams, /teams/:id
│       ├── matches.py        # GET /matches, /matches/:id, /matches/:id/events
│       └── compare.py        # GET /players/compare?ids=1,2
├── frontend/                 # React + TypeScript + Vite application
│   ├── src/
│   │   ├── api/              # Axios client + typed API functions
│   │   ├── components/       # Shared UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── StatsBadge.tsx
│   │   │   └── pitch/        # D3 pitch visualisation components
│   │   │       ├── PitchSVG.tsx
│   │   │       ├── Heatmap.tsx
│   │   │       ├── ShotMap.tsx
│   │   │       └── PassMap.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── TeamPage.tsx
│   │   │   ├── PlayerProfile.tsx
│   │   │   ├── MatchReport.tsx
│   │   │   └── PlayerComparison.tsx
│   │   ├── charts/           # Recharts wrappers
│   │   │   ├── RadarChart.tsx
│   │   │   ├── FormLineChart.tsx
│   │   │   └── SquadBarChart.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useAuth.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── router/
│   │   │   └── index.tsx     # React Router v6 routes + ProtectedRoute
│   │   └── main.tsx
│   ├── tailwind.config.ts
│   └── vite.config.ts
└── football-dashboard-mvp-plan.md
```

---

## Data Model

### Tables

| Table | Key Columns |
|---|---|
| `users` | id, username, hashed_password |
| `competitions` | id, name, country |
| `seasons` | id, competition_id, name, year |
| `teams` | id, name, short_name, season_id |
| `players` | id, name, position, dob, nationality, team_id |
| `matches` | id, season_id, home_team_id, away_team_id, date, home_score, away_score |
| `lineups` | id, match_id, player_id, team_id, starting_xi |
| `events` | id, match_id, player_id, type, x, y, minute, outcome, metadata_json |
| `stats_summary` | id, player_id, season_id, goals, assists, shots, shots_on_target, passes, pass_accuracy, minutes_played, matches_played, distance_covered |

---

## API Contract

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns JWT access token |

### Players
| Method | Path | Description |
|---|---|---|
| GET | `/players` | List all players, filterable by team/position/season |
| GET | `/players/{id}` | Single player detail |
| GET | `/players/{id}/stats` | Aggregated season stats |
| GET | `/players/{id}/heatmap` | Touch coordinates for pitch heatmap |
| GET | `/players/{id}/shots` | Shot events with x, y, outcome |
| GET | `/players/compare` | Two-player comparison payload via `?ids=1,2` |

### Teams
| Method | Path | Description |
|---|---|---|
| GET | `/teams` | All teams |
| GET | `/teams/{id}` | Team detail + squad list |

### Matches
| Method | Path | Description |
|---|---|---|
| GET | `/matches` | All matches, filterable by team/season |
| GET | `/matches/{id}` | Match detail with lineups and team stats |
| GET | `/matches/{id}/events` | Full event stream for a match |

---

## Sub-Tasks

---

### Sub-Task 1 — Backend Scaffolding & Database Setup

**Status:** [x] complete

**Intent:**
Establish the FastAPI project structure, SQLAlchemy + SQLite database connection, ORM models, and Pydantic schemas. This is the foundation every other backend sub-task builds on.

**Expected Outcomes:**
- `backend/` directory exists with `main.py`, `database.py`, `models.py`, `schemas.py`
- All ORM table classes defined matching the data model above
- SQLite database initialises on startup with `Base.metadata.create_all`
- FastAPI app starts without errors at `http://localhost:8000`
- `/docs` Swagger UI is accessible

**Todo List:**
1. Create `backend/` directory structure
2. Add `requirements.txt` with: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose[cryptography]`, `passlib[bcrypt]`
3. Implement `database.py` — SQLAlchemy engine, SessionLocal, Base, `get_db` dependency
4. Implement `models.py` — all ORM classes: User, Competition, Season, Team, Player, Match, Lineup, Event, StatsSummary
5. Implement `schemas.py` — Pydantic schemas for all models (request + response)
6. Implement `main.py` — create FastAPI app, call `create_all` on startup, register a health check `GET /`

**Relevant Context:**
- SQLite file stored at `backend/football.db`
- Use SQLAlchemy `relationship()` for player → team, event → player, event → match
- Pydantic v2 `model_config = ConfigDict(from_attributes=True)` for ORM mode

---

### Sub-Task 2 — Seed Data Generator

**Status:** [x] complete

**Intent:**
Populate the SQLite database with realistic mock data so the frontend has meaningful content to render without any third-party API dependency.

**Expected Outcomes:**
- Running `python seed.py` fills the DB with: 1 competition, 1 season, 4 teams, ~22 players per team, 10 matches, full event data (passes, shots, touches) per match, stats_summary rows per player
- Data is varied enough to make charts interesting (different goals, positions, form trends)
- Script is idempotent — re-running clears and re-seeds cleanly

**Todo List:**
1. Create `backend/seed.py`
2. Seed 1 competition + 1 season
3. Seed 4 teams with names and short names
4. Seed ~22 players per team with randomised positions, nationality, dob
5. Seed 10 matches with scores and dates spread across a season
6. Seed lineup records for each match
7. Seed event records (50–80 passes, 5–10 shots, 30–50 touches per player per match) with randomised x/y pitch coordinates
8. Seed stats_summary by aggregating or directly generating season totals per player
9. Create 1 default admin user (username: `admin`, password: `password`)

**Relevant Context:**
- Use Python `random` and `faker` (or just `random`) — no external data needed
- Events table `type` values: `"pass"`, `"shot"`, `"touch"`, `"tackle"`, `"dribble"`
- Shot `outcome` values: `"goal"`, `"saved"`, `"off_target"`, `"blocked"`
- Pass `outcome` values: `"complete"`, `"incomplete"`
- x/y coordinates are floats in range 0–120 (length) and 0–80 (width) representing a standard pitch

---

### Sub-Task 3 — Authentication API

**Status:** [x] complete

**Intent:**
Implement username/password login that returns a JWT. All protected API routes require a valid Bearer token. This gates the entire dashboard behind a login screen.

**Expected Outcomes:**
- `POST /auth/login` accepts `{username, password}`, returns `{access_token, token_type}`
- Invalid credentials return `401`
- A `get_current_user` FastAPI dependency can be applied to any route to protect it
- All non-auth routes return `401` if token is missing or invalid

**Todo List:**
1. Create `backend/auth.py` — `create_access_token`, `verify_password`, `get_password_hash`, `get_current_user` dependency
2. Create `backend/routers/auth.py` — `POST /auth/login` endpoint
3. Register auth router in `main.py`
4. Add JWT secret and expiry config via environment variable with a sensible default for dev
5. Apply `get_current_user` dependency to all non-auth routers

**Relevant Context:**
- Use `python-jose` for JWT, `passlib[bcrypt]` for password hashing
- Token payload: `{sub: username, exp: expiry}`
- Token expiry: 8 hours for MVP

---

### Sub-Task 4 — Players, Teams & Matches API Routers

**Status:** [x] complete

**Intent:**
Implement all read API endpoints for players, teams, matches, and the comparison endpoint. These are the data feeds consumed by every frontend page.

**Expected Outcomes:**
- All endpoints listed in the API Contract section above are functional
- Responses match the Pydantic schemas defined in Sub-Task 1
- Filtering works: `/players?team_id=1`, `/matches?season_id=1`
- `/players/{id}/heatmap` returns a list of `{x, y}` touch coordinates
- `/players/{id}/shots` returns a list of `{x, y, outcome, minute}`
- `/players/compare?ids=1,2` returns a side-by-side payload with stats for both players
- `/matches/{id}/events` returns the full event stream with player name and event type

**Todo List:**
1. Create `backend/routers/players.py` — implement all 5 player endpoints
2. Create `backend/routers/teams.py` — implement team list and team detail endpoints
3. Create `backend/routers/matches.py` — implement match list, match detail, match events endpoints
4. Create `backend/routers/compare.py` — implement compare endpoint
5. Register all routers in `main.py` under `/api/v1` prefix
6. Apply `get_current_user` dependency to all routers

**Relevant Context:**
- Heatmap endpoint: query `events` table where `player_id=id` and `type="touch"`, return `[{x, y}]`
- Shot map endpoint: query `events` table where `player_id=id` and `type="shot"`, return `[{x, y, outcome, minute}]`
- Pass map (match-level): query `events` for a match where `type="pass"`, return `[{x, y, end_x, end_y, outcome, player_name}]` — requires storing `end_x`, `end_y` in event metadata or as columns

---

### Sub-Task 5 — Frontend Scaffolding & Auth

**Status:** [x] complete

**Intent:**
Bootstrap the React + TypeScript + Tailwind + Recharts + D3 frontend, set up routing, implement the login page, auth context, and a protected route wrapper.

**Expected Outcomes:**
- `frontend/` Vite + React + TypeScript project exists
- Tailwind CSS is configured and working
- React Router v6 is set up with a `ProtectedRoute` that redirects to `/login` if no token
- Login page submits credentials to `POST /auth/login`, stores JWT in `localStorage`, redirects to `/`
- Logout clears the token and redirects to `/login`
- Axios instance in `api/` attaches the Bearer token to every request
- App shell with `Navbar` component renders on all protected pages

**Todo List:**
1. Scaffold with `npm create vite@latest frontend -- --template react-ts`
2. Install dependencies: `tailwindcss`, `react-router-dom`, `axios`, `recharts`, `d3`
3. Configure `tailwind.config.ts` and import in `index.css`
4. Create `AuthContext.tsx` — provides `token`, `login(token)`, `logout()` functions
5. Create `useAuth.ts` hook — reads from AuthContext
6. Create `api/client.ts` — Axios instance with base URL + request interceptor for Bearer token
7. Create `api/auth.ts` — `loginApi(username, password)` function
8. Create `router/index.tsx` — define routes and `ProtectedRoute` wrapper
9. Create `pages/Login.tsx` — form, submit handler, error display
10. Create `components/Navbar.tsx` — app name, nav links, logout button
11. Wire everything in `main.tsx` and `App.tsx`

---

### Sub-Task 6 — Phase 1 Frontend Pages

**Status:** [x] complete

**Intent:**
Build the Home, Team, and Player Profile pages with stat cards, bar charts, line charts, and radar charts. This completes Phase 1 of the MVP.

**Expected Outcomes:**
- `/` (Home) — displays top scorers list, top assisters list, and a matches list
- `/teams/:id` (Team Page) — shows squad table + bar chart of goals/assists per player
- `/players/:id` (Player Profile) — shows stats card, radar chart, form line chart, match log table
- All data fetched from the FastAPI backend via typed API functions
- Charts render correctly with Recharts

**Todo List:**
1. Create `api/players.ts`, `api/teams.ts`, `api/matches.ts` — typed fetch functions for all endpoints
2. Create `components/PlayerCard.tsx` and `components/StatsBadge.tsx`
3. Create `charts/RadarChart.tsx` — wraps Recharts `RadarChart` for 6 player attributes
4. Create `charts/FormLineChart.tsx` — wraps Recharts `LineChart` for match-by-match stat trend
5. Create `charts/SquadBarChart.tsx` — wraps Recharts `BarChart` for squad ranking
6. Create `pages/Home.tsx` — top scorers, top assisters, recent matches
7. Create `pages/TeamPage.tsx` — squad list + SquadBarChart
8. Create `pages/PlayerProfile.tsx` — StatsBadge grid + RadarChart + FormLineChart + match log table
9. Add routes `/`, `/teams/:id`, `/players/:id` to router

**Relevant Context:**
- Radar chart attributes: Goals, Assists, Pass Accuracy, Shots on Target, Distance Covered, Matches Played — normalised to 0–100 scale on frontend
- FormLineChart x-axis: match dates; y-axis: goals or assists per match
- Use Tailwind grid/flex layout throughout; no separate CSS files

---

### Sub-Task 7 — Phase 2 Pitch Visualisation Components

**Status:** [x] complete

**Intent:**
Build reusable D3-powered pitch SVG components: a base pitch, a touch heatmap overlay, a shot map, and a pass map. These are the distinguishing visual features of Phase 2.

**Expected Outcomes:**
- `PitchSVG.tsx` renders a correctly proportioned football pitch (120x80 units) with markings: centre circle, penalty areas, goal areas, halfway line, goals
- `Heatmap.tsx` overlays a density heatmap of touch coordinates on the pitch using D3 contours or a binned colour grid
- `ShotMap.tsx` renders dots on the pitch half at shot coordinates, coloured by outcome (green=goal, yellow=saved, red=off_target) and sized by distance from goal
- `PassMap.tsx` renders arrows from origin to end coordinate, coloured by outcome (blue=complete, red=incomplete)
- All pitch components are responsive (scale with container width)

**Todo List:**
1. Create `components/pitch/PitchSVG.tsx` — SVG pitch base with all standard markings, accepts `width` prop and scales height proportionally
2. Create `components/pitch/Heatmap.tsx` — accepts `touches: {x,y}[]`, renders a binned colour grid (10x8 cells) over the pitch with opacity proportional to touch count
3. Create `components/pitch/ShotMap.tsx` — accepts `shots: {x,y,outcome,minute}[]`, renders scaled dots on the attacking half of the pitch
4. Create `components/pitch/PassMap.tsx` — accepts `passes: {x,y,end_x,end_y,outcome}[]`, renders SVG lines/arrows coloured by outcome
5. Add legend components for ShotMap and PassMap

**Relevant Context:**
- Coordinate system: x=0–120 (goal-to-goal), y=0–80 (side-to-side); render inside SVG viewBox
- PitchSVG renders the full pitch outline and markings as `<rect>`, `<circle>`, `<line>` SVG elements — no external pitch image
- Heatmap uses a simple grid approach (not D3 contours) for MVP simplicity
- All D3 used for data transforms and scales only — rendering stays in React/SVG

---

### Sub-Task 8 — Phase 2 Frontend Pages

**Status:** [ ] pending

**Intent:**
Build the Match Report and Player Comparison pages, integrating the pitch visualisation components. This completes Phase 2 and the full MVP.

**Expected Outcomes:**
- `/matches/:id` (Match Report) — shows score, lineups, key events timeline, team stats side-by-side, pass map for each team
- `/players/compare` (Player Comparison) — search and select 2 players, shows radar chart overlay and stat diff table
- Heatmap and ShotMap visible on the Player Profile page (added to Sub-Task 6 page)
- All pitch visualisations render with real seeded data

**Todo List:**
1. Update `pages/PlayerProfile.tsx` — add `Heatmap` and `ShotMap` sections below the existing charts
2. Create `pages/MatchReport.tsx` — score header, lineups table, events timeline, team stats comparison table, PassMap per team
3. Create `pages/PlayerComparison.tsx` — two player-search dropdowns, radar overlay (2 datasets on one RadarChart), stat diff table
4. Create `api/compare.ts` — typed fetch for `/players/compare?ids=1,2`
5. Add routes `/matches/:id` and `/players/compare` to router
6. Add navigation links from Home and Player Profile pages to these new pages

**Relevant Context:**
- Radar overlay: Recharts `RadarChart` supports multiple `<Radar>` children on the same chart with different colours
- Events timeline: a simple vertical list sorted by minute with an icon per event type
- Team stats comparison: a two-column table (home vs away) for possession, shots, passes, pass accuracy

---

## Definition of Done (Full MVP)

- [ ] FastAPI backend starts cleanly with `uvicorn backend.main:app --reload`
- [ ] `python backend/seed.py` populates SQLite with demo data
- [ ] All API endpoints return correct data and are protected by JWT
- [ ] Frontend starts cleanly with `npm run dev` inside `frontend/`
- [ ] Login page authenticates and stores token
- [ ] Home, Team, Player Profile, Match Report, Player Comparison pages all render correctly
- [ ] All 3 Recharts charts (Radar, Line, Bar) display real data
- [ ] All 3 pitch visualisations (Heatmap, ShotMap, PassMap) display real data
- [ ] Logout clears session and redirects to login

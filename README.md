# Football Player Performance Analytics Dashboard

A full-stack football analytics dashboard for exploring player stats, match reports, and side-by-side player comparisons. Built with a **FastAPI** backend (SQLite + JWT auth) and a **React + TypeScript** frontend (Recharts + D3 pitch visualisations).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Default Credentials](#default-credentials)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Pages & Screenshots](#pages--screenshots)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **JWT Authentication** — Login gate on all routes; 8-hour token expiry
- **Home Dashboard** — Top scorers, top assisters, and recent match results
- **Team Page** — Full squad roster + goals/assists bar chart per player
- **Player Profile** — Stats card, radar chart (6 attributes), form line chart, match log, touch heatmap, and shot map
- **Match Report** — Score header, lineups, key-events timeline, team stats comparison, and per-team pass map
- **Player Comparison** — Select any 2 players for a radar overlay and stat diff table
- **Pitch Visualisations** — D3-powered SVG heatmap, shot map, and pass map rendered directly on a proportioned football pitch
- **Seed Data** — One-command mock data generator (4 teams × ~22 players, 10 matches, full event streams)

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) 0.111 |
| Server | [Uvicorn](https://www.uvicorn.org/) 0.29 |
| ORM | [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 |
| Database | SQLite (file: `backend/football.db`) |
| Validation | [Pydantic](https://docs.pydantic.dev/) v2 |
| Auth | `python-jose` (JWT) + PBKDF2-SHA256 password hashing |

### Frontend
| Layer | Technology |
|---|---|
| Framework | [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Pitch visuals | [D3.js](https://d3js.org/) (scales + transforms, SVG rendering in React) |
| HTTP client | [Axios](https://axios-http.com/) |
| Routing | [React Router v6](https://reactrouter.com/) |
| State | React Context + Redux Toolkit |

---

## Project Structure

```
football_demo_github/
├── backend/
│   ├── main.py               # FastAPI app entry point + CORS + router registration
│   ├── database.py           # SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   ├── models.py             # ORM table definitions
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT creation, password hashing, get_current_user dependency
│   ├── seed.py               # Mock data generator — run once to populate the DB
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py           # POST /auth/login
│       ├── players.py        # GET /api/v1/players  + stats / heatmap / shots
│       ├── teams.py          # GET /api/v1/teams
│       ├── matches.py        # GET /api/v1/matches  + events
│       └── compare.py        # GET /api/v1/players/compare?ids=1,2
├── frontend/
│   ├── src/
│   │   ├── api/              # Typed Axios wrappers (auth, players, teams, matches, compare)
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── StatsBadge.tsx
│   │   │   └── pitch/        # PitchSVG, Heatmap, ShotMap, PassMap
│   │   ├── charts/           # RadarChart, FormLineChart, SquadBarChart (Recharts wrappers)
│   │   ├── pages/            # Login, Home, TeamPage, PlayerProfile, MatchReport, PlayerComparison
│   │   ├── context/          # AuthContext (token, login, logout)
│   │   ├── hooks/            # useAuth
│   │   └── router/           # React Router routes + ProtectedRoute
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── football-dashboard-mvp-plan.md
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm 9+**
- Git

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Seed the database with mock data
python seed.py

# 5. Start the development server
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Swagger UI (interactive docs): **http://localhost:8000/docs**

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

> **Note:** The frontend expects the backend running on `http://localhost:8000`. This is pre-configured in `src/api/client.ts`.

---

## Default Credentials

After running `python seed.py` the following user is created:

| Username | Password |
|---|---|
| `admin` | `password` |

---

## API Reference

All endpoints (except `/auth/login`) require a `Bearer` token in the `Authorization` header.

### Authentication
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login — returns `{ access_token, token_type }` |

### Players
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/players` | List all players; filter by `?team_id=` / `?position=` |
| `GET` | `/api/v1/players/{id}` | Single player detail |
| `GET` | `/api/v1/players/{id}/stats` | Aggregated season statistics |
| `GET` | `/api/v1/players/{id}/heatmap` | Touch coordinates `[{x, y}]` for pitch heatmap |
| `GET` | `/api/v1/players/{id}/shots` | Shot events `[{x, y, outcome, minute}]` |
| `GET` | `/api/v1/players/compare` | Two-player comparison via `?ids=1,2` |

### Teams
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/teams` | All teams |
| `GET` | `/api/v1/teams/{id}` | Team detail + squad list |

### Matches
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/matches` | All matches; filter by `?team_id=` / `?season_id=` |
| `GET` | `/api/v1/matches/{id}` | Match detail with lineups and team stats |
| `GET` | `/api/v1/matches/{id}/events` | Full event stream for a match |

---

## Data Model

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

**Event types:** `pass`, `shot`, `touch`, `tackle`, `dribble`  
**Shot outcomes:** `goal`, `saved`, `off_target`, `blocked`  
**Pass outcomes:** `complete`, `incomplete`  
**Pitch coordinates:** x = 0–120 (goal-to-goal), y = 0–80 (side-to-side)

---

## Pages & Screenshots

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Credential form — stores JWT in `localStorage` |
| `/` | Home | Top scorers, top assisters, recent matches |
| `/teams/:id` | Team Page | Squad roster + goals/assists bar chart |
| `/players/:id` | Player Profile | Stats, radar chart, form line chart, heatmap, shot map |
| `/matches/:id` | Match Report | Score, lineups, events timeline, team stats, pass map |
| `/players/compare` | Player Comparison | Side-by-side radar chart overlay + stat diff table |

---

## Environment Variables

The backend reads one optional environment variable:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET_KEY` | `football_demo_dev_secret_change_in_prod` | Secret used to sign JWTs — **change this in production** |

Set it before starting the server:

```bash
# Windows (PowerShell)
$env:JWT_SECRET_KEY = "your-strong-random-secret"

# macOS / Linux
export JWT_SECRET_KEY="your-strong-random-secret"
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is released for demonstration and learning purposes.

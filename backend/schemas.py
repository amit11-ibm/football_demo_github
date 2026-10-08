from pydantic import BaseModel, ConfigDict
from typing import Optional, List


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Competition ───────────────────────────────────────────────────────────────

class CompetitionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    country: str


# ── Season ────────────────────────────────────────────────────────────────────

class SeasonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    competition_id: int
    name: str
    year: int


# ── Team ──────────────────────────────────────────────────────────────────────

class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    short_name: str
    season_id: int


class TeamDetailOut(TeamOut):
    players: List["PlayerOut"] = []


# ── Player ────────────────────────────────────────────────────────────────────

class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    position: str
    dob: str
    nationality: str
    team_id: int


class PlayerDetailOut(PlayerOut):
    team: TeamOut


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatsSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    player_id: int
    season_id: int
    goals: int
    assists: int
    shots: int
    shots_on_target: int
    passes: int
    pass_accuracy: float
    minutes_played: int
    matches_played: int
    distance_covered: float


# ── Match ─────────────────────────────────────────────────────────────────────

class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    season_id: int
    home_team_id: int
    away_team_id: int
    date: str
    home_score: int
    away_score: int


class LineupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    player_id: int
    team_id: int
    starting_xi: bool
    player: PlayerOut


class MatchDetailOut(MatchOut):
    home_team: TeamOut
    away_team: TeamOut
    lineups: List[LineupOut] = []


# ── Event ─────────────────────────────────────────────────────────────────────

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    player_id: int
    type: str
    x: float
    y: float
    end_x: Optional[float] = None
    end_y: Optional[float] = None
    minute: int
    outcome: Optional[str] = None
    player: PlayerOut


# ── Pitch visualisation payloads ──────────────────────────────────────────────

class TouchPoint(BaseModel):
    x: float
    y: float


class ShotPoint(BaseModel):
    x: float
    y: float
    outcome: str
    minute: int


class PassPoint(BaseModel):
    x: float
    y: float
    end_x: float
    end_y: float
    outcome: str
    player_name: str


# ── Compare ───────────────────────────────────────────────────────────────────

class PlayerCompareOut(BaseModel):
    player: PlayerOut
    stats: Optional[StatsSummaryOut] = None


class CompareOut(BaseModel):
    players: List[PlayerCompareOut]


# Forward-ref resolution
TeamDetailOut.model_rebuild()

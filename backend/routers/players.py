from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=List[schemas.PlayerOut])
def list_players(
    team_id: Optional[int] = None,
    position: Optional[str] = None,
    season_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Player)
    if team_id:
        q = q.filter(models.Player.team_id == team_id)
    if position:
        q = q.filter(models.Player.position == position)
    if season_id:
        q = q.join(models.Team).filter(models.Team.season_id == season_id)
    return q.all()


@router.get("/{player_id}", response_model=schemas.PlayerDetailOut)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    player = (
        db.query(models.Player)
        .options(joinedload(models.Player.team))
        .filter(models.Player.id == player_id)
        .first()
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/{player_id}/stats", response_model=List[schemas.StatsSummaryOut])
def get_player_stats(
    player_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    stats = (
        db.query(models.StatsSummary)
        .filter(models.StatsSummary.player_id == player_id)
        .all()
    )
    return stats


@router.get("/{player_id}/heatmap", response_model=List[schemas.TouchPoint])
def get_player_heatmap(
    player_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    events = (
        db.query(models.Event)
        .filter(models.Event.player_id == player_id, models.Event.type == "touch")
        .all()
    )
    return [schemas.TouchPoint(x=e.x, y=e.y) for e in events]


@router.get("/{player_id}/shots", response_model=List[schemas.ShotPoint])
def get_player_shots(
    player_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    events = (
        db.query(models.Event)
        .filter(models.Event.player_id == player_id, models.Event.type == "shot")
        .all()
    )
    return [
        schemas.ShotPoint(x=e.x, y=e.y, outcome=e.outcome or "off_target", minute=e.minute)
        for e in events
    ]

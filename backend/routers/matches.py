from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=List[schemas.MatchOut])
def list_matches(
    team_id: Optional[int] = None,
    season_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Match)
    if season_id:
        q = q.filter(models.Match.season_id == season_id)
    if team_id:
        q = q.filter(
            (models.Match.home_team_id == team_id) | (models.Match.away_team_id == team_id)
        )
    return q.order_by(models.Match.date).all()


@router.get("/{match_id}", response_model=schemas.MatchDetailOut)
def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    match = (
        db.query(models.Match)
        .options(
            joinedload(models.Match.home_team),
            joinedload(models.Match.away_team),
            joinedload(models.Match.lineups).joinedload(models.Lineup.player),
        )
        .filter(models.Match.id == match_id)
        .first()
    )
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.get("/{match_id}/events", response_model=List[schemas.EventOut])
def get_match_events(
    match_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    events = (
        db.query(models.Event)
        .options(joinedload(models.Event.player))
        .filter(models.Event.match_id == match_id)
        .order_by(models.Event.minute)
        .all()
    )
    return events

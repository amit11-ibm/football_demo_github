from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=List[schemas.TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.Team).all()


@router.get("/{team_id}", response_model=schemas.TeamDetailOut)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    team = (
        db.query(models.Team)
        .options(joinedload(models.Team.players))
        .filter(models.Team.id == team_id)
        .first()
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

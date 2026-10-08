from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/players", tags=["compare"])


@router.get("/compare", response_model=schemas.CompareOut)
def compare_players(
    ids: str = Query(..., description="Comma-separated player IDs, e.g. 1,2"),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    id_list = [int(i.strip()) for i in ids.split(",")][:2]
    result = []
    for pid in id_list:
        player = db.query(models.Player).filter(models.Player.id == pid).first()
        if not player:
            raise HTTPException(status_code=404, detail=f"Player {pid} not found")
        stats = (
            db.query(models.StatsSummary)
            .filter(models.StatsSummary.player_id == pid)
            .first()
        )
        result.append(schemas.PlayerCompareOut(
            player=schemas.PlayerOut.model_validate(player),
            stats=schemas.StatsSummaryOut.model_validate(stats) if stats else None,
        ))
    return schemas.CompareOut(players=result)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import (
    AviationstackAirportResponse,
    AviationstackImportResult,
    AviationstackManualCreate,
    AviationstackManualResult,
)
from ..services import flights_service

router = APIRouter(prefix="/flights", tags=["flights"])


@router.post("/import-aviationstack", response_model=AviationstackImportResult)
async def import_aviationstack(
    limit: int | None = Query(default=None), db: Session = Depends(get_db)
) -> dict:
    imported, fetched, external_upserts = flights_service.import_aviationstack_flights(
        db, limit
    )
    return {
        "imported": imported,
        "fetched": fetched,
        "external_upserts": external_upserts,
    }


@router.get(
    "/aviationstack/{airport}", response_model=AviationstackAirportResponse
)
async def get_aviationstack_airport(
    airport: str, limit: int = Query(default=20, ge=1, le=100)
) -> dict:
    return flights_service.fetch_aviationstack_airport(airport, limit)


@router.get("/{airport}", response_model=AviationstackAirportResponse)
async def get_airport_from_db(
    airport: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    return flights_service.fetch_aviationstack_airport_from_db(db, airport, limit)


@router.post("/aviationstack/manual", response_model=AviationstackManualResult)
async def create_aviationstack_manual(
    payload: AviationstackManualCreate,
    airport: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    stored, status_note = flights_service.store_aviationstack_item(
        db, payload.payload, airport
    )
    if status_note != "ok":
        raise HTTPException(status_code=400, detail=status_note)
    return {"stored": stored}

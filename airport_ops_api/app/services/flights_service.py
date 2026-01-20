import os

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..enums import FlightStatus
from ..models import ExternalFlightDB


def _map_aviationstack_status(raw_status: str | None) -> FlightStatus:
    if not raw_status:
        return FlightStatus.SCHEDULED
    status = raw_status.lower()
    if status in {"scheduled"}:
        return FlightStatus.SCHEDULED
    if status in {"active", "en-route", "enroute"}:
        return FlightStatus.DEPARTED
    if status in {"landed"}:
        return FlightStatus.ARRIVED
    if status in {"cancelled"}:
        return FlightStatus.CANCELLED
    if status in {"incident", "diverted", "delayed"}:
        return FlightStatus.DELAYED
    return FlightStatus.SCHEDULED


def _normalize_iata_value(code: str | None) -> str:
    if not code:
        return "UNK"
    value = code.strip().upper()
    return value if len(value) == 3 else "UNK"


def store_aviationstack_item(
    db: Session, item: dict, _airport: str | None
) -> tuple[bool, str]:
    flight_info = item.get("flight") or {}
    airline_info = item.get("airline") or {}
    departure_info = item.get("departure") or {}
    arrival_info = item.get("arrival") or {}

    flight_number = (flight_info.get("iata") or flight_info.get("icao") or "").upper()
    if not flight_number:
        return False, "missing_flight_number"

    airline_code = (airline_info.get("iata") or airline_info.get("icao") or "UNK").upper()
    origin = _normalize_iata_value(departure_info.get("iata"))
    destination = _normalize_iata_value(arrival_info.get("iata"))
    status_value = _map_aviationstack_status(item.get("flight_status"))

    flight_key = f"aviationstack:{flight_number}"
    external = (
        db.query(ExternalFlightDB)
        .filter(ExternalFlightDB.flight_key == flight_key)
        .first()
    )

    created = False
    if external:
        external.status = status_value.value
        external.airline_code = airline_code
        external.origin = origin
        external.destination = destination
        external.payload = item
    else:
        db.add(
            ExternalFlightDB(
                source="aviationstack",
                flight_key=flight_key,
                flight_number=flight_number,
                airline_code=airline_code,
                status=status_value.value,
                origin=origin,
                destination=destination,
                payload=item,
            )
        )
        created = True

    db.commit()
    return created, "ok"


def import_aviationstack_flights(
    db: Session, limit_override: int | None = None
) -> tuple[int, int, int]:
    api_key = os.getenv("AVIATIONSTACK_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AVIATIONSTACK_KEY is not configured",
        )

    limit = limit_override or int(os.getenv("AVIATIONSTACK_LIMIT", "50"))
    airport = os.getenv("AVIATIONSTACK_AIRPORT")
    params_base = {"access_key": api_key, "limit": limit}
    data = []
    fetched = 0

    if airport:
        airport = airport.upper()
        departures_res = httpx.get(
            "https://api.aviationstack.com/v1/flights",
            params={**params_base, "dep_iata": airport},
            timeout=15.0,
        )
        departures_res.raise_for_status()
        departures_payload = departures_res.json()
        if departures_payload.get("error"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=departures_payload["error"],
            )
        departures_data = departures_payload.get("data", []) or []
        data.extend(departures_data)
        fetched += len(departures_data)

        arrivals_res = httpx.get(
            "https://api.aviationstack.com/v1/flights",
            params={**params_base, "arr_iata": airport},
            timeout=15.0,
        )
        arrivals_res.raise_for_status()
        arrivals_payload = arrivals_res.json()
        if arrivals_payload.get("error"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=arrivals_payload["error"],
            )
        arrivals_data = arrivals_payload.get("data", []) or []
        data.extend(arrivals_data)
        fetched += len(arrivals_data)
    else:
        response = httpx.get(
            "https://api.aviationstack.com/v1/flights",
            params=params_base,
            timeout=15.0,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("error"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=payload["error"],
            )
        data = payload.get("data", []) or []
        fetched = len(data)
    created = 0
    external_upserts = 0

    for item in data:
        stored, status_note = store_aviationstack_item(db, item, airport)
        if status_note == "missing_flight_number":
            continue
        if stored:
            created += 1
        external_upserts += 1

    return created, fetched, external_upserts


def fetch_aviationstack_airport(airport: str, limit: int) -> dict:
    api_key = os.getenv("AVIATIONSTACK_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AVIATIONSTACK_KEY is not configured",
        )

    airport = airport.strip().upper()
    params_base = {"access_key": api_key, "limit": limit}

    departures_res = httpx.get(
        "https://api.aviationstack.com/v1/flights",
        params={**params_base, "dep_iata": airport},
        timeout=15.0,
    )
    departures_res.raise_for_status()
    departures_payload = departures_res.json()
    if departures_payload.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=departures_payload["error"],
        )

    arrivals_res = httpx.get(
        "https://api.aviationstack.com/v1/flights",
        params={**params_base, "arr_iata": airport},
        timeout=15.0,
    )
    arrivals_res.raise_for_status()
    arrivals_payload = arrivals_res.json()
    if arrivals_payload.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=arrivals_payload["error"],
        )

    def map_item(item: dict, direction: str) -> dict:
        flight_info = item.get("flight") or {}
        airline_info = item.get("airline") or {}
        departure_info = item.get("departure") or {}
        arrival_info = item.get("arrival") or {}
        scheduled = (
            departure_info.get("scheduled")
            if direction == "departure"
            else arrival_info.get("scheduled")
        )

        return {
            "flight_number": flight_info.get("iata")
            or flight_info.get("icao")
            or "UNKNOWN",
            "airline": airline_info.get("name")
            or airline_info.get("iata")
            or airline_info.get("icao")
            or "Unknown",
            "status": item.get("flight_status") or "unknown",
            "origin": departure_info.get("iata") or "UNK",
            "destination": arrival_info.get("iata") or "UNK",
            "scheduled": scheduled,
            "terminal": (
                departure_info.get("terminal")
                if direction == "departure"
                else arrival_info.get("terminal")
            ),
            "gate": (
                departure_info.get("gate")
                if direction == "departure"
                else arrival_info.get("gate")
            ),
        }

    departures = [
        map_item(item, "departure")
        for item in (departures_payload.get("data") or [])
    ]
    arrivals = [
        map_item(item, "arrival") for item in (arrivals_payload.get("data") or [])
    ]

    return {"airport": airport, "departures": departures, "arrivals": arrivals}

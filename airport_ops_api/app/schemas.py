from pydantic import BaseModel


class AviationstackManualCreate(BaseModel):
    payload: dict


class AviationstackFlight(BaseModel):
    flight_number: str
    airline: str
    status: str
    origin: str
    destination: str
    scheduled: str | None = None
    terminal: str | None = None
    gate: str | None = None


class AviationstackAirportResponse(BaseModel):
    airport: str
    departures: list[AviationstackFlight]
    arrivals: list[AviationstackFlight]


class AviationstackImportResult(BaseModel):
    imported: int
    fetched: int
    external_upserts: int


class AviationstackManualResult(BaseModel):
    stored: bool

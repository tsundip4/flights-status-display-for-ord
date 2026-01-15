from app.db import SessionLocal
from app.models import ExternalFlightDB


def test_manual_aviationstack_store(client):
    payload = {
        "payload": {
            "flight_status": "scheduled",
            "flight": {"iata": "AA101"},
            "airline": {"iata": "AA", "name": "American Airlines"},
            "departure": {"iata": "ORD", "scheduled": "2026-01-15T10:00:00+00:00"},
            "arrival": {"iata": "LAX", "scheduled": "2026-01-15T12:30:00+00:00"},
        }
    }
    response = client.post("/flights/aviationstack/manual?airport=ORD", json=payload)
    assert response.status_code == 200
    assert "stored" in response.json()

    db = SessionLocal()
    try:
        stored = (
            db.query(ExternalFlightDB)
            .filter(ExternalFlightDB.flight_key == "aviationstack:AA101")
            .first()
        )
        assert stored is not None
        assert stored.origin == "ORD"
        assert stored.destination == "LAX"
        assert stored.airline_code == "AA"
    finally:
        db.close()

# Airport Ops API

FastAPI backend + React dashboard for Aviationstack-powered flight data (Chicago ORD live board).

## Requirements
- Python 3.11+
- Docker (optional)

## Quick start (local)

```bash
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd airport_ops_api
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Aviationstack setup

Set `AVIATIONSTACK_KEY` in `.env`. The API auto-refreshes every
`AVIATIONSTACK_INTERVAL_SECONDS` (default 3600).

Manual import (stores external payloads into SQLite):
```bash
curl -X POST "http://localhost:8000/flights/import-aviationstack?limit=50"
```
Chicago live feed (direct external call):
```bash
curl -X GET "http://localhost:8000/flights/aviationstack/ORD?limit=25"
```

## React polling example (every 60s)

```jsx
import { useEffect, useState } from "react";

export default function DashboardSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      const res = await fetch("http://localhost:8000/dashboard/summary");
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) setSummary(data);
    };

    fetchSummary();
    const timer = setInterval(fetchSummary, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <pre>{JSON.stringify(summary, null, 2)}</pre>
  );
}
```

## Run tests

```bash
cd airport_ops_api
pytest
```

## Docker

```bash
cp .env.example .env
docker compose up --build
```

The Docker SQLite file is stored at `./data/airport.db` on your host.

Frontend will be available at http://localhost:5173 (Chicago ORD live board)

## Frontend (React + Vite + D3)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Then open http://localhost:5173

## Curl examples

```bash
curl -X GET http://localhost:8000/health

curl -X GET "http://localhost:8000/flights/aviationstack/ORD?limit=25"

curl -X POST "http://localhost:8000/flights/import-aviationstack?limit=10"

curl -X POST "http://localhost:8000/flights/aviationstack/manual?airport=ORD" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"flight_status":"scheduled","flight":{"iata":"AA101"},"airline":{"name":"American Airlines","iata":"AA"},"departure":{"iata":"ORD","scheduled":"2026-01-15T10:00:00+00:00","terminal":"3","gate":"K5"},"arrival":{"iata":"LAX","scheduled":"2026-01-15T12:30:00+00:00","terminal":"4","gate":"12"}}}'
```

## Data storage

External Aviationstack payloads are stored in SQLite table `external_flights`:
`./data/airport.db`

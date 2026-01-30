from contextlib import asynccontextmanager, suppress
import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .db import Base, SessionLocal, engine  # noqa: E402
from .routers import flights, ai  # noqa: E402
from .services import flights_service  # noqa: E402


async def _aviationstack_poll() -> None:
    interval = int(os.getenv("AVIATIONSTACK_INTERVAL_SECONDS", "600"))
    while True:
        db = SessionLocal()
        try:
            flights_service.import_aviationstack_flights(db)
        except Exception:
            pass
        finally:
            db.close()
        await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    task = None
    if os.getenv("AVIATIONSTACK_KEY"):
        task = asyncio.create_task(_aviationstack_poll())
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task


app = FastAPI(title="Airport Ops API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def db_session_middleware(request, call_next):
    request.state.db = SessionLocal()
    try:
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(flights.router)
app.include_router(ai.router)

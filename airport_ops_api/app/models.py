from datetime import datetime

from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class ExternalFlightDB(Base):
    __tablename__ = "external_flights"

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(50), index=True)
    flight_key: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    flight_number: Mapped[str] = mapped_column(String(12), index=True)
    airline_code: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(32))
    origin: Mapped[str] = mapped_column(String(3))
    destination: Mapped[str] = mapped_column(String(3))
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

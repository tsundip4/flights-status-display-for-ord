import os
import json
import logging
from typing import TYPE_CHECKING
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..services import flights_service

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    airport: str = Field(default="ORD", min_length=3, max_length=4)

class ChatResponse(BaseModel):
    answer: str

def _get_gemini_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured",
        )
    return api_key

def _get_gemini_client(api_key: str) -> "genai.Client":
    from google import genai

    return genai.Client(api_key=api_key)

if TYPE_CHECKING:
    from google import genai

@router.post("/ask", response_model=ChatResponse)
async def ask_ai(payload: ChatRequest, db: Session = Depends(get_db)) -> dict:
    flight_data = flights_service.fetch_aviationstack_airport_from_db(
        db, payload.airport, 200
    )
    context = {
        "airport": flight_data.get("airport", payload.airport),
        "departures": flight_data.get("departures", []),
        "arrivals": flight_data.get("arrivals", []),
    }

    api_key = _get_gemini_api_key()
    # Use a stable, widely available model by default.
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    instructions = (
        "You are an airport ops assistant for Chicago O'Hare (ORD). "
        "Use the provided flight data when it helps. "
        "If the question is general about ORD (terminals, airlines, transport, services, layout, etc.), "
        "answer from general knowledge and clearly note it may not be real-time."
    )

    user_prompt = (
        f"{instructions}\n\n"
        "Flight data (JSON):\n"
        f"{json.dumps(context, ensure_ascii=False)}\n\n"
        f"Question: {payload.question}"
    )

    client = _get_gemini_client(api_key)
    try:
        response = client.models.generate_content(model=model, contents=user_prompt)
    except Exception as exc:
        logger.exception("Gemini request failed")
        msg = str(exc)
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            raise HTTPException(
                status_code=429,
                detail="Gemini quota/rate limit exceeded. Try again shortly or upgrade billing.",
            )
        if "404" in msg or "NOT_FOUND" in msg:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Gemini model not found or unsupported. "
                    "Check GEMINI_MODEL or use gemini-2.0-flash."
                ),
            )
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}")

    answer = (getattr(response, "text", None) or "").strip()
    if not answer:
        logger.error("Gemini returned empty response: %r", response)
        raise HTTPException(status_code=502, detail="Gemini request failed: empty response")

    return {"answer": answer}

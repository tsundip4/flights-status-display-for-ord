from enum import Enum


class FlightType(str, Enum):
    ARRIVAL = "ARRIVAL"
    DEPARTURE = "DEPARTURE"


class FlightStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    BOARDING = "BOARDING"
    DELAYED = "DELAYED"
    DEPARTED = "DEPARTED"
    ARRIVED = "ARRIVED"
    CANCELLED = "CANCELLED"

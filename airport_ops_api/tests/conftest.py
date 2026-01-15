import importlib
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture()
def client():
    db_path = ROOT / "test_airport.db"
    if db_path.exists():
        db_path.unlink()

    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    import app.db as db_module
    import app.models as models_module
    import app.main as main_module

    importlib.reload(db_module)
    importlib.reload(models_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    with client:
        yield client

    if db_path.exists():
        db_path.unlink()

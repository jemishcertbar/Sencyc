import os
from pathlib import Path
from typing import Any

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from psycopg.rows import dict_row

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

app = FastAPI(title="Sencyc Data API", version="1.0.0")
def get_connection() -> psycopg.Connection[Any]:
    keys = ("POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB")
    missing = [key for key in keys if not os.getenv(key)]
    if missing:
        raise RuntimeError(f"Missing database settings: {', '.join(missing)}")
    return psycopg.connect(
        host=os.environ["POSTGRES_HOST"],
        port=int(os.environ["POSTGRES_PORT"]),
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"],
        connect_timeout=5,
        options="-c default_transaction_read_only=on",
        row_factory=dict_row,
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database connection failed") from exc


@app.get("/api/search")
def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=50, ge=1, le=500),
) -> list[dict[str, Any]]:
    query = """
        SELECT id, ip::text AS ip, port, protocol, state, scanned_at
        FROM scan_results
        WHERE ip::text ILIKE %s OR port::text ILIKE %s
        ORDER BY scanned_at DESC, id DESC
        LIMIT %s
    """
    pattern = f"%{q.strip()}%"
    try:
        with get_connection() as connection:
            return connection.execute(query, (pattern, pattern, limit)).fetchall()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not read search data from PostgreSQL") from exc


# Serve the static frontend from the same FastAPI origin as the data API.
app.mount("/", StaticFiles(directory=ROOT_DIR / "frontend", html=True), name="frontend")

import ipaddress
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


@app.get("/api/summary")
def summary() -> dict[str, Any]:
    query = """
        SELECT COUNT(DISTINCT ip)::int AS hosts,
               COUNT(DISTINCT (ip, port))::int AS open_services,
               COUNT(DISTINCT port)::int AS ports_observed,
               COALESCE(ARRAY_AGG(DISTINCT port ORDER BY port), ARRAY[]::int[]) AS port_list,
               COUNT(*)::int AS observations,
               COUNT(*) FILTER (WHERE scanned_at >= CURRENT_DATE)::int AS observations_today,
               MAX(scanned_at) AS latest_scanned_at
        FROM scan_results
    """
    try:
        with get_connection() as connection:
            return connection.execute(query).fetchone()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not load dashboard data from PostgreSQL") from exc


@app.get("/api/assets")
def assets(limit: int = Query(default=100, ge=1, le=500)) -> list[dict[str, Any]]:
    query = """
        SELECT host(ip) AS ip,
               ARRAY_AGG(DISTINCT port ORDER BY port) AS ports,
               COUNT(*)::int AS observations,
               MAX(scanned_at) AS latest_scanned_at
        FROM scan_results
        GROUP BY ip
        ORDER BY latest_scanned_at DESC
        LIMIT %s
    """
    try:
        with get_connection() as connection:
            return connection.execute(query, (limit,)).fetchall()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not load hosts from PostgreSQL") from exc


@app.get("/api/search")
def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    query = """
<<<<<<< HEAD
        WITH matched_hosts AS (
            SELECT DISTINCT ip FROM scan_results WHERE host(ip) ILIKE %s
            UNION
            SELECT DISTINCT ip FROM scan_results WHERE port::text ILIKE %s
        )
        SELECT host(history.ip) AS ip,
               ARRAY_AGG(DISTINCT history.port ORDER BY history.port) AS ports,
               COUNT(*)::int AS observations
        FROM scan_results AS history
        INNER JOIN matched_hosts USING (ip)
        GROUP BY history.ip
        ORDER BY MAX(history.scanned_at) DESC
        LIMIT %s
=======
        SELECT id, host(ip) AS ip, port, protocol, state, scanned_at
        FROM scan_results
        WHERE ip::text ILIKE %s OR port::text ILIKE %s
        ORDER BY scanned_at DESC, id DESC
        LIMIT %s OFFSET %s
>>>>>>> 6bd5aba9dbee5095aec96f4f53af72072d14077b
    """
    pattern = f"%{q.strip()}%"
    count_query = """
        SELECT COUNT(*) AS total
        FROM scan_results
        WHERE ip::text ILIKE %s OR port::text ILIKE %s
    """
    try:
        with get_connection() as connection:
            total = connection.execute(count_query, (pattern, pattern)).fetchone()["total"]
            results = connection.execute(query, (pattern, pattern, limit, offset)).fetchall()
            return {"results": results, "total": total}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not read search data from PostgreSQL") from exc


<<<<<<< HEAD
@app.get("/api/hosts/{ip}")
def host_details(ip: str) -> dict[str, Any]:
    try:
        address = str(ipaddress.ip_interface(ip).ip if "/" in ip else ipaddress.ip_address(ip))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid IP address") from exc
=======
@app.get("/api/monitor")
def monitor(
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    query = """
        SELECT host(ip) AS ip, COUNT(DISTINCT port) AS open_ports, MAX(scanned_at) AS last_seen
        FROM scan_results
        GROUP BY ip
        ORDER BY last_seen DESC, ip
        LIMIT %s OFFSET %s
    """
    try:
        with get_connection() as connection:
            total = connection.execute("SELECT COUNT(DISTINCT ip) AS total FROM scan_results").fetchone()["total"]
            results = connection.execute(query, (limit, offset)).fetchall()
            return {"results": results, "total": total}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not read monitored hosts from PostgreSQL") from exc


@app.get("/api/history")
def history(
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    query = """
        SELECT id, host(ip) AS ip, port, protocol, state, scanned_at
        FROM scan_results
        ORDER BY scanned_at DESC, id DESC
        LIMIT %s OFFSET %s
    """
    try:
        with get_connection() as connection:
            total = connection.execute("SELECT COUNT(*) AS total FROM scan_results").fetchone()["total"]
            results = connection.execute(query, (limit, offset)).fetchall()
            return {"results": results, "total": total}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not read scan history from PostgreSQL") from exc


@app.get("/api/asset-details")
def asset_details(ip: str = Query(min_length=1, max_length=45)) -> list[dict[str, Any]]:
>>>>>>> 6bd5aba9dbee5095aec96f4f53af72072d14077b
    query = """
        SELECT id, host(ip) AS ip, port, protocol, state, scanned_at
        FROM scan_results
        WHERE host(ip) = %s
        ORDER BY scanned_at DESC, id DESC
    """
    try:
        with get_connection() as connection:
<<<<<<< HEAD
            history = connection.execute(query, (address,)).fetchall()
        if not history:
            raise HTTPException(status_code=404, detail="Host not found")
        return {
            "ip": address,
            "ports": sorted({row["port"] for row in history}),
            "observations": len(history),
            "history": history,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not load host history from PostgreSQL") from exc
=======
            return connection.execute(query, (ip.strip(),)).fetchall()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Could not read asset details from PostgreSQL") from exc
>>>>>>> 6bd5aba9dbee5095aec96f4f53af72072d14077b


# Serve the static frontend from the same FastAPI origin as the data API.
app.mount("/", StaticFiles(directory=ROOT_DIR / "frontend", html=True), name="frontend")

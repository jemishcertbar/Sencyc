# Sencyc
Search Engine for Attack Surface Management

## Scanner

The scanner runs locally as a command line tool. It reads authorized targets from an allowlist, scans TCP ports 80, 22, and 443, and prints open ports to the terminal. Open ports are written directly to PostgreSQL in the `scan_results` table. ZMap JSON output is parsed in memory; no CSV file is created. The installed ZMap build must include JSON output support.

From the `scanner` directory, provide `lab-allowlist.txt` and run:

```bash
go run .
```

Use `-allowlist /path/to/allowlist.txt` to select another allowlist. By default, ZMap runs through `sudo -n`; use `ZMAP_USE_SUDO=false` when elevated privileges are not needed. PostgreSQL settings are loaded from the repository root `.env` file. Update `POSTGRES_PASSWORD` there with your password. The scanner accepts `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`; environment variables already set in the shell take precedence. `.env` is ignored by Git to keep connection details out of source control. The scanner runs continuously, starts a scan immediately, then waits for `SCAN_INTERVAL` (default `1m`) after each scan completes. Set that value in `.env` to another Go duration such as `30s` or `5m`. Each scan appends a new row to `scan_results` with its observation timestamp; existing history is retained. The scanner removes the old IP/port uniqueness constraint so previous deployments can also store repeated observations.

The frontend is a static interface. It is not served by the Go scanner. No hosting or deployment configuration is included.

## Web app and search API

FastAPI serves both the static frontend and the read-only PostgreSQL search API, so the web app needs only one server. The FastAPI process connects directly to PostgreSQL; it does not start or call the Go scanner.

From the repository root, install dependencies and start the app:

```bash
cd api_service
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Open `http://127.0.0.1:8000`. Click Search (or press Enter) to call `GET /api/search`; results contain one row per unique IP, with its observed ports and history count. Click an IP to view each port observation and its timestamp. The dashboard loads unique hosts, unique open services, distinct ports observed, history counts, and most recent update from PostgreSQL and refreshes every 15 seconds. Since the scanner only stores successful open-port responses, these are observed ports rather than all probe attempts. The frontend uses the same-origin `/api` URL by default. Set `window.SENCYC_API_BASE` before `js/app.js` only if the API is hosted elsewhere.

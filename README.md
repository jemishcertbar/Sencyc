# Sencyc
Search Engine for Attack Surface Management

## Scanner

The Go scanner serves the frontend and exposes the in-memory scan results at
`GET /api/results`. It scans only the hosts in the configured allowlist on TCP
ports 80, 22, and 443.

From the `scanner` directory, create or provide `lab-allowlist.txt`, then run:

```bash
go run .
```

Open `http://localhost:8080`. The dashboard's **ZMap port scan** panel starts a
scan and displays the results directly in the page. By default it executes
`sudo -n zmap` so an interactive password prompt cannot block the web server.
Configure passwordless sudo for ZMap, or run with `ZMAP_USE_SUDO=false` when
ZMap does not require elevated privileges. The allowlist path can be changed
with `ZMAP_ALLOWLIST=/path/to/allowlist.txt`.

Go requires all files in a package to be included when running the program, so
use `go run .` (or `go run main.go zmap_scanner.go`) rather than `go run
main.go` alone.

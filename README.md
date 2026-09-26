# Sencyc
Search Engine for Attack Surface Management

## Scanner

The scanner runs locally as a command line tool. It reads authorized targets from an allowlist, scans TCP ports 80, 22, and 443, and prints open ports to the terminal. Scan output is not sent to the frontend or persisted.

From the `scanner` directory, provide `lab-allowlist.txt` and run:

```bash
go run .
```

Use `-allowlist /path/to/allowlist.txt` to select another allowlist. By default, ZMap runs through `sudo -n`; use `ZMAP_USE_SUDO=false` when elevated privileges are not needed.

The frontend is a static interface. It is not served by the Go scanner. No hosting or deployment configuration is included.

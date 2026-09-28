package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

func main() {
	allowlist := flag.String("allowlist", "lab-allowlist.txt", "file containing authorized hosts to scan")
	useSudo := flag.Bool("sudo", true, "run ZMap through sudo")
	flag.Parse()

	if value := os.Getenv("ZMAP_ALLOWLIST"); value != "" && *allowlist == "lab-allowlist.txt" {
		*allowlist = value
	}
	if value := os.Getenv("ZMAP_USE_SUDO"); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err != nil {
			log.Fatalf("invalid ZMAP_USE_SUDO: %v", err)
		}
		*useSudo = parsed
	}

	store, err := NewPostgresStoreFromEnv()
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()
	if err := store.EnsureSchema(context.Background()); err != nil {
		log.Fatal(err)
	}
	interval := time.Minute
	if value := os.Getenv("SCAN_INTERVAL"); value != "" {
		interval, err = time.ParseDuration(value)
		if err != nil || interval <= 0 {
			log.Fatalf("invalid SCAN_INTERVAL %q: use a positive Go duration such as 1m or 30s", value)
		}
	}
	scanner := NewZMapScanner(*allowlist, *useSudo, store)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	fmt.Printf("Scanning authorized hosts on TCP ports %s every %s\n", portList(), interval)
	for {
		if err := scanner.Scan(ctx); err != nil {
			if ctx.Err() != nil {
				break
			}
			log.Printf("scan failed: %v", err)
		}
		timer := time.NewTimer(interval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
	}
}

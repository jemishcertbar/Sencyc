package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
)

func main() {
	frontendDir := envOr("FRONTEND_DIR", filepath.Join("..", "frontend"))
	allowlist := envOr("ZMAP_ALLOWLIST", "lab-allowlist.txt")
	useSudo, err := strconv.ParseBool(envOr("ZMAP_USE_SUDO", "true"))
	if err != nil {
		log.Fatalf("invalid ZMAP_USE_SUDO: %v", err)
	}

	scanner := NewZMapScanner(allowlist, useSudo)
	mux := http.NewServeMux()
	mux.HandleFunc("/api/scan", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use POST to start a scan"})
			return
		}
		if err := scanner.Start(context.Background()); err != nil {
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusAccepted, scanner.Snapshot())
	})
	mux.HandleFunc("/api/results", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET to read scan results"})
			return
		}
		writeJSON(w, http.StatusOK, scanner.Snapshot())
	})
	mux.Handle("/", http.FileServer(http.Dir(frontendDir)))

	address := envOr("ADDRESS", ":8080")
	log.Printf("Sencyc is available at http://localhost%s", address)
	log.Printf("scanning ports: 80, 22, 443; allowlist: %s", allowlist)
	log.Fatal(http.ListenAndServe(address, loggingMiddleware(mux)))
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("write JSON response: %v", err)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

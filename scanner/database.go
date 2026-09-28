package main

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type PostgresStore struct{ db *sql.DB }

func NewPostgresStoreFromEnv() (*PostgresStore, error) {
	if err := loadDotEnv(); err != nil {
		return nil, err
	}
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	database := os.Getenv("POSTGRES_DB")
	if host == "" || user == "" || password == "" || database == "" {
		return nil, fmt.Errorf("POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB must be set in .env")
	}
	if port == "" {
		return nil, fmt.Errorf("POSTGRES_PORT must be set in .env")
	}
	if _, err := strconv.Atoi(port); err != nil {
		return nil, fmt.Errorf("invalid POSTGRES_PORT: %w", err)
	}
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, database)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open PostgreSQL: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("connect to PostgreSQL: %w", err)
	}
	return &PostgresStore{db: db}, nil
}

func (s *PostgresStore) EnsureSchema(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS scan_results (
        id BIGSERIAL PRIMARY KEY,
        ip INET NOT NULL,
        port INTEGER NOT NULL,
        protocol TEXT NOT NULL,
        state TEXT NOT NULL,
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
	if err != nil {
		return fmt.Errorf("create scan_results table: %w", err)
	}
	// Older scanner versions added this uniqueness constraint. Drop it so each
	// scan can append a new historical observation for the same IP and port.
	if _, err := s.db.ExecContext(ctx, `ALTER TABLE scan_results DROP CONSTRAINT IF EXISTS scan_results_ip_port_key`); err != nil {
		return fmt.Errorf("remove scan_results uniqueness constraint: %w", err)
	}
	return nil
}

func (s *PostgresStore) SaveResults(ctx context.Context, results []ScanResult) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	stmt, err := tx.PrepareContext(ctx, `INSERT INTO scan_results (ip, port, protocol, state, scanned_at)
        VALUES ($1, $2, $3, $4, NOW())`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, result := range results {
		if _, err := stmt.ExecContext(ctx, result.IP, result.Port, result.Protocol, result.State); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *PostgresStore) Close() error { return s.db.Close() }
func loadDotEnv() error {
	candidates := []string{".env", "../.env"}
	var file *os.File
	var err error
	for _, candidate := range candidates {
		file, err = os.Open(candidate)
		if err == nil {
			break
		}
		if !os.IsNotExist(err) {
			return fmt.Errorf("open %s: %w", candidate, err)
		}
	}
	if file == nil {
		return fmt.Errorf(".env file not found (looked in current and parent directories)")
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for lineNumber := 1; scanner.Scan(); lineNumber++ {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok || strings.TrimSpace(key) == "" {
			return fmt.Errorf("invalid .env entry on line %d", lineNumber)
		}
		key, value = strings.TrimSpace(key), strings.TrimSpace(value)
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		if _, exists := os.LookupEnv(key); !exists {
			if err := os.Setenv(key, value); err != nil {
				return fmt.Errorf("set %s: %w", key, err)
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("read .env: %w", err)
	}
	return nil
}

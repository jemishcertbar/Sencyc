package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
)

var scanPorts = []int{80, 22, 443}

type ScanResult struct {
	IP           string    `json:"ip"`
	Port         int       `json:"port"`
	Protocol     string    `json:"protocol"`
	State        string    `json:"state"`
	DiscoveredAt time.Time `json:"discoveredAt"`
}

type ScanSnapshot struct {
	Results  []ScanResult `json:"results"`
	Running  bool         `json:"running"`
	LastScan *time.Time   `json:"lastScan,omitempty"`
	Error    string       `json:"error,omitempty"`
}

type ZMapScanner struct {
	allowlist string
	useSudo   bool

	mu       sync.RWMutex
	results  []ScanResult
	running  bool
	lastScan *time.Time
	err      error
}

func NewZMapScanner(allowlist string, useSudo bool) *ZMapScanner {
	return &ZMapScanner{allowlist: allowlist, useSudo: useSudo}
}

func (s *ZMapScanner) Snapshot() ScanSnapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := append([]ScanResult(nil), s.results...)
	if results == nil {
		results = []ScanResult{}
	}
	var scanError string
	if s.err != nil {
		scanError = s.err.Error()
	}
	return ScanSnapshot{Results: results, Running: s.running, LastScan: s.lastScan, Error: scanError}
}

func (s *ZMapScanner) Start(ctx context.Context) error {
	if err := validateAllowlist(s.allowlist); err != nil {
		return err
	}

	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return errors.New("a scan is already running")
	}
	s.running = true
	s.err = nil
	s.results = nil
	s.mu.Unlock()

	go s.run(ctx)
	return nil
}

func (s *ZMapScanner) run(ctx context.Context) {
	results, err := s.scan(ctx)
	now := time.Now().UTC()

	s.mu.Lock()
	s.results = results
	s.running = false
	s.lastScan = &now
	s.err = err
	s.mu.Unlock()
}

func (s *ZMapScanner) scan(ctx context.Context) ([]ScanResult, error) {
	if _, err := os.Stat(s.allowlist); err != nil {
		return nil, fmt.Errorf("allowlist: %w", err)
	}

	seen := make(map[string]bool)
	results := make([]ScanResult, 0)
	for _, port := range scanPorts {
		lines, err := s.runPort(ctx, port)
		if err != nil {
			return results, fmt.Errorf("zmap port %d: %w", port, err)
		}
		for _, line := range lines {
			fields := strings.Fields(strings.TrimSpace(line))
			if len(fields) == 0 {
				continue
			}
			ip := strings.Trim(fields[0], ",")
			if net.ParseIP(ip) == nil {
				continue
			}
			key := ip + ":" + strconv.Itoa(port)
			if seen[key] {
				continue
			}
			seen[key] = true
			results = append(results, ScanResult{IP: ip, Port: port, Protocol: "TCP", State: "open", DiscoveredAt: time.Now().UTC()})
		}
	}
	return results, nil
}

func (s *ZMapScanner) runPort(ctx context.Context, port int) ([]string, error) {
	args := []string{"-p", strconv.Itoa(port), "-w", s.allowlist, "-b", "/dev/null", "-f", "saddr"}
	command := "zmap"
	var stdinReader *strings.Reader

	if s.useSudo {
		command = "sudo"
		sudoPass := os.Getenv("SUDO_PASSWORD")

		if sudoPass != "" {
			// -S tells sudo to read the password from standard input
			args = append([]string{"-S", "zmap"}, args...)
			stdinReader = strings.NewReader(sudoPass + "\n")
		} else {
			// default non-interactive sudo
			args = append([]string{"-n", "zmap"}, args...)
		}
	}

	cmd := exec.CommandContext(ctx, command, args...)
	if stdinReader != nil {
		cmd.Stdin = stdinReader
	}

	output, err := cmd.Output()
	if err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return nil, fmt.Errorf("%w; verify ZMap is installed and passwordless sudo is configured", err)
	}
	return strings.Split(string(output), "\n"), nil
}

func validateAllowlist(path string) error {
	if strings.TrimSpace(path) == "" {
		return errors.New("allowlist path is required")
	}
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return errors.New("allowlist must be a regular file")
	}
	return nil
}

func loadAllowlist(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var entries []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" && !strings.HasPrefix(line, "#") {
			entries = append(entries, line)
		}
	}
	return entries, scanner.Err()
}

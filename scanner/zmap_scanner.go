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

// NewZMapScanner creates a scanner with the allowlist and sudo settings.
func NewZMapScanner(allowlist string, useSudo bool) *ZMapScanner {
	return &ZMapScanner{allowlist: allowlist, useSudo: useSudo}
}

// Snapshot returns a safe copy of the latest scan status and results.
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

// Start checks the allowlist and begins a scan in the background.
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

// run scans the allowlist and saves the final status and results.
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

// scan runs ZMap and keeps only valid results for the selected ports.
func (s *ZMapScanner) scan(ctx context.Context) ([]ScanResult, error) {
	if _, err := os.Stat(s.allowlist); err != nil {
		return nil, fmt.Errorf("allowlist: %w", err)
	}

	args := []string{"-p", portList(), "-w", s.allowlist, "-b", "/dev/null", "-O", "csv", "-f", "saddr,sport,classification,success,repeat", "--output-filter=success=1 && repeat=0", "--no-header-row"}
	lines, err := s.runZMap(ctx, args)
	if err != nil {
		return nil, fmt.Errorf("zmap ports %s: %w", portList(), err)
	}

	// Keep each open IP and port only once, even if ZMap reports it again.
	seen := make(map[string]bool)
	results := make([]ScanResult, 0)
	for _, line := range lines {
		fields := strings.Split(strings.TrimSpace(line), ",")
		if len(fields) != 5 {
			continue
		}
		ip := strings.Trim(fields[0], "\" ")
		port, parseErr := strconv.Atoi(strings.Trim(fields[1], "\" "))
		classification := strings.Trim(fields[2], "\" ")
		success := strings.Trim(fields[3], "\" ")
		repeat := strings.Trim(fields[4], "\" ")
		if parseErr != nil || net.ParseIP(ip) == nil || !containsPort(port) || classification != "synack" || success != "1" || repeat != "0" {
			continue
		}
		key := ip + ":" + strconv.Itoa(port)
		if seen[key] {
			continue
		}
		seen[key] = true
		results = append(results, ScanResult{IP: ip, Port: port, Protocol: "TCP", State: "open", DiscoveredAt: time.Now().UTC()})
	}
	return results, nil
}

// runZMap starts ZMap, optionally through sudo, and returns its output lines.
func (s *ZMapScanner) runZMap(ctx context.Context, args []string) ([]string, error) {
	command := "zmap"
	var stdinReader *strings.Reader
	if s.useSudo {
		command = "sudo"
		sudoPass := os.Getenv("SUDO_PASSWORD")
		if sudoPass != "" {
			args = append([]string{"-S", "zmap"}, args...)
			stdinReader = strings.NewReader(sudoPass + "\n")
		} else {
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

// portList formats the configured ports for the ZMap command.
func portList() string {
	ports := make([]string, len(scanPorts))
	for i, port := range scanPorts {
		ports[i] = strconv.Itoa(port)
	}
	return strings.Join(ports, ",")
}

// containsPort reports whether a port is included in this scan.
func containsPort(port int) bool {
	for _, allowed := range scanPorts {
		if port == allowed {
			return true
		}
	}
	return false
}

// validateAllowlist checks that the allowlist path points to a regular file.
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

// loadAllowlist reads non-empty, non-comment lines from a file.
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

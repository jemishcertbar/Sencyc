package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

var scanPorts = []int{80, 22, 443}

type ZMapScanner struct {
	allowlist string
	useSudo   bool
}

func NewZMapScanner(allowlist string, useSudo bool) *ZMapScanner {
	return &ZMapScanner{allowlist: allowlist, useSudo: useSudo}
}

func (s *ZMapScanner) Scan(ctx context.Context) error {
	if err := validateAllowlist(s.allowlist); err != nil {
		return err
	}
	results, err := s.scan(ctx)
	if err != nil {
		return err
	}
	if len(results) == 0 {
		fmt.Println("No open ports found.")
		return nil
	}
	for _, result := range results {
		fmt.Printf("%s:%d/%s %s\n", result.IP, result.Port, result.Protocol, result.State)
	}
	return nil
}

type ScanResult struct {
	IP       string
	Port     int
	Protocol string
	State    string
}

func (s *ZMapScanner) scan(ctx context.Context) ([]ScanResult, error) {
	if _, err := os.Stat(s.allowlist); err != nil {
		return nil, fmt.Errorf("allowlist: %w", err)
	}

	args := []string{"-p", portList(), "-w", s.allowlist, "-b", "/dev/null", "-O", "csv", "-f", "saddr,sport,classification,success,repeat", "--output-filter=success=1 && repeat=0", "--no-header-row"}
	lines, err := s.runZMap(ctx, args)
	if err != nil {
		return nil, fmt.Errorf("zmap ports %s: %w", portList(), err)
	}

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
		results = append(results, ScanResult{IP: ip, Port: port, Protocol: "TCP", State: "open"})
	}
	return results, nil
}

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

func portList() string {
	ports := make([]string, len(scanPorts))
	for i, port := range scanPorts {
		ports[i] = strconv.Itoa(port)
	}
	return strings.Join(ports, ",")
}

func containsPort(port int) bool {
	for _, allowed := range scanPorts {
		if port == allowed {
			return true
		}
	}
	return false
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

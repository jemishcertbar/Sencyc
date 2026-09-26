package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
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

	scanner := NewZMapScanner(*allowlist, *useSudo)
	fmt.Printf("Scanning authorized hosts on TCP ports %s\n", portList())
	if err := scanner.Scan(context.Background()); err != nil {
		log.Fatal(err)
	}
}

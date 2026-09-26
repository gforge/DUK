#!/bin/bash
# Shared helpers for the duk-* commands. Source, don't execute.

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

print_banner() {
  local title="$1"
  echo -e "\n${BOLD}${CYAN}============================================================${NC}"
  echo -e "${BOLD}${CYAN}  $title${NC}"
  echo -e "${BOLD}${CYAN}============================================================${NC}\n"
}

require_npm() {
  if ! command -v npm &>/dev/null; then
    echo -e "${BOLD}${RED}Error: npm is not installed - see README for instructions${NC}" >&2
    exit 1
  fi
}

# Install dependencies when node_modules is missing or older than package-lock.json
ensure_dependencies() {
  if [ ! -d "$PROJECT_ROOT/node_modules" ] \
    || [ "$PROJECT_ROOT/package-lock.json" -nt "$PROJECT_ROOT/node_modules/.package-lock.json" ]; then
    echo -e "${YELLOW}Dependencies missing or out of date — running duk-install...${NC}"
    "$PROJECT_ROOT/scripts/bin/duk-install"
  fi
}

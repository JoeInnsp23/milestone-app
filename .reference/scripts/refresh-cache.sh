#!/bin/bash

# Manual cache refresh script for Milestone P&L Dashboard
# This script allows manual refresh of the cached dashboard data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}    Milestone P&L Dashboard Manual Cache Refresh  ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo

# Check if force flag is provided
FORCE=false
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    FORCE=true
    echo -e "${YELLOW}Force refresh mode enabled${NC}"
fi

# Check current cache status
CACHE_FILE="/root/projects/milestone-dashboard/public/dashboard-data.json"

if [ -f "$CACHE_FILE" ]; then
    # Get cache age
    if command -v jq >/dev/null 2>&1 && jq -e '._cache.timestamp_ms' "$CACHE_FILE" >/dev/null 2>&1; then
        cache_ms=$(jq -r '._cache.timestamp_ms' "$CACHE_FILE")
        current_ms=$(date +%s)000
        age_ms=$((current_ms - cache_ms))
        age_hours=$((age_ms / 3600000))
        age_mins=$(((age_ms % 3600000) / 60000))

        echo -e "${BLUE}Current cache status:${NC}"
        echo -e "  Last updated: $(jq -r '._cache.timestamp' "$CACHE_FILE")"
        echo -e "  Age: ${age_hours} hours, ${age_mins} minutes"
        echo -e "  Next scheduled update: $(jq -r '._cache.next_update' "$CACHE_FILE")"
        echo

        if [ "$FORCE" = false ] && [ $age_hours -lt 1 ]; then
            echo -e "${YELLOW}Cache is less than 1 hour old.${NC}"
            read -p "Do you want to refresh anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${BLUE}Cache refresh cancelled.${NC}"
                exit 0
            fi
        fi
    else
        echo -e "${YELLOW}Cache file exists but metadata is missing${NC}"
    fi
else
    echo -e "${YELLOW}No cache file found. Creating new cache...${NC}"
fi

echo

# Run the cache update script
echo -e "${BLUE}Starting cache refresh...${NC}"
echo -e "${BLUE}This may take 30-60 seconds...${NC}"
echo

if /root/projects/milestone-dashboard/scripts/cache-dashboard-simple.sh; then
    echo
    echo -e "${GREEN}✓ Cache refreshed successfully!${NC}"

    # Show new cache info
    if [ -f "$CACHE_FILE" ] && command -v jq >/dev/null 2>&1; then
        echo
        echo -e "${BLUE}New cache information:${NC}"
        echo -e "  Updated at: $(jq -r '._cache.timestamp' "$CACHE_FILE")"
        echo -e "  File size: $(stat -c%s "$CACHE_FILE" | numfmt --to=iec-i --suffix=B)"
        echo -e "  Next auto-update: $(jq -r '._cache.next_update' "$CACHE_FILE")"
    fi
else
    echo
    echo -e "${RED}✗ Cache refresh failed!${NC}"
    echo -e "${YELLOW}Check /root/projects/milestone-dashboard/logs/cache-dashboard.log for details${NC}"
    exit 1
fi

echo
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Dashboard will now load instantly for all users!${NC}"
echo -e "${BLUE}==================================================${NC}"
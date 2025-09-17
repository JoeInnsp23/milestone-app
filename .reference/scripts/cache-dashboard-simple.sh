#!/bin/bash

# Simple cache script - just saves the raw JSON with metadata added

set -e

# Configuration
WEBHOOK_URL="https://n8n.innspiredaccountancy.com/webhook/milestone-dashboard"
CACHE_FILE="/root/projects/milestone-dashboard/public/dashboard-data.json"
PROD_CACHE_FILE="/var/www/milestone-dashboard/public/dashboard-data.json"
LOG_FILE="/root/projects/milestone-dashboard/logs/cache-dashboard.log"

# Ensure log directory exists
mkdir -p /root/projects/milestone-dashboard/logs

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting dashboard cache update (simple version)"

# Fetch the dashboard JSON
log "Fetching dashboard from webhook..."
if curl -s --max-time 120 \
    -H "Accept: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Cache-Control: no-cache" \
    "$WEBHOOK_URL" > /tmp/dashboard-raw.json 2>&1; then

    log "Dashboard fetched successfully"

    # Add cache metadata
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    timestamp_ms=$(date +%s)000

    # Add metadata and save
    if jq --arg ts "$timestamp" \
          --arg tsms "$timestamp_ms" \
          --arg next "$(date -u -d '+1 day' +"%Y-%m-%dT01:00:00Z")" \
          '. + {
              "_cache": {
                  "timestamp": $ts,
                  "timestamp_ms": ($tsms | tonumber),
                  "source": "cron_cache",
                  "ttl_hours": 24,
                  "next_update": $next
              }
          }' /tmp/dashboard-raw.json > "$CACHE_FILE" 2>&1; then

        chmod 644 "$CACHE_FILE"
        size=$(stat -c%s "$CACHE_FILE")
        log "Cache updated successfully - Size: $size bytes"

        # Copy to production location
        if [ -d "/var/www/milestone-dashboard/public" ]; then
            sudo cp "$CACHE_FILE" "$PROD_CACHE_FILE"
            sudo chown www-data:www-data "$PROD_CACHE_FILE"
            log "Cache copied to production location"
        fi

        # Clean up
        rm -f /tmp/dashboard-raw.json
        exit 0
    else
        log "ERROR: Failed to add metadata"
        rm -f /tmp/dashboard-raw.json
        exit 1
    fi
else
    log "ERROR: Failed to fetch dashboard"
    exit 1
fi
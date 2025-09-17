#!/bin/bash

# Milestone P&L Dashboard Deployment Script
# Syncs all files from dev to production and handles housekeeping

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DEV_DIR="/root/projects/milestone-dashboard"
PROD_DIR="/var/www/milestone-dashboard"
NGINX_CONFIG="$DEV_DIR/config/nginx-dashboard.conf"
NGINX_SITE="/etc/nginx/sites-available/dashboard"
NGINX_ENABLED="/etc/nginx/sites-enabled/dashboard"
LOG_DIR="/var/log/nginx"
CACHE_SCRIPT="$DEV_DIR/scripts/cache-dashboard-simple.sh"
REFRESH_SCRIPT="$DEV_DIR/scripts/refresh-cache.sh"

# Dashboard URL
DASHBOARD_URL="https://dashboard.innspiredaccountancy.com/milestone"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Check if running with sudo privileges
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script requires sudo privileges"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Backup production files
backup_production() {
    log "Creating backup of production files..."

    local backup_dir="$DEV_DIR/backups/deploy-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    if [ -d "$PROD_DIR/public" ]; then
        cp -r "$PROD_DIR/public" "$backup_dir/"
        log_success "Backed up to $backup_dir"
    else
        log_info "No existing production files to backup"
    fi
}

# Sync files to production
sync_files() {
    log "Syncing files to production..."

    # Create production directory if it doesn't exist
    mkdir -p "$PROD_DIR/public"

    # Sync only necessary files (exclude development files)
    rsync -av --delete \
        --exclude='.git' \
        --exclude='.claude' \
        --exclude='*.backup*' \
        --exclude='test.html' \
        --exclude='dashboard-old.js' \
        --exclude='*.log' \
        "$DEV_DIR/public/" "$PROD_DIR/public/"

    # Set proper ownership
    chown -R www-data:www-data "$PROD_DIR"

    log_success "Files synced to $PROD_DIR"
}

# Deploy nginx configuration
deploy_nginx_config() {
    log "Deploying nginx configuration..."

    if [ -f "$NGINX_CONFIG" ]; then
        cp "$NGINX_CONFIG" "$NGINX_SITE"
        log_success "Nginx config deployed to $NGINX_SITE"
    else
        log_warning "Nginx config not found at $NGINX_CONFIG"
    fi
}

# Update asset paths if needed
update_asset_paths() {
    log "Checking asset paths..."

    # Check if paths are already updated
    if grep -q '/milestone/css/dashboard.css' "$PROD_DIR/public/index.html" 2>/dev/null; then
        log_info "Asset paths already configured for /milestone"
    else
        log_warning "Asset paths need updating - please check index.html"
    fi
}

# Test nginx configuration
test_nginx() {
    log "Testing nginx configuration..."

    if nginx -t &> /dev/null; then
        log_success "Nginx configuration is valid"
        return 0
    else
        log_error "Nginx configuration test failed:"
        nginx -t
        return 1
    fi
}

# Reload nginx
reload_nginx() {
    log "Reloading nginx..."

    if systemctl reload nginx; then
        log_success "Nginx reloaded successfully"
    else
        log_error "Failed to reload nginx"
        exit 1
    fi
}

# Clear old logs
cleanup_logs() {
    if [[ "$1" == "--clean-logs" ]]; then
        log "Cleaning old logs..."

        # Keep only last 7 days of logs
        find "$DEV_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find "$LOG_DIR" -name "milestone-dashboard-*.log" -mtime +7 -delete 2>/dev/null || true

        log_success "Old logs cleaned"
    fi
}

# Refresh cache
refresh_cache() {
    if [[ "$1" == "--refresh-cache" ]]; then
        log "Refreshing dashboard cache..."

        if [ -x "$CACHE_SCRIPT" ]; then
            if $CACHE_SCRIPT; then
                log_success "Cache refreshed successfully"
            else
                log_warning "Cache refresh failed - check logs"
            fi
        else
            log_warning "Cache script not found or not executable"
        fi
    fi
}

# Test deployment
test_deployment() {
    log "Testing deployment..."

    # Test main page
    if curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL" | grep -q "200"; then
        log_success "Dashboard is accessible"
    else
        log_error "Dashboard is not accessible"
        return 1
    fi

    # Test assets
    local assets=(
        "/milestone/css/dashboard.css"
        "/milestone/js/dashboard.js"
        "/milestone/dashboard-data.json"
    )

    for asset in "${assets[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "https://dashboard.innspiredaccountancy.com$asset" | grep -q "200"; then
            log_success "Asset accessible: $asset"
        else
            log_error "Asset not accessible: $asset"
        fi
    done
}

# Show status
show_status() {
    echo
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   Milestone Dashboard Deployment Complete!     ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo
    echo -e "🌐 Dashboard URL: ${CYAN}$DASHBOARD_URL${NC}"
    echo -e "📁 Production:    $PROD_DIR"
    echo -e "📝 Logs:          $LOG_DIR/milestone-dashboard-*.log"
    echo

    # Show cache status
    if [ -f "$PROD_DIR/public/dashboard-data.json" ]; then
        local cache_age=$(( ($(date +%s) - $(stat -c %Y "$PROD_DIR/public/dashboard-data.json")) / 60 ))
        echo -e "📊 Cache Status:  Updated ${cache_age} minutes ago"
    fi

    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
}

# Main deployment function
deploy() {
    log "Starting Milestone Dashboard deployment..."
    echo

    check_sudo
    backup_production
    sync_files
    deploy_nginx_config
    update_asset_paths
    test_nginx
    reload_nginx
    cleanup_logs "$1"
    refresh_cache "$2"
    test_deployment
    show_status
}

# Show help
show_help() {
    echo "Milestone P&L Dashboard Deployment Script"
    echo
    echo "Usage: sudo $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --clean-logs      Clean logs older than 7 days"
    echo "  --refresh-cache   Refresh dashboard cache from webhook"
    echo "  --test-only       Test deployment without making changes"
    echo "  --help, -h        Show this help message"
    echo
    echo "Examples:"
    echo "  sudo $0                          # Standard deployment"
    echo "  sudo $0 --clean-logs             # Deploy and clean old logs"
    echo "  sudo $0 --refresh-cache          # Deploy and refresh cache"
    echo "  sudo $0 --clean-logs --refresh-cache  # Full deployment"
}

# Parse command line arguments
TEST_ONLY=false
CLEAN_LOGS=""
REFRESH_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean-logs)
            CLEAN_LOGS="--clean-logs"
            shift
            ;;
        --refresh-cache)
            REFRESH_CACHE="--refresh-cache"
            shift
            ;;
        --test-only)
            TEST_ONLY=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run deployment or test
if [[ "$TEST_ONLY" == true ]]; then
    log "Running deployment test only..."
    check_sudo
    test_nginx
    test_deployment
    show_status
else
    deploy "$CLEAN_LOGS" "$REFRESH_CACHE"
fi
#!/bin/bash

# Milestone P&L Dashboard Webhook Test Script
# This script tests the n8n webhook endpoint for availability and response

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="https://n8n.innspiredaccountancy.com/webhook/milestone-dashboard"
TIMEOUT=120  # 2 minutes timeout
MAX_RETRIES=3

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Test basic connectivity
test_connectivity() {
    log "Testing basic connectivity to webhook..."

    if curl --output /dev/null --silent --head --fail "$WEBHOOK_URL"; then
        log_success "Webhook endpoint is reachable"
        return 0
    else
        log_error "Webhook endpoint is not reachable"
        return 1
    fi
}

# Test HTTP headers
test_headers() {
    log "Testing HTTP headers..."

    headers=$(curl -s -I "$WEBHOOK_URL")

    echo "$headers" | while IFS= read -r line; do
        if [[ $line =~ ^(HTTP|Content-Type|Access-Control-Allow-Origin|X-Content-Type-Options|X-Frame-Options) ]]; then
            log_info "$line"
        fi
    done

    # Check for CORS headers
    if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
        log_success "CORS headers are present"
    else
        log_warning "CORS headers are missing"
    fi

    # Check content type
    if echo "$headers" | grep -q "Content-Type.*text/html"; then
        log_success "Content-Type is correctly set to text/html"
    else
        log_warning "Content-Type may not be set to text/html"
    fi
}

# Test response time
test_response_time() {
    log "Testing response time..."

    # Test with 3 samples
    local total_time=0
    local successful_requests=0

    for i in {1..3}; do
        log_info "Request $i of 3..."

        start_time=$(date +%s%N)

        if response=$(curl -s -w "%{http_code}" --max-time "$TIMEOUT" "$WEBHOOK_URL" 2>/dev/null); then
            end_time=$(date +%s%N)
            elapsed=$((($end_time - $start_time) / 1000000))  # Convert to milliseconds

            if [[ "$response" == "200" ]]; then
                total_time=$(($total_time + $elapsed))
                successful_requests=$(($successful_requests + 1))
                log_info "Request $i: ${elapsed}ms (HTTP 200)"
            else
                log_error "Request $i: HTTP $response"
            fi
        else
            log_error "Request $i: Failed to connect"
        fi
    done

    if [[ $successful_requests -gt 0 ]]; then
        local avg_time=$(($total_time / $successful_requests))
        log_success "Average response time: ${avg_time}ms ($successful_requests/3 successful)"
    else
        log_error "All requests failed"
        return 1
    fi
}

# Test response size
test_response_size() {
    log "Testing response size..."

    # Use curl to get response size
    size=$(curl -s --max-time "$TIMEOUT" -w "%{size_download}" "$WEBHOOK_URL" -o /dev/null 2>/dev/null || echo "0")

    if [[ $size -gt 0 ]]; then
        log_success "Response size: $size bytes"

        # Convert to human readable format
        if [[ $size -gt 1048576 ]]; then
            log_info "($(($size / 1048576)) MB)"
        elif [[ $size -gt 1024 ]]; then
            log_info "($(($size / 1024)) KB)"
        fi
    else
        log_error "Empty response or request failed"
        return 1
    fi
}

# Test with retry logic
test_with_retry() {
    log "Testing webhook with retry logic..."

    local attempt=1
    local success=false

    while [[ $attempt -le $MAX_RETRIES ]]; do
        log_info "Attempt $attempt of $MAX_RETRIES..."

        if response=$(curl -s -w "%{http_code}" --max-time "$TIMEOUT" "$WEBHOOK_URL" 2>/dev/null); then
            if [[ "$response" == "200" ]]; then
                log_success "Webhook responded successfully on attempt $attempt"
                success=true
                break
            else
                log_error "HTTP $response on attempt $attempt"
            fi
        else
            log_error "Connection failed on attempt $attempt"
        fi

        if [[ $attempt -lt $MAX_RETRIES ]]; then
            local wait_time=$((5 * $attempt))  # Exponential backoff
            log_info "Waiting ${wait_time}s before retry..."
            sleep $wait_time
        fi

        attempt=$(($attempt + 1))
    done

    if [[ "$success" == true ]]; then
        return 0
    else
        log_error "All retry attempts failed"
        return 1
    fi
}

# Test SSL certificate
test_ssl() {
    log "Testing SSL certificate..."

    if openssl s_client -connect n8n.innspiredaccountancy.com:443 -servername n8n.innspiredaccountancy.com < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
        expiry_date=$(openssl s_client -connect n8n.innspiredaccountancy.com:443 -servername n8n.innspiredaccountancy.com < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        log_success "SSL certificate is valid until: $expiry_date"
    else
        log_error "SSL certificate test failed"
        return 1
    fi
}

# Generate test report
generate_report() {
    log "Generating test report..."

    report_file="webhook-test-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "Milestone P&L Dashboard Webhook Test Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo
        echo "Webhook URL: $WEBHOOK_URL"
        echo "Timeout: ${TIMEOUT}s"
        echo "Max Retries: $MAX_RETRIES"
        echo
        echo "Test Results:"
        echo "-------------"

        # Run tests and capture results
        if test_connectivity >/dev/null 2>&1; then
            echo "✓ Connectivity Test: PASSED"
        else
            echo "✗ Connectivity Test: FAILED"
        fi

        echo
        echo "HTTP Headers:"
        curl -s -I "$WEBHOOK_URL" 2>/dev/null | grep -E "^(HTTP|Content-Type|Access-Control-Allow-Origin|X-Content-Type-Options|X-Frame-Options)" || echo "  Unable to fetch headers"

        echo
        echo "Response Size:"
        size=$(curl -s --max-time "$TIMEOUT" -w "%{size_download}" "$WEBHOOK_URL" -o /dev/null 2>/dev/null || echo "0")
        echo "  $size bytes"

        echo
        echo "SSL Certificate:"
        if openssl s_client -connect n8n.innspiredaccountancy.com:443 -servername n8n.innspiredaccountancy.com < /dev/null 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1; then
            expiry_date=$(openssl s_client -connect n8n.innspiredaccountancy.com:443 -servername n8n.innspiredaccountancy.com < /dev/null 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
            echo "  Valid until: $expiry_date"
        else
            echo "  Unable to verify SSL certificate"
        fi

    } > "$report_file"

    log_success "Report saved to: $report_file"
}

# Quick test
quick_test() {
    log "Running quick webhook test..."

    if response=$(curl -s -w "%{http_code}" --max-time 30 "$WEBHOOK_URL" 2>/dev/null); then
        if [[ "$response" == "200" ]]; then
            log_success "Quick test: Webhook is responding (HTTP 200)"
            return 0
        else
            log_error "Quick test: HTTP $response"
            return 1
        fi
    else
        log_error "Quick test: Connection failed"
        return 1
    fi
}

# Comprehensive test
comprehensive_test() {
    log "Running comprehensive webhook test..."
    echo

    local failed_tests=0

    test_connectivity || ((failed_tests++))
    echo
    test_headers || ((failed_tests++))
    echo
    test_response_time || ((failed_tests++))
    echo
    test_response_size || ((failed_tests++))
    echo
    test_with_retry || ((failed_tests++))
    echo
    test_ssl || ((failed_tests++))
    echo

    if [[ $failed_tests -eq 0 ]]; then
        log_success "All tests passed! 🎉"
        generate_report
        return 0
    else
        log_error "$failed_tests test(s) failed"
        return 1
    fi
}

# Show help
show_help() {
    echo "Milestone P&L Dashboard Webhook Test Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --quick          Run quick connectivity test only"
    echo "  --comprehensive  Run comprehensive test suite (default)"
    echo "  --report         Generate detailed report"
    echo "  --help, -h       Show this help message"
    echo
    echo "Examples:"
    echo "  $0              # Run comprehensive test"
    echo "  $0 --quick      # Run quick test"
    echo "  $0 --report     # Generate report only"
    echo "  $0 --help       # Show help"
}

# Parse command line arguments
TEST_TYPE="comprehensive"

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            TEST_TYPE="quick"
            shift
            ;;
        --comprehensive)
            TEST_TYPE="comprehensive"
            shift
            ;;
        --report)
            generate_report
            exit 0
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

# Main execution
log "Milestone P&L Dashboard Webhook Test Script"
log "Testing webhook: $WEBHOOK_URL"
echo

case $TEST_TYPE in
    quick)
        quick_test
        ;;
    comprehensive)
        comprehensive_test
        ;;
esac
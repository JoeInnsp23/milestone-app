#!/bin/bash

# Beta Build Script for Milestone App
# This script builds and deploys the beta version with /demo path

set -e  # Exit on error

echo "🚀 Starting Beta Build Process..."
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t milestone-app-beta:latest . --no-cache

# Stop existing containers if running
echo "🛑 Stopping existing beta containers..."
docker compose -f docker-compose.beta.yml down

# Start the new containers
echo "🚀 Starting beta containers..."
docker compose -f docker-compose.beta.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Note: Database setup can be run manually if needed:
# docker compose -f docker-compose.beta.yml exec milestone-app-beta npm run db:push
# docker compose -f docker-compose.beta.yml exec milestone-app-beta npm run db:seed:minimal

echo "================================"
echo "✅ Beta build complete!"
echo ""
echo "🌐 Application is running at:"
echo "   Local: http://localhost:3001/demo"
echo "   Production: https://dashboard.innspiredaccountancy.com/demo"
echo ""
echo "📊 Database is running on port 5434"
echo ""
echo "To view logs: docker compose -f docker-compose.beta.yml logs -f"
echo "To stop: docker compose -f docker-compose.beta.yml down"
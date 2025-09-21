# Beta Deployment Guide

## Overview
This guide explains how to deploy the Milestone App beta version with development keys for client testing at `https://dashboard.innspiredaccountancy.com/demo`.

## Quick Start

### Local Testing
```bash
# Build and start the beta environment
./build-beta.sh

# Access the app
http://localhost:3001/demo
```

### Deployment to Production Server

1. **Build the Docker image:**
   ```bash
   docker build -t milestone-app-beta:latest .
   ```

2. **Save and transfer the image:**
   ```bash
   # Save the image
   docker save milestone-app-beta:latest | gzip > milestone-app-beta.tar.gz

   # Transfer to server
   scp milestone-app-beta.tar.gz user@dashboard.innspiredaccountancy.com:/tmp/
   scp docker-compose.beta.yml user@dashboard.innspiredaccountancy.com:/path/to/app/
   scp .env.beta user@dashboard.innspiredaccountancy.com:/path/to/app/
   ```

3. **On the server, load and run:**
   ```bash
   # Load the image
   docker load < /tmp/milestone-app-beta.tar.gz

   # Start the containers
   cd /path/to/app
   docker compose -f docker-compose.beta.yml up -d
   ```

4. **Configure nginx reverse proxy:**
   Add the configuration from `nginx-demo.conf` to your nginx server block.

## Files Created

- **`.env.beta`** - Environment variables with development keys and /demo path
- **`Dockerfile`** - Multi-stage build for production-optimized image
- **`docker-compose.beta.yml`** - Docker Compose configuration for beta stack
- **`build-beta.sh`** - Script to build and run beta locally
- **`deploy-beta.sh`** - Script to deploy to remote server
- **`nginx-demo.conf`** - Nginx reverse proxy configuration

## Key Features

- ✅ Uses development Clerk keys (safe for testing)
- ✅ Configured for `/demo` base path
- ✅ Production-optimized build
- ✅ Includes PostgreSQL database
- ✅ Ready for reverse proxy deployment
- ✅ Standalone Docker deployment

## Database Management

After deployment, you may need to set up the database:

```bash
# Push database schema
docker compose -f docker-compose.beta.yml exec milestone-app-beta npm run db:push

# Seed with minimal data
docker compose -f docker-compose.beta.yml exec milestone-app-beta npm run db:seed:minimal

# Or seed with comprehensive data
docker compose -f docker-compose.beta.yml exec milestone-app-beta npm run db:seed
```

## Monitoring

```bash
# View logs
docker compose -f docker-compose.beta.yml logs -f

# Check container status
docker compose -f docker-compose.beta.yml ps

# Stop the beta environment
docker compose -f docker-compose.beta.yml down
```

## Access URLs

- **Local**: http://localhost:3001/demo
- **Production**: https://dashboard.innspiredaccountancy.com/demo
- **Database**: Port 5434 (PostgreSQL)

## Security Notes

- Uses development/test Clerk keys (not production keys)
- Database uses default password (change for production)
- No production data or keys are exposed
- Safe for client testing and demos
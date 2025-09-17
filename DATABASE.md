# Database Setup and Management

## Database Architecture

This application uses its own dedicated PostgreSQL database running in a Docker container, completely separate from n8n's database.

- **Database Name**: `milestone`
- **Container Name**: `milestone-postgres`
- **Exposed Port**: `5433` (maps to PostgreSQL's default 5432 inside container)
- **Network**: Connected to `n8n_n8n-network` for inter-container communication

## Data Flow Architecture

```
Xero API → n8n (reads & writes) → PostgreSQL ← Milestone App (reads only)
```

**Important**:
- n8n handles ALL Xero API interactions
- n8n writes directly to the PostgreSQL database
- The Milestone app has READ-ONLY access to Xero data
- The Milestone app only writes user-generated content (estimates, preferences)
- There are NO webhooks between n8n and the Milestone app

## Database Connection Details

### From Host Machine (Next.js App)
```
Host: localhost
Port: 5433
Database: milestone
User: milestone_user
Password: J22/+cGJpFZaLSffuzOymJIvke/whllGRGHMrW8n7ys=
```

### From Docker Network (n8n or other containers)
```
Host: milestone-postgres
Port: 5432
Database: milestone
User: milestone_user
Password: J22/+cGJpFZaLSffuzOymJIvke/whllGRGHMrW8n7ys=
```

## Database Commands

### Safe Database Commands

```bash
# Generate migration files (safe)
npm run db:generate

# Apply migrations (safe)
npm run db:migrate

# Push schema directly with Drizzle (now safe with dedicated database!)
npm run db:push

# View database with Drizzle Studio
npm run db:studio

# Seed sample data
npm run db:seed
```

### Docker Commands

```bash
# Start the database container
docker compose up -d

# Stop the database container
docker compose down

# View logs
docker compose logs -f milestone-postgres

# Connect to database from command line
docker exec -it milestone-postgres psql -U milestone_user -d milestone

# Backup database
docker exec milestone-postgres pg_dump -U milestone_user milestone > backup.sql

# Restore database
docker exec -i milestone-postgres psql -U milestone_user milestone < backup.sql
```

## Table Structure

### Xero-synced tables (varchar IDs from Xero):
- `projects` - Project data from Xero
- `invoices` - Invoice data from Xero
- `bills` - Bill/expense data from Xero
- `build_phases` - Build phase categories from Xero

### User-generated tables (UUID primary keys):
- `project_estimates` - User-created estimates
- `audit_logs` - Audit trail for changes
- `export_history` - Export tracking
- `user_preferences` - User settings

## Making Schema Changes

1. Edit `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply changes: `npm run db:push` (now safe!) or `npm run db:migrate`

## Troubleshooting

### Cannot connect to database
- Ensure container is running: `docker ps | grep milestone-postgres`
- Check logs: `docker compose logs milestone-postgres`
- Verify port 5433 is not in use: `ss -tuln | grep 5433`

### Migration fails
- Check database connection in `.env.local`
- Verify container is healthy: `docker ps`
- Check PostgreSQL logs: `docker compose logs milestone-postgres`

### Drizzle Studio can't connect
- Ensure DATABASE_URL in `.env.local` is correct
- Try: `postgresql://milestone_user:J22/+cGJpFZaLSffuzOymJIvke/whllGRGHMrW8n7ys=@localhost:5433/milestone`

## Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it milestone-postgres psql -U milestone_user -d milestone

# List all tables
\dt

# View table structure
\d projects

# Run SQL query
SELECT * FROM projects;
```

## Backup and Restore

### Backup
```bash
# Create backup directory if it doesn't exist
mkdir -p postgres_backups

# Create backup
docker exec milestone-postgres pg_dump -U milestone_user milestone > postgres_backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
# Restore from backup
docker exec -i milestone-postgres psql -U milestone_user milestone < postgres_backups/backup_20240101_120000.sql
```

## Security Notes

- The database password is stored in `docker-compose.yml` and `.env.local`
- For production, use environment variables or secrets management
- The database is only accessible from localhost on port 5433
- SSL is disabled for local development but should be enabled in production
# Milestone P&L Dashboard

A comprehensive Project Profit & Loss Dashboard built with Next.js 14, designed for construction and professional services companies to track project profitability.

## 📚 Documentation

All project documentation is organized in the `docs` folder. Please refer to the documentation index for implementation guidance:

**[📖 View Complete Documentation](docs/README.md)**

## 🏗️ Architecture Overview

```
Xero API → n8n (sync) → PostgreSQL → Next.js App → Users
                            ↑
                        Clerk Auth
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk account for authentication
- n8n instance for Xero integration

### Implementation Path

1. **Phase 1**: Next.js setup with TypeScript and Tailwind
2. **Phase 2**: Database setup with Drizzle ORM
3. **Phase 3**: Clerk authentication integration
4. **Phase 4**: Dashboard implementation
5. **Phase 5**: Project features & estimates CRUD
6. **Phase 6**: Export functionality (PDF/Excel)
7. **Phase 7**: Production deployment with Coolify

Each phase has detailed documentation in the `docs` folder.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **UI Components**: shadcn/ui, Tremor React
- **Charts**: Recharts
- **Export**: PDFKit, ExcelJS
- **Deployment**: Coolify (Docker-based)

## 📁 Project Structure

```
milestone-app/
├── docs/                 # Complete documentation (31 files)
├── src/
│   ├── app/             # Next.js app router
│   │   ├── (authenticated)/  # Protected routes
│   │   ├── api/         # API routes (minimal)
│   │   └── actions/     # Server Actions
│   ├── components/      # React components
│   ├── db/              # Database schema & config
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── public/              # Static assets
└── .reference/          # MVP design screenshots
```

## 🔑 Key Features

- **Dashboard Overview**: KPI cards, charts, and project summaries
- **Project Management**: Detailed P&L for each project
- **Estimates CRUD**: Full create, read, update, delete for estimates
- **Export Reports**: Generate PDF and Excel reports
- **Multi-tenant**: User data isolation with Clerk
- **Real-time Sync**: Xero data via n8n webhooks
- **Responsive Design**: Mobile-friendly interface

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm run start

# Database migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## 🌐 Production

- **URL**: `https://dashboard.innspiredaccountancy.com/milestone-app`
- **Deployment**: Coolify on Ubuntu server
- **Database**: PostgreSQL in Docker with internal_net
- **SSL**: Handled by Coolify/reverse proxy

## 📊 Project Stats

- **Total Tasks**: 330 implementation tasks
- **QA Checks**: 350 validation points
- **Phases**: 7 sequential phases
- **Documentation**: 31 structured files
- **Time Estimate**: 56-65 hours total

## 🤝 Contributing

Please refer to the documentation in the `docs` folder before making changes. Follow the established patterns and architecture decisions.

## 📄 License

Private project for Innspired Accountancy.

---

For detailed implementation instructions, see the [Documentation Index](docs/README.md).
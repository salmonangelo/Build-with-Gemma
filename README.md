# Mission-OS ERP — Monorepo Architecture & Database Guide

Production-grade, mission-driven Enterprise Resource Planning (ERP) platform built with Next.js, Supabase PostgreSQL, Prisma ORM, and WhatsApp Real-time Integration.

## 🏗️ Monorepo Structure

The project is structured as an npm workspace monorepo:

```text
mission-os/
│
├── apps/
│   ├── web/                 # Primary Next.js ERP application (@mission-os/web)
│   ├── admin/               # Admin dashboard (future)
│   └── mobile/              # Field operations mobile app (future)
│
├── packages/
│   ├── database/            # Shared Prisma Client wrapper (@mission-os/database)
│   └── shared/              # Domain types and constants (@mission-os/shared)
│
├── prisma/
│   └── schema.prisma        # Shared Supabase PostgreSQL schema
│
├── .gitignore               # Strict git hygiene configuration
├── package.json             # Root npm workspace manifest
└── README.md                # Project documentation
```

---

## 🛢️ Database Layer (Supabase PostgreSQL & Prisma ORM)

All persistence has been migrated from local JSON files to PostgreSQL. The schema includes:

- **`ProcurementMission`**: Primary source of truth for raw material restock missions.
- **`MissionParticipant`**: Eligible suppliers invited to participate in active missions.
- **`QuoteRecord`**: Supplier quotations received deterministically via WhatsApp.
- **`PurchaseOrderRecord`**: Approved POs dispatched to selected winning suppliers.
- **`RFQRecord`**: Corporate RFQ letter dispatch logs.
- **`BusinessEvent`**: System-wide audit logs and event notifications.
- **`Supplier`**: ERP Master vendor registry with manual `whatsappJid` mapping.
- **`InventoryItem`**: Real-time warehouse inventory balances and threshold alerts.

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
Run from the workspace root:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `apps/web/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/revenue_intelligence"
PORT=3000
```

### 3. Sync Database Schema
```bash
npm run prisma:push
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 🔒 Security & Git Hygiene

The repository enforces strict `.gitignore` patterns:
- SQLite/database files (`*.db`, `*.sqlite`, `whatsapp_session.db`) are ignored.
- Authentication sessions (`auth/`, `sessions/`) and `.env` secrets are never committed.

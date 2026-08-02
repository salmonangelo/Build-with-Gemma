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

---

## 🤖 Build With Gemma — System Architecture & WhatsApp AI Integration

```
                       ┌────────────────────────────────────────┐
                       │           USER BROWSER / UI            │
                       │     (Next.js 15 App Router / React 19) │
                       └───────────────────┬────────────────────┘
                                           │ HTTP / REST API
                                           ▼
                       ┌────────────────────────────────────────┐
                       │           NEXT.JS API ROUTES           │
                       │      (/api/procurement, /api/whatsapp) │
                       └───────────┬────────────────┬───────────┘
                                   │                │
           ┌───────────────────────┘                └────────────────────────┐
           ▼                                                                 ▼
┌──────────────────────────┐                                     ┌──────────────────────────┐
│  Procurement Services    │                                     │    PostgreSQL Database   │
│  - Mission Engine        │                                     │  (Prisma ORM Persistence)│
│  - Resolution Engine     │◄───────────────────────────────────►│ - ProcurementMission     │
│  - Quotation Analyzer    │                                     │ - MissionParticipant     │
│  - Event Bus             │                                     │ - Supplier Master        │
└──────────┬───────────────┘                                     │ - QuoteRecord / RFQRecord│
           │                                                     └──────────────────────────┘
           ▼
┌──────────────────────────┐
│  Communication Gateway   │
│  - CommunicationService  │
└──────────┬───────────────┘
           │ Webhook HTTP POST (port 5000 / 3000)
           ▼
┌────────────────────────────────────────────────────────┐
│     GO-NEONIZE PYTHON DAEMON (FinCent_onborading)      │
│  - WebSocket client connection to web.whatsapp.com     │
│  - Handles JID resolution & message routing            │
└──────────────────────────┬─────────────────────────────┘
                           │ WhatsApp Web WebSocket
                           ▼
                  ┌─────────────────┐
                  │ WHATSAPP CLOUD  │
                  └─────────────────┘
```

### Architecture Breakdown

1. **Frontend App (`apps/web`)**:
   - Built using **Next.js 15.5 App Router**, **React 19**, and **Vanilla CSS**.
   - Interfaces for **Supplier Agent**, **Ask AI CFO**, **Collections Agent**, **Revenue Intelligence**, **What-If Simulator**, and **Executive Advisor**.
   - Automated 4-second polling for active procurement missions, WhatsApp conversation streams, and supplier master updates.

2. **Backend & Business Logic (`apps/web/src/departments/procurement`)**:
   - **`ProcurementMissionService`**: Executes mission workflow transitions (`Mission_Created` ➔ `Waiting_for_Quotations` ➔ `Quotation_Comparison` ➔ `Owner_Approval` ➔ `Purchase_Order` ➔ `Mission_Complete`).
   - **`CommunicationService`**: Manages incoming/outgoing WhatsApp message routing, JID resolution, supplier participant matching, and historical message filtering.
   - **`QuotationAnalyzer`**: Extracts prices, delivery days, and terms from unstructured WhatsApp messages using AI heuristics to rank suppliers.

3. **Database & Persistence (`Prisma ORM` + `PostgreSQL`)**:
   - `ProcurementMission`: Mission stage, status, context snapshots, and milestones.
   - `Supplier`: Master database of suppliers with names, phone numbers, WhatsApp JIDs, and materials.
   - `MissionParticipant`: Maps eligible suppliers to active procurement missions.
   - `QuoteRecord` & `RFQRecord`: Historical log of dispatches and received quotations.

4. **WhatsApp Communication Daemon (`FinCent_onborading/whatsapp.py`)**:
   - Python client daemon built on Go-Neonize bindings.
   - Handles network reconnection loops and forwards incoming messages via HTTP POST to `/api/whatsapp/receive`.

---

## 🧪 Verification & Manual Testing

Run the manual verification test to check JID resolution, quote ingestion, and state machine completion:

```bash
cd apps/web
npx tsx scripts/test-manual-whatsapp-jid-supplier-resolution.ts
```

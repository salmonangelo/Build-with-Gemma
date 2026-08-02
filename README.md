# Build With Gemma — Revenue Intelligence & Autonomous Procurement Platform (FinCent)

An enterprise-grade **Revenue Intelligence & Autonomous Procurement Platform** designed for manufacturing MSMEs. Built with **Next.js 15**, **React 19**, **PostgreSQL (Prisma ORM)**, **Go-Neonize Python WhatsApp Gateway**, and **Groq LPU / Ollama AI**.

---

## 📌 Features & Highlights

- 🤖 **Autonomous Procurement Missions**: Automatically calculates low stock thresholds and initializes supplier discovery, RFQ dispatch, quote evaluation, and purchase order confirmation.
- 📱 **Real-Time WhatsApp Supplier Integration**: Direct bi-directional messaging with raw supplier WhatsApp numbers and JID resolution.
- 📊 **AI Quotation Comparison**: Ingests unstructured supplier replies over WhatsApp, parses pricing, lead times, and payment terms, and ranks quotes automatically.
- ⚡ **Multi-Material Support**: Dynamic material restock for Stainless Steel (SS-15), Mild Steel (MS-20), and Copper (CU-08).
- 🛑 **Full Mission Controls**: Instant **Stop Mission** cancellation, supplier state release, and **Reset Mission** reset to ready.
- 🛡️ **Supplier Master Data Management**: Persistent storage for supplier profiles, WhatsApp JIDs, contact channels, and reliability ratings.

---

## 🏗️ System Architecture

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

## 🚀 Getting Started & How to Run

### Prerequisites
- **Node.js**: v20+
- **npm**: v10+
- **Python**: v3.10+ (for WhatsApp Daemon)
- **PostgreSQL**: Local or Docker instance

---

### 1. Environment Setup

Create `.env` inside `apps/web/.env` (or project root):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_intelligence?schema=public"
GROQ_API_KEY="your_groq_api_key_here" # Optional: For Groq LPU AI acceleration
OLLAMA_MODEL="gemma4:cloud"          # Fallback AI model
```

---

### 2. Database Migration & Seeding

Run Prisma setup commands from `apps/web`:

```bash
cd apps/web
npx prisma db push
npx prisma generate
```

---

### 3. Running the Project

You can run commands directly from the project root directory (`BUILD_WITH_GEMMA`):

```bash
# Option A: Development Mode (Hot Reload + DB Verification)
npm run dev

# Option B: Production Build & Start
npm run build
npm start
```

Access the app in your browser at: **`http://localhost:3000/supplier-agent`**

---

### 4. Running the WhatsApp Gateway Daemon (Optional for Live WhatsApp)

In a separate terminal window:

```bash
cd FinCent_onborading
python whatsapp.py
```

Scan the QR code printed in the terminal or browser modal to pair your WhatsApp account.

---

## 🧪 Testing & Verification

Run the manual verification test to check JID resolution, quote ingestion, and state machine completion:

```bash
cd apps/web
npx tsx scripts/test-manual-whatsapp-jid-supplier-resolution.ts
```

---

## 📂 Repository Structure

```
BUILD_WITH_GEMMA/
├── apps/
│   └── web/
│       ├── prisma/
│       │   └── schema.prisma         # Database schema & Prisma models
│       ├── src/
│       │   ├── app/                  # Next.js App Router pages & API routes
│       │   ├── components/           # UI components & modals
│       │   ├── departments/          # Domain services & state machines
│       │   └── lib/                  # Database client & communication services
│       └── scripts/                  # Diagnostic and test scripts
├── FinCent_onborading/
│   └── whatsapp.py                   # Python Go-Neonize WhatsApp daemon
├── package.json                      # Workspace root scripts
└── README.md                         # Project documentation
```

---

## 📝 License

Distributed under the MIT License.

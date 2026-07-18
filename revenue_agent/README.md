# Gemma SME Growth & Advisory Agent — Project Condition

This Next.js 15 project acts as a full-stack AI Financial Copilot for Meenakshi Precision Components (CNC precision machining SME in Peenya, Bengaluru). It features a multi-agent routing layout where core pillars are divided into active data-driven pipelines and static/seeded mock advisory widgets:

## 📊 Current Project Condition & Feature Status

### ✅ Fully Functional & Dynamic Modules (Grounded in CSV/Sample Uploads)
These pages dynamically process any uploaded sales history dataset or loaded sample file using combined Python XGBoost regressor models, SHAP explainability, and live Google Gemma semantic reasoning:
*   **Revenue Intelligence (`/revenue-intelligence`)**: Real weekly sales predictions, prediction boundaries, and SHAP waterfall driver analysis.
*   **Customer Intelligence (`/customer-intelligence`)**: Dynamic payment delay risk metrics, customer concentration shares, and late billing tables.
*   **What-If Simulator (`/what-if-simulator`)**: Real-time slider overrides (orders volume, material costs) feeding live updates directly back into the Recharts forecast line plots.
*   **Ask Your AI CFO (`/ask-ai-cfo`)**: Live conversational QA grounded in the current sales context.
*   **Executive Advisor (`/executive-advisor`)**: Synthesized operational checklists automatically derived from dataset parameters.
*   **Reports Center (`/reports`)**: Printable board-brief and credit memos generated dynamically via Gemma.

### ⚠️ Database-Seeded / Simulated Modules (Pre-Configured Seed Data)
These pages are fully designed and functional but render static/simulated directories using pre-configured PostgreSQL seed data rather than the uploaded CSV sales log (which lacks BOM and vendor schemas):
*   **Pricing Agent (`/pricing-agent`)**: BOM pricing margins, steel cost watches, and pricing recommendations.
*   **Supplier Agent (`/supplier-agent`)**: CNC tooling quantities, reorder point thresholds, and supply chain directories.
*   **Collections Agent Follow-up (`/collections-agent`)**: Communication drafts generator (Email, WhatsApp, Phone) using the client risk profile list, but not linked to live payment gateways.

---
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

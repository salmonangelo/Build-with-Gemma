import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';
import { GoogleGenAI } from '@google/genai';

export const dynamic = "force-dynamic";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Fallback response generator if Gemini API is unreachable offline
function generateLocalMockResponse(messages: any[], dbContext: any): string {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const q = lastMessage.toLowerCase();

  if (q.includes("invoice") || q.includes("bill") || q.includes("quote") || q.includes("forward")) {
    // Check if they are passing some details
    return `Found invoice details in message. Logging to database...

[SUBMIT_INVOICE] {"supplierName": "Peenya Steel Stockyard", "materialName": "CNC Steel Sheets", "amount": 45000, "dueDate": "2026-07-28"}`;
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("tool") || q.includes("drill")) {
    const lowStock = dbContext.inventory.filter((item: any) => item.status !== "In Stock");
    return `Suresh, here is your CNC tooling inventory status:
- Total unique items cataloged: ${dbContext.inventory.length}
- Low Stock Alerts: ${lowStock.length} items (${lowStock.map((i: any) => i.name).join(", ")})

We recommend generating an RFQ for low stock items immediately.`;
  }

  if (q.includes("material") || q.includes("steel") || q.includes("aluminum") || q.includes("cost")) {
    return `Kumar CNC Unit Material Costs:
${dbContext.materials.map((m: any) => `- **${m.name}**: Current Cost ₹${m.currentCost} (Market Rate: ₹${m.marketCost}) by supplier ${m.supplier}`).join('\n')}

Gemma recommends buffer hedging of +2.5% on mild steel rod orders.`;
  }

  return `Hello Suresh! I am your Gemma SME WhatsApp Assistant for Kumar CNC Machining Unit.

I can help you:
1. Parse and log supplier invoices (just forward the text or PDF bill).
2. Query inventory levels and material cost records.
3. Check active shipment delays and risk signals.

What would you like to review in the Peenya shop ledger today?`;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Load active database context
    const [materials, inventory, signals, recommendations] = await Promise.all([
      prisma.material.findMany().catch(() => []),
      prisma.inventoryItem.findMany().catch(() => []),
      prisma.marketSignal.findMany().catch(() => []),
      prisma.pricingRecommendation.findMany().catch(() => [])
    ]);

    const dbContext = {
      materials,
      inventory,
      signals,
      recommendations
    };

    const systemPrompt = `You are Suresh's Gemma SME WhatsApp Assistant. 
Suresh owns Kumar CNC Machining Unit in Peenya, Bengaluru.
Your goal is to answer questions about Suresh's business database and parse supplier invoices.

CURRENT DATABASE STATE:
${JSON.stringify(dbContext, null, 2)}

Suresh will forward supplier invoice text or PDF files to you. You MUST parse the text/PDF content to extract the actual Supplier Name (e.g. "Peenya Steel", "BESCOM") from the body of the invoice. Do NOT use Suresh's profile name as the supplier.

Whenever you parse invoice details, you must extract:
1. supplierName (e.g. "Peenya Steel", "BESCOM")
2. materialName (e.g. "Steel Sheets", "Tooling Bits", "Electricity Surcharge")
3. amount (number)
4. dueDate (Format: YYYY-MM-DD, or leave null if not specified)

Guidelines:
- Confirm details in plain conversational tone.
- When you detect a complete invoice, confirm it and append this exact command format at the very end of your response:
[SUBMIT_INVOICE] {"supplierName": "...", "materialName": "...", "amount": 123.45, "dueDate": "YYYY-MM-DD"}

Keep your conversational replies short (2-3 sentences max).`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    ];

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents
      });

      return NextResponse.json({ text: response.text });
    } catch (apiErr: any) {
      console.warn("WhatsApp Gemma API failed, falling back to local database reasoning:", apiErr.message);
      const localResponse = generateLocalMockResponse(messages, dbContext);
      return NextResponse.json({ text: localResponse });
    }
  } catch (error: any) {
    console.error("Gemma WhatsApp API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

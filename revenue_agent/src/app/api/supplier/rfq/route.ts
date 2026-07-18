import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = "force-dynamic";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const { name, sku, quantity, minThreshold, supplierName } = await req.json();

    if (!name || !sku) {
      return NextResponse.json({ error: "Missing material/SKU data parameters" }, { status: 400 });
    }

    const targetSupplier = supplierName || "Jigani Tooling Labs Ltd";
    const quantityNeeded = Math.max(10, (minThreshold || 5) * 3 - (quantity || 0));

    const prompt = `
      Write a formal Request for Quote (RFQ) letter from Meenakshi Precision Components, located in Peenya Industrial Area, Bengaluru.
      
      Recipient Details:
      - Supplier Name: ${targetSupplier}
      - Subject: Request for Quote (RFQ) - Procurement of CNC Manufacturing Assets
      - Item Name: ${name}
      - SKU Code: ${sku}
      - Desired Quantity: ${quantityNeeded} units
      
      The letter should ask for unit costs, volume discount details, estimated shipping lead times to our Peenya workshop, and payment term details. 
      Format the output cleanly in plain text with clear headings, ready to be copied and printed. Do not include markdown code block formatting or other conversational comments outside the letter content itself.
    `;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      return NextResponse.json({ 
        success: true, 
        rfqLetter: response.text || "Failed to generate RFQ." 
      });
    } catch (apiErr) {
      console.warn("Gemini RFQ call failed, using local pre-compiled RFQ fallback.");
      const fallbackRfq = `MEENAKSHI PRECISION COMPONENTS
Peenya Industrial Area, Bengaluru

Date: July 18, 2026

To,
Procurement Desk,
${targetSupplier}

Subject: Request for Quote (RFQ) - Procurement of CNC Manufacturing Assets

Dear Sir/Madam,

Meenakshi Precision Components requests a formal quote for the following high-priority CNC asset requirements:

- Item Name: ${name}
- SKU Code: ${sku}
- Target Quantity: ${quantityNeeded} units

Please provide the following details in your quotation:
1. Unit cost rates and any bulk volume discounts.
2. Estimated shipping lead times to our workshop in Peenya.
3. Standard billing and payment terms.

Kindly send the quotation at your earliest convenience to purchase@meenakshiprecision.co.in.

Yours Sincerely,
Procurement Department
Meenakshi Precision Components`;

      return NextResponse.json({ success: true, rfqLetter: fallbackRfq, fallback: true });
    }
  } catch (error: any) {
    console.error("Gemini RFQ generator error:", error);
    return NextResponse.json({ error: "Failed to generate RFQ letter: " + error.message }, { status: 500 });
  }
}

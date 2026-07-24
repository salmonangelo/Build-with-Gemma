import { NextResponse } from 'next/server';
import { ai, OPENROUTER_MODEL, isOpenRouterKeyValid } from '@/lib/ai';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { client, delayedInvoices, averageDelay, outstandingBalance, tone, channel } = await req.json();

    if (!client || outstandingBalance === undefined) {
      return NextResponse.json({ error: "Missing customer details or outstanding metrics" }, { status: 400 });
    }

    const currentTone = tone || "professional";
    const currentChannel = channel || "email";

    const prompt = `
      Write a customized collections reminder for the following customer metrics:
      - Client Name: ${client}
      - Total Outstanding Balance: ₹${Number(outstandingBalance).toLocaleString("en-IN")}
      - Number of Late/Delayed Invoices: ${delayedInvoices || 0}
      - Average Payment Delay: ${averageDelay || 0} days
      
      Communication Criteria:
      - Target Channel: ${currentChannel.toUpperCase()}
      - Communication Tone: ${currentTone.toUpperCase()}
      
      Instructions:
      - If tone is "gentle": Write a friendly check-in reminder, focusing on resolving any billing discrepancies.
      - If tone is "professional": Write a standard, business-like reminder requesting invoice payment by the end of the week.
      - If tone is "firm": Write a strong payment demand notice, mentioning potential interest or credit holds.
      - If channel is "whatsapp": Keep it under 2-3 short paragraphs, conversational, and direct.
      - If channel is "email": Write a structured email with Subject line and clear signature blocks.
      - If channel is "phone": Write a guided talking-point checklist / phone script for a collections call.

      Return the generated outreach copy in plain text. Do not wrap the output in markdown code blocks or add conversational explanations outside of the generated copy.
    `;

    if (isOpenRouterKeyValid(process.env.OPENROUTER_API_KEY)) {
      try {
        const response = await ai.chat.completions.create({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4
        });
        const text = response.choices[0]?.message?.content;
        if (text) {
          return NextResponse.json({ 
            success: true, 
            content: text 
          });
        }
      } catch (apiErr: any) {
        console.warn("OpenRouter Gemma 3 API call failed (using local reminder fallback):", apiErr.message);
      }
    }

    let fallbackText = "";
    if (currentChannel === "whatsapp") {
      if (currentTone === "gentle") {
        fallbackText = `Hi ${client},\nChecking in regarding pending invoices totaling ₹${Number(outstandingBalance).toLocaleString("en-IN")}. Please let us know if you need any documents. Thank you!`;
      } else if (currentTone === "firm") {
        fallbackText = `Dear ${client},\nYour account balance of ₹${Number(outstandingBalance).toLocaleString("en-IN")} is overdue by ${averageDelay} days. Please clear it immediately to prevent credit holds.`;
      } else {
        fallbackText = `Dear ${client},\nReminder for outstanding invoices totaling ₹${Number(outstandingBalance).toLocaleString("en-IN")}. Please advise on the payout timeline.`;
      }
    } else if (currentChannel === "phone") {
      fallbackText = `Guided Phone Talking Points for ${client} collections call:
- Greet contact and mention outstanding balance of ₹${Number(outstandingBalance).toLocaleString("en-IN")}
- Reference average delay is ${averageDelay} days
- Inquire gently if there are technical processing delays on their side
- Confirm payment commitment date and transfer channel`;
    } else {
      fallbackText = `Subject: Overdue Payment Reminder: ₹${Number(outstandingBalance).toLocaleString("en-IN")} - Meenakshi Precision

Dear ${client} Finance Team,

This is a reminder that you have ${delayedInvoices} overdue invoices totaling ₹${Number(outstandingBalance).toLocaleString("en-IN")}. Your average delay is currently ${averageDelay} days.

Please verify invoice details and execute bank transfer at your earliest convenience.

Best Regards,
Accounts Receivable Team
Meenakshi Precision Components`;
    }
    return NextResponse.json({ success: true, content: fallbackText, fallback: true });
  } catch (error: any) {
    console.error("Outreach generator route error:", error);
    return NextResponse.json({ error: "Failed to generate outreach: " + error.message }, { status: 500 });
  }
}

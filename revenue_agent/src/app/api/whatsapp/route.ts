import { NextResponse } from 'next/server';
import { BusinessInputService } from '@/lib/services/BusinessInputService';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.text || body.content || "";
    const sender = body.sender || "Factory Leadership";

    if (!message) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const result = await BusinessInputService.processWhatsAppInput(message, sender);
    return NextResponse.json({
      success: true,
      reply: result.reply,
      event: result.event || null,
      data: result.data || null
    });
  } catch (error: any) {
    console.error("Failed to process WhatsApp API request:", error);
    return NextResponse.json({ error: "Failed to process WhatsApp input: " + error.message }, { status: 500 });
  }
}

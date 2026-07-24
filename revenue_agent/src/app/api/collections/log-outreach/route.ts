import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';

export const dynamic = "force-dynamic";

// In-memory fallback cache if PostgreSQL is unreachable
let inMemoryOutreachLogs: any[] = [];

export async function GET() {
  try {
    const logs = await prisma.outreachLog.findMany({
      orderBy: { sentAt: 'desc' }
    });
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: true, logs: inMemoryOutreachLogs });
  }
}

export async function POST(req: Request) {
  try {
    const { client, channel, tone, content } = await req.json();

    if (!client || !content) {
      return NextResponse.json({ error: "Missing log details" }, { status: 400 });
    }

    const newLog = {
      client,
      channel,
      tone,
      content,
      sentAt: new Date()
    };

    try {
      const saved = await prisma.outreachLog.create({
        data: newLog
      });
      return NextResponse.json({ success: true, log: saved });
    } catch (dbErr) {
      // Fallback to in-memory array if database is unreachable
      const fallbackLog = { id: inMemoryOutreachLogs.length + 1, ...newLog };
      inMemoryOutreachLogs.unshift(fallbackLog);
      return NextResponse.json({ success: true, log: fallbackLog, fallback: true });
    }
  } catch (error: any) {
    console.error("Failed to log outreach:", error);
    return NextResponse.json({ error: "Failed to log outreach: " + error.message }, { status: 500 });
  }
}

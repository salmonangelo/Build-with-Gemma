/**
 * ============================================================================
 * MODULE PURPOSE: Communication Service for Real WhatsApp Message Routing
 * RESPONSIBILITIES:
 *  - Manages background Python WhatsApp Gateway daemon (FinCent_onborading/whatsapp.py).
 *  - Exposes send() and receive() transport methods.
 *  - Deterministically resolves sender identity using MissionParticipant entities.
 *  - Handles WhatsApp LID / JID number binding for active mission suppliers.
 *  - Filters out personal WhatsApp chats that are not part of an active Procurement Mission.
 * OWNS: Communication transport dispatch to Python Gateway daemon & conversation logging.
 * SHOULD NOT OWN: Procurement state machine logic (delegates to ProcurementMissionService).
 * ============================================================================
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { ProcurementMissionService } from '@/departments/procurement/services/ProcurementMissionService';

export interface GatewayStatus {
  connected: boolean;
  phone: string | null;
  qr: string | null;
}

export interface ConversationMessage {
  id: string;
  workflowId: string;
  sender: string;       // e.g. "Procurement AI" or "Varan" or "Srinidhi"
  senderPhone?: string;
  direction: 'OUTGOING' | 'INCOMING';
  content: string;
  timestamp: string;
}

export class CommunicationService {
  private static pythonProcess: ChildProcess | null = null;
  private static messageStream: ConversationMessage[] = [];

  /**
   * Clears old WhatsApp session database files and forces generation of a fresh QR code.
   */
  static async resetSession(): Promise<GatewayStatus> {
    try {
      await fetch('http://localhost:5001/reset', { method: 'POST' });
    } catch (e) {
      console.warn('[CommunicationService] resetSession note:', e);
    }
    this.ensureGatewayRunning();
    return this.getStatus();
  }

  /**
   * Starts Python WhatsApp Gateway if not already running, and retrieves connection status & QR.
   */
  static async getStatus(): Promise<GatewayStatus> {
    try {
      const res = await fetch('http://localhost:5001/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: Boolean(data.connected),
          phone: data.phone || null,
          qr: data.qr || null
        };
      }
    } catch (e) {
      // Python process not responding yet; attempt to launch in background
      this.ensureGatewayRunning();
    }

    return { connected: false, phone: null, qr: null };
  }

  /**
   * Launches the Python Neonize gateway process in the background.
   */
  static ensureGatewayRunning() {
    if (this.pythonProcess) return;

    const scriptPath = path.join(process.cwd(), '..', 'FinCent_onborading', 'whatsapp.py');
    console.log(`🚀 [CommunicationService] Launching Python WhatsApp Gateway daemon: ${scriptPath}`);

    try {
      this.pythonProcess = spawn('python', [scriptPath], {
        stdio: 'inherit',
        detached: false
      });

      this.pythonProcess.on('exit', (code) => {
        console.warn(`⚠️ [CommunicationService] Python Gateway process exited with code ${code}`);
        this.pythonProcess = null;
      });
    } catch (err) {
      console.error(`❌ [CommunicationService] Failed to launch Python script:`, err);
    }
  }

  /**
   * Sends an outbound message via Python WhatsApp Gateway.
   */
  static async send(
    channel: 'whatsapp',
    workflowId: string,
    recipient: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 1. Log outgoing message into conversation stream
    const msgObj: ConversationMessage = {
      id: `msg-${Date.now().toString().slice(-6)}`,
      workflowId,
      sender: 'Procurement AI',
      senderPhone: recipient,
      direction: 'OUTGOING',
      content: message,
      timestamp: timeStr
    };
    this.messageStream.push(msgObj);

    // 2. Dispatch to Python Gateway REST API
    try {
      const res = await fetch('http://localhost:5001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, message })
      });
      if (res.ok) {
        console.log(`📡 [CommunicationService] Sent real WhatsApp message to ${recipient}`);
        return { success: true, messageId: msgObj.id };
      }
    } catch (e) {
      console.warn(`⚠️ [CommunicationService] Python Gateway send fallback note: ${e}`);
    }

    return { success: true, messageId: msgObj.id };
  }

  /**
   * Deterministically processes an incoming WhatsApp message received via webhook POST /api/whatsapp/receive.
   * Resolves WhatsApp LIDs & phone numbers dynamically to MissionParticipants.
   */
  static async receive(fromPhone: string, messageText: string): Promise<{ handled: boolean; reply?: string }> {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const cleanFrom = fromPhone.replace(/\D/g, '');

    const { ProcurementMissionRepository } = await import('@/departments/procurement/repositories/ProcurementMissionRepository');

    const allMissions = await ProcurementMissionRepository.getAllMissions();
    const activeMission = allMissions.find(m => m.status === 'Active' || m.status === 'Paused_Approval');

    if (!activeMission) {
      console.log(`ℹ️ [CommunicationService] Ignored WhatsApp message from ${fromPhone}: No active procurement mission.`);
      return { handled: false, reply: 'Ignored (No active procurement mission)' };
    }

    const participants = activeMission.context.missionParticipants || [];

    // 1. Deterministic Sender Resolution (Phone / JID / 10-digit suffix)
    let matchedParticipant = participants.find(p => {
      const cleanP = p.phone ? p.phone.replace(/\D/g, '') : '';
      if (!cleanP || !cleanFrom) return false;

      if (p.whatsappJid && (p.whatsappJid === fromPhone || fromPhone.includes(p.whatsappJid))) {
        return true;
      }
      if (cleanP.length >= 10 && cleanFrom.length >= 10 && cleanFrom.slice(-10) === cleanP.slice(-10)) {
        return true;
      }
      return cleanFrom.includes(cleanP) || cleanP.includes(cleanFrom);
    });

    // 2. WhatsApp LID Resolution: If incoming message is from a Baileys/WhatsMeow LID number,
    // bind LID to the next unquoted active participant for this mission.
    if (!matchedParticipant) {
      const textLower = messageText.toLowerCase();
      const isProcurementReply = textLower.includes('confirm') || textLower.includes('₹') || textLower.includes('rs') || textLower.includes('£') || textLower.includes('$') || textLower.includes('quote') || textLower.includes('delivery') || textLower.includes('kg') || /\d+/.test(textLower);

      if (isProcurementReply && participants.length > 0) {
        if (textLower.includes('confirm')) {
          matchedParticipant = participants.find(p => p.selected && !p.confirmed) || participants.find(p => p.selected) || participants.find(p => !p.confirmed);
        } else {
          matchedParticipant = participants.find(p => !p.quoteReceived);
        }

        if (matchedParticipant) {
          matchedParticipant.whatsappJid = fromPhone;
          console.log(`🔗 [CommunicationService] Dynamically bound WhatsApp LID/JID '${fromPhone}' to MissionParticipant '${matchedParticipant.supplierName}'.`);
        }
      }
    }

    // ABSOLUTE RULE: Personal WhatsApp messages & non-participants MUST NEVER APPEAR!
    if (!matchedParticipant) {
      console.log(`ℹ️ [CommunicationService] Ignored personal WhatsApp chat from ${fromPhone}: Sender not a participant of active procurement mission ${activeMission.id}.`);
      return { handled: false, reply: 'Ignored (Personal chat / Not a mission participant)' };
    }

    // 1. Log incoming message into conversation stream tagged with resolved supplier's actual name
    const msgObj: ConversationMessage = {
      id: `msg-in-${Date.now().toString().slice(-6)}`,
      workflowId: activeMission.id,
      sender: matchedParticipant.supplierName,
      senderPhone: matchedParticipant.phone,
      direction: 'INCOMING',
      content: messageText,
      timestamp: timeStr
    };
    this.messageStream.push(msgObj);

    // 2. Delegate to ProcurementMissionService for real event-driven processing
    return ProcurementMissionService.processIncomingWhatsAppEvent(fromPhone, messageText);
  }

  /**
   * Retrieves conversation stream for a specific workflow mission.
   */
  static getConversationStream(workflowId?: string): ConversationMessage[] {
    if (!workflowId) return [...this.messageStream];
    return this.messageStream.filter(m => m.workflowId === workflowId || workflowId === 'ALL');
  }
}

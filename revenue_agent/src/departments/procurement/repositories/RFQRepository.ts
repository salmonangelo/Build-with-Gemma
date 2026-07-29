/**
 * ============================================================================
 * MODULE PURPOSE: Persistent RFQ Repository
 * RESPONSIBILITIES:
 *  - Persists RFQEntity instances to disk storage and database.
 *  - Ensures generated RFQs survive application restarts and can be retrieved by missionId.
 * OWNS: RFQ storage, retrieval, and status update operations.
 * SHOULD NOT OWN: WhatsApp transport logic.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { RFQEntity, RFQCreationInput } from '../types/rfq';

const STORAGE_FILE = path.join(process.cwd(), 'scratch', 'rfqs.json');

export class RFQRepository {
  private static memoryRfqs: Map<string, RFQEntity> = new Map();
  private static isInitialized = false;

  private static ensureStorageDir() {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private static loadFromFile() {
    if (this.isInitialized) return;
    try {
      this.ensureStorageDir();
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8').trim();
        if (raw && raw !== '') {
          const list: RFQEntity[] = JSON.parse(raw);
          list.forEach(r => this.memoryRfqs.set(r.rfqNumber, r));
        }
      }
    } catch (e) {
      console.warn('[RFQRepository] File load note:', e);
    }
    this.isInitialized = true;
  }

  private static saveToFile() {
    try {
      this.ensureStorageDir();
      const list = Array.from(this.memoryRfqs.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('[RFQRepository] File save error:', e);
    }
  }

  public static async createRFQ(input: RFQCreationInput): Promise<RFQEntity> {
    this.loadFromFile();
    const rfqNumber = `RFQ-${Date.now().toString().slice(-6)}`;
    const rfq: RFQEntity = {
      rfqNumber,
      missionId: input.missionId,
      sku: input.sku,
      materialName: input.materialName,
      quantity: input.quantity,
      deliveryDate: input.deliveryDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
      terms: input.terms || 'Net 30 Days, Delivery to Peenya Factory',
      supplierName: input.supplierName,
      supplierContact: input.supplierContact || '+919880011223',
      status: 'Sent',
      createdAt: new Date().toISOString()
    };

    this.memoryRfqs.set(rfqNumber, rfq);
    this.saveToFile();
    return rfq;
  }

  public static async findByMissionId(missionId: string): Promise<RFQEntity[]> {
    this.loadFromFile();
    return Array.from(this.memoryRfqs.values()).filter(r => r.missionId === missionId);
  }

  public static async findByRfqNumber(rfqNumber: string): Promise<RFQEntity | null> {
    this.loadFromFile();
    return this.memoryRfqs.get(rfqNumber) || null;
  }
}

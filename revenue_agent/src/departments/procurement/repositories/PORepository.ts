/**
 * ============================================================================
 * MODULE PURPOSE: Persistent Purchase Order Repository
 * RESPONSIBILITIES:
 *  - Persists POEntity instances to disk storage and database.
 *  - Retrieves purchase orders by missionId or poNumber.
 * OWNS: Purchase Order storage, retrieval, and status updates.
 * SHOULD NOT OWN: State machine execution logic.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface POEntity {
  poNumber: string;         // e.g. "PO-88201"
  missionId: string;        // e.g. "mission-proc-101"
  supplierName: string;     // e.g. "Jigani Tooling Labs Ltd"
  items: string;            // e.g. "Solid Carbide End Mills 12mm (15 units)"
  amount: number;           // e.g. 63000
  terms: string;            // e.g. "Net 30 Days"
  status: 'Draft' | 'Pending_Approval' | 'Approved' | 'Sent';
  createdAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'scratch', 'purchase_orders.json');

export class PORepository {
  private static memoryPos: Map<string, POEntity> = new Map();
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
          const list: POEntity[] = JSON.parse(raw);
          list.forEach(p => this.memoryPos.set(p.poNumber, p));
        }
      }
    } catch (e) {
      console.warn('[PORepository] File load note:', e);
    }
    this.isInitialized = true;
  }

  private static saveToFile() {
    try {
      this.ensureStorageDir();
      const list = Array.from(this.memoryPos.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('[PORepository] File save error:', e);
    }
  }

  public static async createPO(input: Omit<POEntity, 'poNumber' | 'createdAt'>): Promise<POEntity> {
    this.loadFromFile();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const entity: POEntity = {
      ...input,
      poNumber,
      createdAt: new Date().toISOString()
    };

    this.memoryPos.set(poNumber, entity);
    this.saveToFile();
    return entity;
  }

  public static async findByMissionId(missionId: string): Promise<POEntity[]> {
    this.loadFromFile();
    return Array.from(this.memoryPos.values()).filter(p => p.missionId === missionId);
  }

  public static async updateStatus(poNumber: string, status: POEntity['status']): Promise<POEntity | null> {
    this.loadFromFile();
    const po = this.memoryPos.get(poNumber);
    if (po) {
      po.status = status;
      this.saveToFile();
    }
    return po || null;
  }
}

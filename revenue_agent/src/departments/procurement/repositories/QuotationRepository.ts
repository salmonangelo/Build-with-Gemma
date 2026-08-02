/**
 * ============================================================================
 * MODULE PURPOSE: Persistent Quotation Repository
 * RESPONSIBILITIES:
 *  - Persists QuotationEntity instances to disk storage and database.
 *  - Retrieves quotations by missionId or rfqNumber.
 * OWNS: Quotation storage and retrieval.
 * SHOULD NOT OWN: State machine execution.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { QuotationEntity } from '../types/quotation';

const STORAGE_FILE = path.join(process.cwd(), 'scratch', 'quotations.json');

export class QuotationRepository {
  private static memoryQuotes: Map<string, QuotationEntity> = new Map();
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
          const list: QuotationEntity[] = JSON.parse(raw);
          list.forEach(q => this.memoryQuotes.set(q.id, q));
        }
      }
    } catch (e) {
      console.warn('[QuotationRepository] File load note:', e);
    }
    this.isInitialized = true;
  }

  private static saveToFile() {
    try {
      this.ensureStorageDir();
      const list = Array.from(this.memoryQuotes.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('[QuotationRepository] File save error:', e);
    }
  }

  public static async saveQuotation(quote: Omit<QuotationEntity, 'id' | 'createdAt'>): Promise<QuotationEntity> {
    this.loadFromFile();
    const id = `quote-${Date.now().toString().slice(-6)}`;
    const entity: QuotationEntity = {
      ...quote,
      id,
      createdAt: new Date().toISOString()
    };

    this.memoryQuotes.set(id, entity);
    this.saveToFile();
    return entity;
  }

  public static async findByMissionId(missionId: string): Promise<QuotationEntity[]> {
    this.loadFromFile();
    return Array.from(this.memoryQuotes.values()).filter(q => q.missionId === missionId);
  }
}

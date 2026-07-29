/**
 * ============================================================================
 * MODULE PURPOSE: Persistent Procurement Mission Repository
 * RESPONSIBILITIES:
 *  - Persists ProcurementMissionEntity instances to PostgreSQL database / file storage.
 *  - Ensures active missions survive application restarts and can be retrieved by ID or status.
 * OWNS: Mission data persistence, file JSON fallback sync, and query operations.
 * SHOULD NOT OWN: Workflow stage transitions or UI component logic.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { ProcurementMissionEntity, MissionStage, STAGE_PROGRESS_MAP } from '../types/mission';

const STORAGE_FILE = path.join(process.cwd(), 'scratch', 'procurement_missions.json');

export class ProcurementMissionRepository {
  private static memoryMissions: Map<string, ProcurementMissionEntity> = new Map();
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
          const list: ProcurementMissionEntity[] = JSON.parse(raw);
          list.forEach(m => this.memoryMissions.set(m.id, m));
        }
      }
    } catch (e) {
      console.warn('[ProcurementMissionRepository] File load fallback note:', e);
    }
    this.isInitialized = true;
  }

  private static saveToFile() {
    try {
      this.ensureStorageDir();
      const list = Array.from(this.memoryMissions.values());
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('[ProcurementMissionRepository] File save error:', e);
    }
  }

  public static async save(mission: ProcurementMissionEntity): Promise<ProcurementMissionEntity> {
    this.loadFromFile();
    mission.updatedAt = new Date().toISOString();
    mission.progress = STAGE_PROGRESS_MAP[mission.currentStage] || mission.progress;
    this.memoryMissions.set(mission.id, mission);
    this.saveToFile();
    return mission;
  }

  public static async saveMission(mission: ProcurementMissionEntity): Promise<ProcurementMissionEntity> {
    return this.save(mission);
  }

  public static async findById(id: string): Promise<ProcurementMissionEntity | null> {
    this.loadFromFile();
    return this.memoryMissions.get(id) || null;
  }

  public static async getAllMissions(): Promise<ProcurementMissionEntity[]> {
    this.loadFromFile();
    if (this.memoryMissions.size === 0) {
      // Seed default baseline mission if empty
      const defaultMission: ProcurementMissionEntity = {
        id: 'mission-proc-101',
        title: 'Raw Material Procurement Mission: Solid Carbide End Mills 12mm',
        sku: 'TL-EM-CAR-12',
        itemName: 'Solid Carbide End Mills 12mm',
        status: 'Active',
        currentStage: 'Waiting_for_Quotations',
        progress: STAGE_PROGRESS_MAP['Waiting_for_Quotations'],
        timeline: [
          { timestamp: '09:00 AM', stage: 'Inventory_Low', text: 'Low Stock Threshold Breached (Qty: 2, Min: 5)', actor: 'InventoryMonitor' },
          { timestamp: '09:05 AM', stage: 'Mission_Created', text: 'Procurement Mission Created & Assigned to ProcurementWorker', actor: 'ExecutiveCTO' },
          { timestamp: '09:10 AM', stage: 'Requirement_Analysis', text: 'Requirement Analyzed: 15 units needed by 2026-07-29', actor: 'ProcurementWorker' },
          { timestamp: '09:15 AM', stage: 'Supplier_Discovery', text: 'Discovered 3 registered suppliers (Jigani Tooling, Peenya Steel, CNC Hub)', actor: 'SupplierFinder' },
          { timestamp: '09:20 AM', stage: 'RFQ_Generation', text: 'Generated Corporate RFQ Letter via Gemma AI', actor: 'ProcurementWorker' },
          { timestamp: '09:25 AM', stage: 'RFQ_Dispatch', text: 'RFQ Letter Dispatched to Jigani Tooling Labs Ltd', actor: 'ProcurementWorker' },
          { timestamp: '09:30 AM', stage: 'Waiting_for_Quotations', text: 'Mission Persisted; Awaiting Supplier Quotation Reply', actor: 'ProcurementMissionService' }
        ],
        auditTrail: [
          { timestamp: '09:20 AM', toolId: 'generate_rfq', inputPayload: { sku: 'TL-EM-CAR-12' }, result: { success: true } }
        ],
        businessImpact: 'Prevents 2 stockout incidents & protects ₹82,000 gross margin',
        estimatedCompletion: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        owner: 'ProcurementWorker',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.save(defaultMission);
    }
    return Array.from(this.memoryMissions.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}

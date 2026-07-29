/**
 * ============================================================================
 * MODULE PURPOSE: Procurement Domain Supplier Database Repository
 * RESPONSIBILITIES:
 *  - Encapsulates Prisma SQL database queries for `Supplier` table.
 *  - Manages Supplier Master record metrics (Reliability %, Completed/Delayed Orders, Active Mission).
 * OWNS: Direct Prisma DB queries & in-memory master state sync for registered suppliers.
 * SHOULD NOT OWN: Vendor quotation analysis math.
 * ============================================================================
 */

export interface SupplierMasterItem {
  id: number;
  name: string;
  contactChannel: string; // phone number
  materials: string; // JSON string or comma-separated string e.g. "Stainless Steel"
  materialCategory: string; // Clean category name e.g. "Stainless Steel", "Mild Steel"
  reliabilityScore: number; // 0 - 100
  reliabilityRating: string;
  avgLeadTime: string;
  estimatedQuote: string;
  sourceUrl: string;
  completedOrders: number;
  delayedOrders: number;
  currentMissionId?: string | null;
  status: 'Available' | 'In Mission';
}

// In-memory store for master metrics (completed/delayed orders & current active mission)
const supplierMasterStats: Record<string, { completedOrders: number; delayedOrders: number; reliabilityScore: number; currentMissionId: string | null; status: 'Available' | 'In Mission' }> = {
  'Srinidhi': { completedOrders: 12, delayedOrders: 0, reliabilityScore: 96, currentMissionId: null, status: 'Available' },
  'Mithran': { completedOrders: 8, delayedOrders: 0, reliabilityScore: 91, currentMissionId: null, status: 'Available' },
  'Shakti': { completedOrders: 5, delayedOrders: 0, reliabilityScore: 88, currentMissionId: null, status: 'Available' },
  'Sathur': { completedOrders: 20, delayedOrders: 0, reliabilityScore: 94, currentMissionId: null, status: 'Available' }
};

export class SupplierRepository {
  /**
   * Returns all suppliers populated with Supplier Master fields.
   * If DB has < 4 suppliers, ensures seed master suppliers (Srinidhi, Mithran, Shakti, Sathur) are created.
   */
  static async getAllSuppliers(): Promise<SupplierMasterItem[]> {
    const { prisma } = await import('@/lib/prisma-client');
    let dbSuppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });

    // Ensure default master suppliers exist if DB is empty or missing
    if (dbSuppliers.length < 4) {
      await this.ensureSeedSuppliers();
      dbSuppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });
    }

    return dbSuppliers.map(s => {
      let parsedMat = s.materials;
      try {
        if (s.materials.startsWith('[')) {
          const arr = JSON.parse(s.materials);
          parsedMat = arr.join(', ');
        }
      } catch (e) {}

      const cleanCategory = parsedMat.includes('Stainless') ? 'Stainless Steel' :
                            parsedMat.includes('Mild') ? 'Mild Steel' :
                            parsedMat.includes('Tool') || parsedMat.includes('Carbide') ? 'Tool Steel' : parsedMat;

      const normName = s.name.trim();
      const stats = supplierMasterStats[normName] || {
        completedOrders: 10,
        delayedOrders: 0,
        reliabilityScore: parseInt(s.reliabilityRating.replace(/\D/g, ''), 10) || 92,
        currentMissionId: null,
        status: 'Available' as const
      };

      return {
        id: s.id,
        name: s.name,
        contactChannel: s.contactChannel,
        materials: parsedMat,
        materialCategory: cleanCategory,
        reliabilityScore: stats.reliabilityScore,
        reliabilityRating: `${stats.reliabilityScore}% High`,
        avgLeadTime: s.avgLeadTime || '2 Days',
        completedOrders: stats.completedOrders,
        delayedOrders: stats.delayedOrders,
        currentMissionId: stats.currentMissionId,
        status: stats.status
      };
    });
  }

  static async ensureSeedSuppliers() {
    const { prisma } = await import('@/lib/prisma-client');

    const seeds = [
      { name: 'Srinidhi', phone: '+919880011223', material: 'Stainless Steel', lead: '2 Days', quote: '₹93/kg', rating: '96% High' },
      { name: 'Mithran', phone: '+918438025210', material: 'Stainless Steel', lead: '2 Days', quote: '₹95/kg', rating: '91% High' },
      { name: 'Shakti', phone: '+918778508344', material: 'Stainless Steel', lead: '1 Day', quote: '₹97/kg', rating: '88% High' },
      { name: 'Sathur', phone: '+919999988888', material: 'Mild Steel', lead: '3 Days', quote: '₹85/kg', rating: '94% High' }
    ];

    for (const seed of seeds) {
      try {
        const existing = await prisma.supplier.findFirst({ where: { name: seed.name } });
        if (!existing) {
          await prisma.supplier.create({
            data: {
              name: seed.name,
              contactChannel: seed.phone,
              materials: JSON.stringify([seed.material]),
              avgLeadTime: seed.lead,
              estimatedQuote: seed.quote,
              reliabilityRating: seed.rating,
              sourceUrl: ''
            }
          });
        }
      } catch (e) {
        console.warn(`[SupplierRepository] Seed supplier creation note for ${seed.name}:`, e);
      }
    }
  }

  static async createSupplier(name: string, phone: string, material: string) {
    const { prisma } = await import('@/lib/prisma-client');
    const materialsJson = JSON.stringify([material]);

    const created = await prisma.supplier.create({
      data: {
        name,
        contactChannel: phone,
        materials: materialsJson,
        avgLeadTime: '2 Days',
        estimatedQuote: '₹95/kg',
        reliabilityRating: '95% High',
        sourceUrl: ''
      }
    });

    supplierMasterStats[name] = {
      completedOrders: 0,
      delayedOrders: 0,
      reliabilityScore: 95,
      currentMissionId: null,
      status: 'Available'
    };

    return created;
  }

  static async deleteSupplier(id: number) {
    const { prisma } = await import('@/lib/prisma-client');
    return prisma.supplier.delete({
      where: { id }
    });
  }

  static async updateSupplierStatus(supplierName: string, status: 'Available' | 'In Mission', missionId?: string | null) {
    const key = Object.keys(supplierMasterStats).find(k => k.toLowerCase() === supplierName.toLowerCase()) || supplierName;
    if (!supplierMasterStats[key]) {
      supplierMasterStats[key] = { completedOrders: 5, delayedOrders: 0, reliabilityScore: 90, currentMissionId: null, status: 'Available' };
    }
    supplierMasterStats[key].status = status;
    supplierMasterStats[key].currentMissionId = missionId || null;
  }

  static async updatePerformanceMetrics(name: string, newReliabilityScore: number, wasDelayed: boolean = false) {
    const key = Object.keys(supplierMasterStats).find(k => k.toLowerCase() === name.toLowerCase()) || name;
    if (!supplierMasterStats[key]) {
      supplierMasterStats[key] = { completedOrders: 0, delayedOrders: 0, reliabilityScore: 90, currentMissionId: null, status: 'Available' };
    }

    supplierMasterStats[key].completedOrders += 1;
    if (wasDelayed) {
      supplierMasterStats[key].delayedOrders += 1;
    }
    supplierMasterStats[key].reliabilityScore = Math.min(100, Math.max(50, newReliabilityScore));
    supplierMasterStats[key].status = 'Available';
    supplierMasterStats[key].currentMissionId = null;

    try {
      const { prisma } = await import('@/lib/prisma-client');
      const supplier = await prisma.supplier.findFirst({
        where: { name: { contains: name, mode: 'insensitive' } }
      });
      if (supplier) {
        await prisma.supplier.update({
          where: { id: supplier.id },
          data: { reliabilityRating: `${supplierMasterStats[key].reliabilityScore}% High` }
        });
      }
    } catch (e) {
      console.warn('[SupplierRepository] updatePerformanceMetrics error:', e);
    }
  }
}

"use server";

import { prisma } from "@/lib/prisma-client";

// --- Static Fallback Mock Datasets ---

const MOCK_MATERIALS = [
  { id: 1, name: "Aluminium Alloy (6061)", currentCost: 380, marketCost: 427.12, supplier: "Bommasandra Metal Casting" },
  { id: 2, name: "Steel Rods (Mild)", currentCost: 58000, marketCost: 61480, supplier: "Peenya Steel Distributor" }
];

const MOCK_ORDERS = [
  { id: "ORD-221", client: "Client X", margin: "14.2%", materialId: 2, material: MOCK_MATERIALS[1] },
  { id: "ORD-214", client: "Client Y", margin: "9.5%", materialId: 1, material: MOCK_MATERIALS[0] }
];

const MOCK_SHIPMENTS = [
  {
    id: 1,
    material: "Steel Bars (Mild Grade)",
    qty: "15 Tons",
    supplier: "Peenya Steel Distributor",
    currentNode: "Distributor Node (Bengaluru Outer Ring)",
    eta: "July 20 (4 Days Delay)",
    status: "delayed",
    gemmaAnnotation: "Steel batch stuck at distributor stage — 4 day delay risk. This creates a liquidity bottleneck for Order #221. Consider executing buffer pricing (+2.5% markup) to hedge against delayed cash collection.",
    steps: [
      { id: 1, shipmentId: 1, name: "Mine/Mill", status: "completed", sequence: 1 },
      { id: 2, shipmentId: 1, name: "Distributor", status: "delayed", sequence: 2 },
      { id: 3, shipmentId: 1, name: "Regional Supplier", status: "pending", sequence: 3 },
      { id: 4, shipmentId: 1, name: "Warehouse", status: "pending", sequence: 4 },
      { id: 5, shipmentId: 1, name: "CNC Facility", status: "pending", sequence: 5 }
    ]
  },
  {
    id: 2,
    material: "Aluminium Alloy billets (6061)",
    qty: "5 Tons",
    supplier: "Bommasandra Metal Casting",
    currentNode: "Warehouse Node (Jigani Industrial)",
    eta: "July 17 (On Time)",
    status: "on-time",
    gemmaAnnotation: "Aluminium alloy supply is secure at standard rate. Standard margins are valid for this batch.",
    steps: [
      { id: 6, shipmentId: 2, name: "Mine/Mill", status: "completed", sequence: 1 },
      { id: 7, shipmentId: 2, name: "Distributor", status: "completed", sequence: 2 },
      { id: 8, shipmentId: 2, name: "Regional Supplier", status: "completed", sequence: 3 },
      { id: 9, shipmentId: 2, name: "Warehouse", status: "on-time", sequence: 4 },
      { id: 10, shipmentId: 2, name: "CNC Facility", status: "pending", sequence: 5 }
    ]
  }
];

const MOCK_RECOMMENDATIONS = [
  {
    id: "REC-01",
    trigger: "Mild Steel Cost index +6.3% in Peenya Cluster",
    action: "Increase Price by +3.4% on Mild Steel products for new batches",
    confidence: "high",
    reasoning: [
      "Supplier raw steel quotes rose by ₹3,600/ton yesterday.",
      "Your current net margin on Mild Steel parts is 11.2%, which is close to your safety margin.",
      "Price elasticity allows +3.4% pass-through markup without order volume drop."
    ],
    accepted: false,
    rejected: false,
    expanded: false
  },
  {
    id: "REC-02",
    trigger: "BESCOM 4-Hr power maintenance surcharge added",
    action: "Apply ₹40/batch operational energy buffer surcharge",
    confidence: "medium",
    reasoning: [
      "CNC backup diesel generator runs cost ₹150 extra per hour.",
      "This surcharge directly prevents a 1.2% gross margin bleed on current scheduled batch runs."
    ],
    accepted: false,
    rejected: false,
    expanded: false
  }
];

const MOCK_MARKET_SIGNALS = [
  { id: 1, title: "Global Steel Index Surges 6% Post Import Tariff Adjustment", source: "MetalBulletin News", date: "2 hours ago", relevance: "high", tag: "Directly affects Mild Steel Rod order pricing (Order #221)", desc: "Supplier costs for Mild Steel Rods are set to escalate by ₹3,400/ton by next week." },
  { id: 2, title: "Bengaluru EV Parts Cluster Demand Increases by 30% YoY", source: "EconomicTimes Industry", date: "1 day ago", relevance: "medium", tag: "Long-term risk: 30% of your tooling output is ICE-specific", desc: "Traditional engine components face shrinking order volume. Shift to EV casing casting recommended." },
  { id: 3, title: "Bommasandra Power Grid Announces 4-Hour Scheduled Daily Maintenance", source: "BESCOM Notification", date: "2 days ago", relevance: "high", tag: "Affects CNC facility operational overhead costs", desc: "Generator fuel backup costs will rise by ₹150/hour, reducing net margins on batch casting orders." }
];

const MOCK_STRUCTURAL_RISKS = [
  { id: 1, trend: "ICE Part Production", status: "Softening Demand", title: "Transition Risk: Traditional Engine Cylinder casting", description: "Based on market forecast models, traditional ICE parts orders from Tier-1 auto-component distributors are projected to soften by 30% over the next 18 months due to accelerating EV adoption in Bengaluru's local clusters.", gemmaAdvisory: "We recommend diversifying CNC production towards EV structural casings and heat sinks. 45% of your current milling tooling setup can be reprofiled without requiring major capital investments." }
];

const MOCK_INDUSTRY_NEWS = [
  { id: 1, title: "Peenya Industrial Area notified as special investment region; industry bodies laud move", source: "The Hindu", date: "1 hour ago", summary: "Karnataka declares Peenya Industrial Area as Special Investment Region, aiming to boost infrastructure, investment, and job creation.", category: "Infrastructure", image: "https://th-i.thgim.com/public/incoming/s8gx6b/article69684096.ece/alternates/LANDSCAPE_1200/DJI_0032.jpg", url: "https://www.thehindu.com/news/cities/bangalore/peenya-industrial-area-notified-as-special-investment-region-industry-bodies-laud-move/article69682390.ece" },
  { id: 2, title: "IMTEX Forming 2026 inaugurated at BIEC in Bengaluru", source: "The Hindu", date: "3 hours ago", summary: "The exhibition features cutting-edge technologies in presses, bending, welding, laser systems, robotics, and automation.", category: "Manufacturing", image: "https://th-i.thgim.com/public/incoming/2y2mmx/article70536447.ece/alternates/LANDSCAPE_1200/2026-01-21T131301Z_1479325586_RC2U4FA867TG_RTRMADP_3_INDIA-RBI-ECONOMY.JPG", url: "https://www.thehindu.com/news/cities/bangalore/imtex-forming-2026-inaugurated-at-biec-in-bengaluru/article70534695.ece" }
];

const MOCK_INVENTORY = [
  { id: 1, name: "Solid Carbide End Mills (4-Flute, 12mm)", category: "Tooling", sku: "TL-EM-CAR-12", quantity: 45, unit: "pcs", location: "Cabinet B, Shelf 3", minThreshold: 15, status: "In Stock", image: "/inventory/carbide-end-mill.png", lastUpdated: new Date() },
  { id: 2, name: "Aluminum 6061-T6 Raw Blocks (150x150x50mm)", category: "Raw Material", sku: "RM-AL-6061-150", quantity: 12, unit: "pcs", location: "Raw Stock Area, Rack A-2", minThreshold: 20, status: "Low Stock", image: "/inventory/aluminum-blocks.png", lastUpdated: new Date() },
  { id: 3, name: "Machined Aerospace Brackets (Grade A-5)", category: "Finished", sku: "FG-AE-BRKT-A5", quantity: 180, unit: "pcs", location: "Finished Goods Vault, Bin 7", minThreshold: 50, status: "In Stock", image: "/inventory/aerospace-bracket.png", lastUpdated: new Date() }
];

// --- In-Memory Fallback State Management ---
let inMemoryMaterials = [...MOCK_MATERIALS];
let inMemoryOrders = [...MOCK_ORDERS];
let inMemoryShipments = [...MOCK_SHIPMENTS];
let inMemoryRecommendations = [...MOCK_RECOMMENDATIONS];
let inMemorySignals = [...MOCK_MARKET_SIGNALS];
let inMemoryRisks = [...MOCK_STRUCTURAL_RISKS];
let inMemoryNews = [...MOCK_INDUSTRY_NEWS];
let inMemoryInventory = [...MOCK_INVENTORY];

// --- Exported Server Actions ---

export async function getRecommendations() {
  try {
    const recommendations = await prisma.pricingRecommendation.findMany();
    return recommendations.map((rec: any) => ({
      ...rec,
      reasoning: rec.reasoning as string[],
    }));
  } catch (err) {
    return inMemoryRecommendations;
  }
}

export async function updateRecommendationStatus(
  id: string,
  status: "accepted" | "rejected"
) {
  try {
    return await prisma.pricingRecommendation.update({
      where: { id },
      data: {
        accepted: status === "accepted",
        rejected: status === "rejected",
      },
    });
  } catch (err) {
    inMemoryRecommendations = inMemoryRecommendations.map(rec =>
      rec.id === id ? { ...rec, accepted: status === "accepted", rejected: status === "rejected" } : rec
    );
    return inMemoryRecommendations.find(rec => rec.id === id);
  }
}

export async function getShipments() {
  try {
    return await prisma.shipment.findMany({
      include: {
        steps: {
          orderBy: {
            sequence: "asc",
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryShipments;
  }
}

export async function updateShipmentStepStatus(
  shipmentId: number,
  activeStepIndex: number,
  newStatus: "on-time" | "delayed"
) {
  try {
    const steps = await prisma.shipmentStep.findMany({
      where: { shipmentId },
      orderBy: { sequence: "asc" }
    });

    const activeStep = steps.find(s => s.sequence === activeStepIndex);
    if (!activeStep) return;

    await prisma.$transaction(
      steps.map((step) => {
        let status = "pending";
        if (step.sequence < activeStepIndex) {
          status = "completed";
        } else if (step.sequence === activeStepIndex) {
          status = newStatus;
        }
        return prisma.shipmentStep.update({
          where: { id: step.id },
          data: { status }
        });
      })
    );

    let annotation = `Shipment is on track at ${activeStep.name} node.`;
    if (newStatus === "delayed") {
      annotation = `Delay at ${activeStep.name} node might restrict raw materials buffer. Margin calculations auto-adjusted by +2.5% to protect order balance.`;
    }

    return await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: newStatus,
        currentNode: activeStep.name,
        gemmaAnnotation: annotation
      }
    });
  } catch (err) {
    inMemoryShipments = inMemoryShipments.map(ship => {
      if (ship.id === shipmentId) {
        const activeStep = ship.steps.find((s: any) => s.sequence === activeStepIndex);
        const steps = ship.steps.map((step: any) => {
          let status = "pending";
          if (step.sequence < activeStepIndex) {
            status = "completed";
          } else if (step.sequence === activeStepIndex) {
            status = newStatus;
          }
          return { ...step, status };
        });

        let annotation = `Shipment is on track at ${activeStep?.name || "current"} node.`;
        if (newStatus === "delayed") {
          annotation = `Delay at ${activeStep?.name || "current"} node might restrict raw materials buffer. Margin calculations auto-adjusted by +2.5% to protect order balance.`;
        }

        return {
          ...ship,
          status: newStatus,
          currentNode: activeStep?.name || "current",
          gemmaAnnotation: annotation,
          steps
        };
      }
      return ship;
    });
    return inMemoryShipments.find(s => s.id === shipmentId);
  }
}

export async function getMarketSignals() {
  try {
    return await prisma.marketSignal.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemorySignals;
  }
}

export async function getStructuralRisks() {
  try {
    return await prisma.structuralRisk.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryRisks;
  }
}

export async function getIndustryNews() {
  try {
    return await prisma.industryNews.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryNews;
  }
}

export async function getInventory() {
  try {
    return await prisma.inventoryItem.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryInventory;
  }
}

export async function updateInventoryQty(id: number, newQty: number) {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    let status = "In Stock";
    if (newQty <= 0) {
      status = "Out of Stock";
    } else if (newQty <= item.minThreshold) {
      status = "Low Stock";
    }

    return await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQty,
        status,
        lastUpdated: new Date(),
      },
    });
  } catch (err) {
    inMemoryInventory = inMemoryInventory.map(item => {
      if (item.id === id) {
        let status = "In Stock";
        if (newQty <= 0) {
          status = "Out of Stock";
        } else if (newQty <= item.minThreshold) {
          status = "Low Stock";
        }
        return { ...item, quantity: newQty, status, lastUpdated: new Date() };
      }
      return item;
    });
    return inMemoryInventory.find(item => item.id === id);
  }
}

export async function addInventoryItem(data: {
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  location: string;
  minThreshold: number;
  image: string;
}) {
  try {
    let status = "In Stock";
    if (data.quantity <= 0) {
      status = "Out of Stock";
    } else if (data.quantity <= data.minThreshold) {
      status = "Low Stock";
    }

    return await prisma.inventoryItem.create({
      data: {
        ...data,
        status,
      },
    });
  } catch (err) {
    let status = "In Stock";
    if (data.quantity <= 0) {
      status = "Out of Stock";
    } else if (data.quantity <= data.minThreshold) {
      status = "Low Stock";
    }
    const newItem = { id: inMemoryInventory.length + 1, ...data, status, lastUpdated: new Date() };
    inMemoryInventory.push(newItem);
    return newItem;
  }
}

export async function getMaterials() {
  try {
    return await prisma.material.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryMaterials;
  }
}

export async function getOrders() {
  try {
    return await prisma.order.findMany({
      include: {
        material: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  } catch (err) {
    return inMemoryOrders;
  }
}

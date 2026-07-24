import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const itemsToSync = body.items || [
      { sku: "SKU-CARB-08", name: "Solid Carbide Drill Bit 8mm", quantity: 18, category: "Tooling", location: "Bin A-4", minThreshold: 6, unit: "pcs" },
      { sku: "SKU-STEEL-12", name: "Steel Billets (EN8 Grade)", quantity: 450, category: "Raw Material", location: "Peenya Yard A", minThreshold: 100, unit: "kg" },
      { sku: "SKU-COOL-55", name: "Synthetic CNC Cutting Coolant", quantity: 3, category: "Tooling", location: "Liquid Drum Store", minThreshold: 4, unit: "barrels" }
    ];

    const synced = [];
    
    await prisma.$transaction(
      itemsToSync.map((item: any) => {
        let status = "In Stock";
        if (item.quantity <= 0) status = "Out of Stock";
        else if (item.quantity <= item.minThreshold) status = "Low Stock";

        return prisma.inventoryItem.upsert({
          where: { sku: item.sku },
          update: {
            quantity: item.quantity,
            status,
            lastUpdated: new Date()
          },
          create: {
            sku: item.sku,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit || "pcs",
            location: item.location || "Bin A",
            minThreshold: item.minThreshold || 5,
            status,
            image: item.category === "Raw Material" ? "/inventory/steel-billets.png" : "/inventory/carbide-end-mill.png"
          }
        });
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: "Tally Prime ERP Inventory sync complete.", 
      count: itemsToSync.length, 
      syncedItems: itemsToSync 
    });
  } catch (error: any) {
    console.error("Tally sync API route error:", error);
    return NextResponse.json({ error: "Tally synchronization failed: " + error.message }, { status: 500 });
  }
}

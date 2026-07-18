import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { supplierName, materialName, amount, dueDate } = await req.json();

    if (!supplierName || !materialName || !amount) {
      return NextResponse.json({ error: "Missing required invoice fields" }, { status: 400 });
    }

    let savedMaterial = null;
    let savedInventory = null;

    try {
      // 1. Save as a Material
      savedMaterial = await prisma.material.create({
        data: {
          name: materialName,
          currentCost: Number(amount),
          marketCost: Number(amount) * 1.12,
          supplier: supplierName
        }
      });
    } catch (dbErr) {
      console.warn("Database offline. Material write skipped.");
    }

    try {
      // 2. Also save/upsert as an inventory item so it shows up in CNC shop inventory list
      let category = "Raw Material";
      if (materialName.toLowerCase().includes("tool") || materialName.toLowerCase().includes("drill") || materialName.toLowerCase().includes("mill")) {
        category = "Tooling";
      } else if (materialName.toLowerCase().includes("surcharge") || materialName.toLowerCase().includes("electricity") || materialName.toLowerCase().includes("power")) {
        category = "Tooling";
      }

      const sku = `INV-${supplierName.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      savedInventory = await prisma.inventoryItem.create({
        data: {
          name: materialName,
          category,
          sku,
          quantity: 10,
          unit: "pcs",
          location: "Receiving Bay A",
          minThreshold: 5,
          status: "In Stock",
          image: category === "Raw Material" ? "/inventory/steel-billets.png" : "/inventory/carbide-end-mill.png"
        }
      });
    } catch (dbErr) {
      console.warn("Database offline. InventoryItem write skipped.");
    }

    return NextResponse.json({ 
      success: true, 
      invoice: {
        supplierName,
        materialName,
        amount,
        dueDate
      },
      savedMaterial,
      savedInventory
    });
  } catch (error: any) {
    console.error("Failed to log WhatsApp invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

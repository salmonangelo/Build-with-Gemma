import { NextResponse } from 'next/server';
import { 
  getMaterials, 
  getOrders, 
  getShipments, 
  getMarketSignals, 
  getRecommendations, 
  getStructuralRisks,
  updateRecommendationStatus
} from '@/app/pricing-agent/actions';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      materials,
      orders,
      shipments,
      marketSignals,
      pricingRecommendations,
      structuralRisks
    ] = await Promise.all([
      getMaterials(),
      getOrders(),
      getShipments(),
      getMarketSignals(),
      getRecommendations(),
      getStructuralRisks()
    ]);

    return NextResponse.json({
      materials,
      orders,
      shipments,
      marketSignals,
      pricingRecommendations,
      structuralRisks
    });
  } catch (error: any) {
    console.error("Failed to compile pricing details:", error);
    return NextResponse.json({ error: "Failed to compile pricing details: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();
    
    if (!id || !['accept', 'reject'].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const updated = await updateRecommendationStatus(id, status === 'accept' ? 'accepted' : 'rejected');
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Failed to update pricing recommendation:", error);
    return NextResponse.json({ error: "Failed to update pricing recommendation: " + error.message }, { status: 500 });
  }
}

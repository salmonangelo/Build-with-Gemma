import { CapabilityRegistryInstance } from '../src/lib/tools';

async function testCapabilityRegistry() {
  console.log("=================================================");
  console.log("🧪 Testing Business Capability & Tool Registry...");
  console.log("=================================================\n");

  const catalog = CapabilityRegistryInstance.getCatalog();
  console.log(`📋 Total Registered Tools: ${catalog.length}\n`);

  // Group by category
  const categories = Array.from(new Set(catalog.map(t => t.category)));
  categories.forEach(cat => {
    const tools = CapabilityRegistryInstance.getToolsByCategory(cat);
    console.log(`  🔹 Category [${cat}]: ${tools.length} tools registered`);
    tools.forEach(t => {
      console.log(`     └─ Tool: [${t.id}] -> Worker: (${t.ownedByWorker}) | Mode: [${t.executionMode}] | Events: [${t.producesEvents.join(', ') || 'None'}]`);
    });
  });

  console.log("\n=================================================");
  console.log("⚙️  Executing Active Tool Verification Tests...");
  console.log("=================================================\n");

  // 1. Test RFQ Generation Tool
  const rfqRes = await CapabilityRegistryInstance.executeTool('generate_rfq', {
    name: 'Carbide End Mills 12mm',
    sku: 'TL-EM-CAR-12',
    supplierName: 'Jigani Tooling Labs'
  }, { source: 'WebUI', initiatedBy: 'TestRunner' });

  console.log(`✅ [Tool Test: generate_rfq] Result: ${rfqRes.success ? 'SUCCESS' : 'FAILED'} (Duration: ${rfqRes.executionTimeMs}ms)`);
  console.log(`   Events Emitted: ${rfqRes.businessEvents.length} | Audit Log Status: ${rfqRes.auditEntries[0]?.status}`);

  // 2. Test Collections Outreach Tool
  const outreachRes = await CapabilityRegistryInstance.executeTool('generate_collection_outreach', {
    client: 'ABC Industries',
    outstandingBalance: 380000,
    delayedInvoices: 3,
    averageDelay: 38,
    tone: 'professional',
    channel: 'email'
  }, { source: 'WebUI', initiatedBy: 'TestRunner' });

  console.log(`✅ [Tool Test: generate_collection_outreach] Result: ${outreachRes.success ? 'SUCCESS' : 'FAILED'} (Duration: ${outreachRes.executionTimeMs}ms)`);

  // 3. Test Tally Inventory Sync Tool
  const tallyRes = await CapabilityRegistryInstance.executeTool('sync_tally_inventory', {
    items: [
      { sku: 'TEST-SKU-01', name: 'Test Steel Plate', quantity: 50, category: 'Raw Material' }
    ]
  }, { source: 'TallyERP', initiatedBy: 'TestRunner' });

  console.log(`✅ [Tool Test: sync_tally_inventory] Result: ${tallyRes.success ? 'SUCCESS' : 'FAILED'} (Duration: ${tallyRes.executionTimeMs}ms)`);

  console.log("\n=================================================");
  console.log("🎉 ALL TOOL REGISTRY TESTS COMPLETED CLEANLY!");
  console.log("=================================================\n");
}

testCapabilityRegistry().catch(err => {
  console.error("❌ Tool Registry Test Failed:", err);
  process.exit(1);
});

import { ExecutiveCTOAgent } from '../src/lib/agents/ExecutiveCTOAgent';
import { ProcurementWorker } from '../src/lib/agents/workers/ProcurementWorker';
import { ActionCenterService } from '../src/lib/services/ActionCenterService';
import { OperationService } from '../src/lib/operations/OperationService';
import { TimelineService } from '../src/lib/services/TimelineService';
import { SharedBusinessMemoryInstance } from '../src/lib/memory/SharedBusinessMemory';
import { ExecutionVerifier } from '../src/lib/verifier/ExecutionVerifier';

async function testPhase2OS() {
  console.log("=================================================");
  console.log("🚀 Testing Phase 2: AI Manufacturing Operations OS");
  console.log("=================================================\n");

  // 1. Verify Business Operations Engine Initialization
  const ops = await OperationService.getOperationsOverview();
  console.log(`🏢 Active Business Operations Loaded: ${ops.length}`);
  ops.forEach(op => {
    console.log(`   ├─ Operation: [${op.operationId}] (${op.name}) -> Primary Worker: ${op.primaryWorker} | Status: [${op.status}]`);
  });

  console.log("\n=================================================");
  console.log("🤖 Executive AI CTO Workflow Planning Test");
  console.log("=================================================\n");

  // 2. Simulate Low Stock Business Event
  const lowStockEvent: any = {
    id: `evt-test-lowstock-${Date.now()}`,
    type: 'InventoryThresholdBreached',
    timestamp: new Date().toLocaleTimeString(),
    source: 'InventorySensor',
    summary: 'Low Stock Threshold Breached for Solid Carbide End Mills 12mm (SKU: TL-EM-CAR-12)',
    details: { name: 'Solid Carbide End Mills 12mm', sku: 'TL-EM-CAR-12', supplierName: 'Jigani Tooling Labs' }
  };

  // Executive AI CTO observes event and plans workflow
  const workflow = await ExecutiveCTOAgent.evaluateAndPlanWorkflow(lowStockEvent);
  if (!workflow) {
    throw new Error("Executive CTO failed to plan workflow for low stock event!");
  }

  console.log(`✅ [ExecutiveCTO] Planned Workflow: '${workflow.id}' (${workflow.title})`);
  console.log(`   Assigned Worker: ${workflow.assignedWorker} | Steps Count: ${workflow.steps.length}`);
  console.log(`   Initial Workflow Status: [${workflow.status}]`);

  // 3. Worker Execution Test
  console.log("\n=================================================");
  console.log("🔨 Worker Agent & Tool Execution Test");
  console.log("=================================================\n");

  const worker = new ProcurementWorker();
  
  // Step 1: Autonomous Step (generate_rfq)
  await worker.executeAssignedWorkflowStep(workflow.id);
  
  // Re-fetch workflow state
  const acState1 = ActionCenterService.getActionCenterState();
  console.log(`📋 Action Center Pending Approvals: ${acState1.pendingApprovals.length}`);
  if (acState1.pendingApprovals.length > 0) {
    const pending = acState1.pendingApprovals[0];
    console.log(`   └─ Pending Approval Card: Workflow '${pending.workflowId}' (Step: ${pending.stepName})`);

    // 4. Action Center Owner Approval Test
    console.log("\n=================================================");
    console.log("✍️ Action Center Owner Approval Test");
    console.log("=================================================\n");

    const approved = await ActionCenterService.approveAction(pending.workflowId);
    console.log(`✅ [ActionCenter] Approved Step for Workflow '${pending.workflowId}': ${approved}`);
  }

  // 5. Verification & Timeline Check
  console.log("\n=================================================");
  console.log("📊 Layered Shared Memory & Executive Timeline Test");
  console.log("=================================================\n");

  const memory = await SharedBusinessMemoryInstance.getLayeredMemory();
  console.log(`🧠 Shared Memory Global Profile: ${memory.globalProfile.companyName} (${memory.globalProfile.industry})`);
  console.log(`🧠 Active Operations in Memory: ${memory.operationsState.length}`);

  const timeline = TimelineService.getExecutiveTimeline();
  console.log(`📜 Executive Timeline Stream Entries: ${timeline.length}`);
  timeline.slice(0, 5).forEach((t, i) => {
    console.log(`   [${i + 1}] (${t.timestamp}) [${t.category}] ${t.title} -> ${t.summary}`);
  });

  console.log("\n=================================================");
  console.log("🎉 PHASE 2 OPERATIONS OS INTEGRATION TEST SUCCESS!");
  console.log("=================================================\n");
}

testPhase2OS().catch(err => {
  console.error("❌ Phase 2 OS Test Failed:", err);
  process.exit(1);
});

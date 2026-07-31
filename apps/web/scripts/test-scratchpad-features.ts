import { CapabilityRegistryInstance } from '../src/lib/tools';
import { OperationService } from '../src/lib/operations/OperationService';
import { WorkflowEngine } from '../src/lib/workflows/WorkflowEngine';
import { ActionCenterService } from '../src/lib/services/ActionCenterService';
import { TimelineService } from '../src/lib/services/TimelineService';
import { TaskService } from '../src/lib/services/TaskService';
import { BusinessStoryEngine } from '../src/lib/story/BusinessStoryEngine';
import { ExecutiveDemoSimulator } from '../src/lib/demo/ExecutiveDemoSimulator';
import { ProcurementWorker } from '../src/lib/agents/workers/ProcurementWorker';
import { PricingWorker } from '../src/lib/agents/workers/PricingWorker';
import { RevenueWorker } from '../src/lib/agents/workers/RevenueWorker';
import { CollectionsWorker } from '../src/lib/agents/workers/CollectionsWorker';
import { ExecutiveCTOAgent } from '../src/lib/agents/ExecutiveCTOAgent';

async function runComprehensiveScratchpadTest() {
  console.log("=================================================");
  console.log("🚀 COMPREHENSIVE SCRATCHPAD INTEGRATION TEST RUN");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${name}${details ? ` -> ${details}` : ''}`);
    } else {
      console.error(`❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
    }
  }

  // 1. Tool Registry Audit (43 Tools)
  console.log("--- 1. Business Capability Tool Registry Audit ---");
  const registeredTools = CapabilityRegistryInstance.getCatalog();
  assertTest("Capability Tool Registry Count", registeredTools.length >= 40, `Found ${registeredTools.length} registered tools`);

  // 2. Business Operations Hub
  console.log("\n--- 2. Business Operations Engine Audit ---");
  const overview = await OperationService.getOperationsOverview();
  assertTest("Operations Hub Overview Count", overview.length === 8, `Loaded ${overview.length} active business operations`);

  // 3. Workflow Engine & DAGs
  console.log("\n--- 3. Workflow Engine & DAG Execution ---");
  const testWf = await WorkflowEngine.createWorkflow({
    title: "Integration Test Procurement DAG",
    operationId: "procurement",
    assignedWorker: "ProcurementWorker",
    steps: [
      {
        sequence: 1,
        name: "Generate Supplier RFQ",
        toolId: "generate_rfq",
        inputPayload: { name: "Carbide Drill Bit 12mm", sku: "TL-DRILL-12", quantity: 50 },
        executionMode: "Autonomous"
      },
      {
        sequence: 2,
        name: "Owner Approval Gate",
        toolId: "generate_rfq",
        inputPayload: { name: "Carbide Drill Bit 12mm", sku: "TL-DRILL-12" },
        executionMode: "Approval_Required"
      }
    ]
  });
  assertTest("Workflow Instance Creation", !!testWf.id, `Created Workflow ID: ${testWf.id}`);

  // Step 1 Execution
  const step1Result = await WorkflowEngine.advanceWorkflow(testWf.id);
  assertTest("Automated Step 1 Execution", !!step1Result, `Step 1 status: ${step1Result.status}`);

  // Pending Approval Gate Check
  const actionState = ActionCenterService.getActionCenterState();
  assertTest("Action Center Operational State Retrieval", Array.isArray(actionState.pendingApprovals), `Action center active`);

  // 4. Domain Worker Agents
  console.log("\n--- 4. Domain Worker Agents Audit ---");
  const procWorker = new ProcurementWorker();
  const pricingWorker = new PricingWorker();
  const revWorker = new RevenueWorker();
  const collWorker = new CollectionsWorker();
  const ctoAgent = new ExecutiveCTOAgent();

  assertTest("Procurement Worker Role", procWorker.workerType === 'ProcurementManager');
  assertTest("Pricing Worker Role", pricingWorker.workerType === 'PricingManager');
  assertTest("Revenue Worker Role", revWorker.workerType === 'RevenueManager');
  assertTest("Collections Worker Role", collWorker.workerType === 'CollectionsManager');
  assertTest("Executive CTO Agent Instance", !!ctoAgent, `Executive CTO instance initialized`);

  // 5. Timeline & Task Services
  console.log("\n--- 5. Services Audit ---");
  const timeline = TimelineService.getExecutiveTimeline();
  assertTest("Executive Timeline Feed Stream", Array.isArray(timeline), `Loaded ${timeline.length} timeline events`);

  const tasks = TaskService.getActiveTasks();
  assertTest("Task Management Service", Array.isArray(tasks), `Loaded ${tasks.length} task instances`);

  // 6. Business Story Engine
  console.log("\n--- 6. Business Story Engine Audit ---");
  const stories = BusinessStoryEngine.generateStories();
  assertTest("Business Story Engine Narrative Generation", Array.isArray(stories), `Generated ${stories.length} business stories`);

  // 7. Executive Demo Simulator
  console.log("\n--- 7. Startup Pitch Demo Simulator Audit ---");
  let demoSuccess = false;
  try {
    await ExecutiveDemoSimulator.runDemoSimulation();
    demoSuccess = true;
  } catch (e: any) {
    console.error("Demo simulation error:", e.message);
  }
  assertTest("120-Second Pitch Demo Simulation Execution", demoSuccess, `Demo run completed cleanly`);

  // Final Test Results Summary
  console.log("\n=================================================");
  console.log(`🎉 SCRATCHPAD INTEGRATION VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================\n");
}

runComprehensiveScratchpadTest().catch(console.error);

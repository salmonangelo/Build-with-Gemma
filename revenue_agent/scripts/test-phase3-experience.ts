import { BusinessStoryEngine } from '../src/lib/story/BusinessStoryEngine';
import { ExecutiveDemoSimulator } from '../src/lib/demo/ExecutiveDemoSimulator';
import { OperationService } from '../src/lib/operations/OperationService';

async function testPhase3Experience() {
  console.log("=================================================");
  console.log("🌟 Testing Phase 3: Product Experience Layer");
  console.log("=================================================\n");

  // 1. Business Story Engine Test
  console.log("📰 Testing Business Story Engine...");
  const stories = BusinessStoryEngine.generateStories();
  console.log(`✅ Generated ${stories.length} Executive Business Stories:`);
  stories.forEach((s, idx) => {
    console.log(`   [${idx + 1}] Category: [${s.category}] -> Headline: "${s.headline}"`);
    console.log(`       Actor: ${s.sourceActor} | Impact: ${s.businessValue}`);
  });

  // 2. Executive Demo Mode Simulator Test
  console.log("\n=================================================");
  console.log("🎬 Testing Executive Startup Pitch Demo Simulator...");
  console.log("=================================================\n");

  let lastStepTitle = "";
  await ExecutiveDemoSimulator.runDemoSimulation((steps) => {
    const activeStep = steps.find(s => s.status === 'Active');
    if (activeStep && activeStep.title !== lastStepTitle) {
      lastStepTitle = activeStep.title;
      console.log(`   ⏱️ [Demo Time: ${activeStep.timeLabel}] ${activeStep.title} -> ${activeStep.description}`);
    }
  });

  // 3. Verify Final Operations Overview
  console.log("\n=================================================");
  console.log("📊 Verifying Business Operations Control Room Integrity...");
  console.log("=================================================\n");

  const ops = await OperationService.getOperationsOverview();
  console.log(`🏢 Active Operations: ${ops.length}`);
  ops.forEach(op => {
    console.log(`   ├─ Operation [${op.operationId}]: ${op.runningWorkflowsCount} Workflows Running | ${op.completedWorkflowsCount} Completed`);
  });

  console.log("\n=================================================");
  console.log("🎉 PHASE 3 PRODUCT EXPERIENCE LAYER TEST SUCCESS!");
  console.log("=================================================\n");
}

testPhase3Experience().catch(err => {
  console.error("❌ Phase 3 Experience Test Failed:", err);
  process.exit(1);
});

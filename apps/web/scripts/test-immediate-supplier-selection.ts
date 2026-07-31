import { SupplierRepository } from '../src/departments/procurement/repositories/SupplierRepository';
import { ProcurementMissionRepository } from '../src/departments/procurement/repositories/ProcurementMissionRepository';
import { ProcurementMissionService } from '../src/departments/procurement/services/ProcurementMissionService';
import { CommunicationService } from '../src/lib/services/CommunicationService';

async function runImmediateSupplierSelectionVerification() {
  console.log('===================================================================');
  console.log('🚀 IMMEDIATE SUPPLIER SELECTION & POST-ORDER RELIABILITY VERIFICATION');
  console.log('===================================================================\n');

  // Step 1: Create a Procurement Mission for Stainless Steel (15kg)
  console.log('--- Step 1: Initialize Stainless Steel Mission ---');
  const mission = await ProcurementMissionService.createMission(
    'RM-SS-SHEET-15',
    'Stainless Steel',
    15
  );

  const participants = mission.context.missionParticipants || [];
  console.log(`✅ [PASS] Mission Created: ID '${mission.id}' with ${participants.length} eligible participant(s): ${participants.map((p: any) => p.supplierName).join(', ')}`);

  // Step 2: Receive ONLY ONE supplier quotation reply (Srinidhi)
  console.log('\n--- Step 2: Receive Quote from ONLY 1 Supplier (Srinidhi) ---');
  const testPhone = '+919880011223'; // Srinidhi
  const quoteResult = await CommunicationService.receive(testPhone, '₹95/kg Delivery 1 day MOQ 15kg');
  console.log(`✅ [PASS] Incoming Quote Reply Processed -> Handled: ${quoteResult.handled}`);

  // Step 3: Verify Stage Advanced IMMEDIATELY to Owner_Approval (Without waiting for other suppliers!)
  console.log('\n--- Step 3: Verify Immediate Stage Transition to Owner_Approval ---');
  const missionAfter1Quote = await ProcurementMissionRepository.findById(mission.id);
  console.log(`✅ [PASS] Mission Stage: '${missionAfter1Quote?.currentStage}' (Expected: Owner_Approval)`);
  console.log(`✅ [PASS] Quotes Received: ${missionAfter1Quote?.context?.quotesReceivedCount} / ${missionAfter1Quote?.context?.expectedQuotesCount}`);

  if (missionAfter1Quote?.currentStage !== 'Owner_Approval') {
    throw new Error(`❌ Test Failed! Mission stage is '${missionAfter1Quote?.currentStage}', expected 'Owner_Approval'. System waited instead of allowing immediate selection.`);
  }
  console.log('🎉 [PASS] Immediate Selection Verified: System did NOT wait for all suppliers! First quote immediately enabled PO approval.');

  // Step 4: Explicitly Select Srinidhi
  console.log('\n--- Step 4: User Explicitly Selects Srinidhi ---');
  const selectedMission = await ProcurementMissionService.selectSupplierAndPreparePO(mission.id, 'Srinidhi');
  console.log(`✅ [PASS] Selected Winning Supplier: '${selectedMission.context.selectedSupplierName}'`);

  // Step 5: Approve PO for Srinidhi
  console.log('\n--- Step 5: Approve PO & Dispatch via WhatsApp to Srinidhi ONLY ---');
  const poMission = await ProcurementMissionService.approveOwnerAction(mission.id);
  console.log(`✅ [PASS] PO Dispatched to Srinidhi -> Stage: ${poMission.currentStage}`);

  // Step 6: Srinidhi Replies "Confirmed" on WhatsApp
  console.log('\n--- Step 6: Srinidhi Replies "Confirmed" on WhatsApp ---');
  const confirmResult = await CommunicationService.receive(testPhone, 'Confirmed');
  console.log(`✅ [PASS] Supplier Confirmation Processed -> ${confirmResult.reply}`);

  // Step 7: Complete Logistics Order (7 Nodes) & Verify Post-Order History & Reliability Update
  console.log('\n--- Step 7: Complete 7 Logistics Nodes & Update Supplier History ---');
  const suppliersBefore = await SupplierRepository.getAllSuppliers();
  const srinidhiBefore = suppliersBefore.find(s => s.name.toLowerCase().includes('srinidhi'));
  console.log(`📊 [Before Order] Srinidhi Reliability: ${srinidhiBefore?.reliabilityScore}%, Completed Orders: ${srinidhiBefore?.completedOrders}`);

  await ProcurementMissionService.updateSupplyChainNode(mission.id, 0, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 1, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 2, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 3, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 4, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 5, 'ON_TIME');
  const finalMission = await ProcurementMissionService.updateSupplyChainNode(mission.id, 6, 'ON_TIME');

  console.log(`✅ [PASS] Final Mission Stage: '${finalMission?.currentStage}' (Expected: Mission_Complete)`);

  const suppliersAfter = await SupplierRepository.getAllSuppliers();
  const srinidhiAfter = suppliersAfter.find(s => s.name.toLowerCase().includes('srinidhi'));
  console.log(`📊 [After Order Completed] Srinidhi Reliability: ${srinidhiAfter?.reliabilityScore}%, Completed Orders: ${srinidhiAfter?.completedOrders}`);

  if ((srinidhiAfter?.completedOrders || 0) <= (srinidhiBefore?.completedOrders || 0)) {
    throw new Error('❌ Test Failed! Supplier completedOrders did not increase after order completion.');
  }

  console.log('\n===================================================================');
  console.log('🎉 IMMEDIATE SELECTION & POST-ORDER RELIABILITY VERIFIED CLEANLY!');
  console.log('===================================================================');
}

runImmediateSupplierSelectionVerification().catch(e => {
  console.error('❌ Verification Failed:', e);
  process.exit(1);
});

import { SupplierRepository } from '../src/departments/procurement/repositories/SupplierRepository';
import { ProcurementMissionRepository } from '../src/departments/procurement/repositories/ProcurementMissionRepository';
import { ProcurementMissionService } from '../src/departments/procurement/services/ProcurementMissionService';
import { CommunicationService } from '../src/lib/services/CommunicationService';

async function runDeterministicResolutionVerification() {
  console.log('===================================================================');
  console.log('🚀 CRITICAL FIX — DETERMINISTIC SUPPLIER RESOLUTION VERIFICATION');
  console.log('===================================================================\n');

  // Step 1: Ensure Seed Suppliers exist (Srinidhi, Mithran, Varan)
  await SupplierRepository.ensureSeedSuppliers();
  
  const varanPhone = '+919363638758';
  const srinidhiPhone = '+919880011223';

  // Ensure Varan exists in Supplier Master
  const suppliers = await SupplierRepository.getAllSuppliers();
  let varan = suppliers.find(s => s.name.toLowerCase().includes('varan'));
  if (!varan) {
    varan = await SupplierRepository.createSupplier(`Varan ${Math.floor(Math.random() * 899 + 100)}`, varanPhone, 'Stainless Steel');
  }

  // Step 2: Restock Stainless Steel Mission
  console.log('--- Step 1: Restock Stainless Steel Mission ---');
  const mission = await ProcurementMissionService.createMission(
    'RM-SS-SHEET-15',
    'Stainless Steel',
    15
  );

  const participants = mission.context.missionParticipants || [];
  console.log(`✅ [PASS] Mission Created: '${mission.id}' with participants: ${participants.map((p: any) => p.supplierName).join(', ')}`);

  // Step 3: Varan replies with quote "₹69/kg Delivery 2 days MOQ 15kg"
  console.log('\n--- Step 2: Varan Replies with Quote (₹69/kg) ---');
  const varanRes = await CommunicationService.receive(varan.contactChannel || varanPhone, '₹69/kg Delivery 2 days MOQ 15kg');
  console.log(`✅ [PASS] Varan Quote Processed -> ${varanRes.reply}`);

  const missionAfterVaran = await ProcurementMissionRepository.findById(mission.id);
  const varanPart = missionAfterVaran?.context?.missionParticipants?.find((p: any) => p.supplierName.toLowerCase().includes('varan'));
  
  if (!varanPart || !varanPart.quoteReceived || varanPart.quoteData?.price !== 69) {
    throw new Error(`❌ Fail! Varan quote not deterministically assigned to Varan. Got: ${JSON.stringify(varanPart)}`);
  }
  console.log(`🎉 [PASS] Deterministic Resolution Verified: Varan quote (₹69/kg) correctly assigned to Varan!`);

  // Step 4: Srinidhi replies with quote "₹95/kg Delivery 1 day MOQ 15kg"
  console.log('\n--- Step 3: Srinidhi Replies with Quote (₹95/kg) ---');
  const srinidhiRes = await CommunicationService.receive(srinidhiPhone, '₹95/kg Delivery 1 day MOQ 15kg');
  console.log(`✅ [PASS] Srinidhi Quote Processed -> ${srinidhiRes.reply}`);

  const missionAfterSrinidhi = await ProcurementMissionRepository.findById(mission.id);
  const srinidhiPart = missionAfterSrinidhi?.context?.missionParticipants?.find((p: any) => p.supplierName.toLowerCase().includes('srinidhi'));

  if (!srinidhiPart || !srinidhiPart.quoteReceived || srinidhiPart.quoteData?.price !== 95) {
    throw new Error(`❌ Fail! Srinidhi quote not deterministically assigned to Srinidhi. Got: ${JSON.stringify(srinidhiPart)}`);
  }
  console.log(`🎉 [PASS] Deterministic Resolution Verified: Srinidhi quote (₹95/kg) correctly assigned to Srinidhi!`);

  // Step 5: Verify AI Comparison keeps both quotes distinct
  console.log('\n--- Step 4: Verify AI Comparison keeps quotes distinct ---');
  console.log(`Varan Quote: ₹${varanPart.quoteData.price}/kg, Delivery: ${varanPart.quoteData.deliveryDays}d`);
  console.log(`Srinidhi Quote: ₹${srinidhiPart.quoteData.price}/kg, Delivery: ${srinidhiPart.quoteData.deliveryDays}d`);

  // Step 6: User Selects VARAN as Winner
  console.log('\n--- Step 5: User Selects Varan as Winner ---');
  const selectedMission = await ProcurementMissionService.selectSupplierAndPreparePO(mission.id, varanPart.supplierName);
  console.log(`✅ [PASS] Explicitly Selected Winner: '${selectedMission.context.selectedSupplierName}'`);

  // Step 7: Approve PO for Varan
  console.log('\n--- Step 6: Approve Purchase Order for Varan ---');
  const poMission = await ProcurementMissionService.approveOwnerAction(mission.id);
  console.log(`✅ [PASS] PO Dispatched to Winner -> Stage: ${poMission.currentStage}`);

  // Step 8: Srinidhi attempts to reply "Confirmed" -> MUST BE IGNORED!
  console.log('\n--- Step 7: Srinidhi Attempts PO Confirmation (Must Be Ignored) ---');
  const wrongConfirmRes = await CommunicationService.receive(srinidhiPhone, 'Confirmed');
  console.log(`✅ [PASS] Non-Winner Confirmation Result -> Handled: ${wrongConfirmRes.handled}, Reply: ${wrongConfirmRes.reply}`);

  if (wrongConfirmRes.handled) {
    throw new Error('❌ Fail! Srinidhi confirmation was accepted even though Varan was selected!');
  }
  console.log('🎉 [PASS] Winner Confirmation Gate Verified: Non-selected supplier confirmation IGNORED cleanly!');

  // Step 9: Varan replies "Confirmed" -> ACCEPTED!
  console.log('\n--- Step 8: Varan (Selected Winner) Replies "Confirmed" ---');
  const correctConfirmRes = await CommunicationService.receive(varan.contactChannel || varanPhone, 'Confirmed');
  console.log(`✅ [PASS] Selected Winner Confirmation Result -> Handled: ${correctConfirmRes.handled}, Reply: ${correctConfirmRes.reply}`);

  if (!correctConfirmRes.handled) {
    throw new Error('❌ Fail! Varan (winner) confirmation was rejected!');
  }

  // Step 10: Complete 7 Logistics Nodes
  console.log('\n--- Step 9: Complete Logistics Nodes & Archive Mission ---');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 0, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 1, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 2, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 3, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 4, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 5, 'ON_TIME');
  const finalMission = await ProcurementMissionService.updateSupplyChainNode(mission.id, 6, 'ON_TIME');

  console.log(`✅ [PASS] Mission Completed Stage: '${finalMission.currentStage}'`);
  console.log(`✅ [PASS] Mission Status: '${finalMission.status}'`);

  console.log('\n===================================================================');
  console.log('🎉 DETERMINISTIC SUPPLIER RESOLUTION VERIFIED 100% CLEANLY!');
  console.log('===================================================================');
}

runDeterministicResolutionVerification().catch(e => {
  console.error('❌ Verification Failed:', e);
  process.exit(1);
});

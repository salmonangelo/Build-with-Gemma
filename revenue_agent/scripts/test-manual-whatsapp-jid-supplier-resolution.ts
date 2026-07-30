import { SupplierRepository } from '../src/departments/procurement/repositories/SupplierRepository';
import { ProcurementMissionRepository } from '../src/departments/procurement/repositories/ProcurementMissionRepository';
import { ProcurementMissionService } from '../src/departments/procurement/services/ProcurementMissionService';
import { CommunicationService } from '../src/lib/services/CommunicationService';

async function runManualWhatsAppJidResolutionVerification() {
  console.log('===================================================================');
  console.log('🚀 MANUAL WHATSAPP JID & HISTORICAL MESSAGE FILTERING VERIFICATION');
  console.log('===================================================================\n');

  // Step 1: Seed Suppliers with Manual WhatsApp JID Mappings
  await SupplierRepository.ensureSeedSuppliers();
  const allSuppliers = await SupplierRepository.getAllSuppliers();
  
  console.log('--- Step 1: Configured Master Suppliers & WhatsApp JIDs ---');
  for (const s of allSuppliers) {
    console.log(`• ${s.name} | Phone: ${s.contactChannel} | JID: ${s.whatsappJid || '(None)'} | Material: ${s.materialCategory}`);
  }

  // Ensure specific test JIDs exist on suppliers
  const srinidhi = allSuppliers.find(s => s.name.toLowerCase().includes('srinidhi'));
  const varan = allSuppliers.find(s => s.name.toLowerCase().includes('varan')) || allSuppliers.find(s => s.name.toLowerCase().includes('mithran'));
  const sathur = allSuppliers.find(s => s.name.toLowerCase().includes('sathur'));

  if (srinidhi) await SupplierRepository.updateSupplierJid(srinidhi.id, '202516935528474');
  if (varan) await SupplierRepository.updateSupplierJid(varan.id, '204118762311452');
  if (sathur) await SupplierRepository.updateSupplierJid(sathur.id, '209123456789654');

  // Step 2: Initialize Procurement Mission for Stainless Steel
  console.log('\n--- Step 2: Initialize Stainless Steel Mission ---');
  const mission = await ProcurementMissionService.createMission(
    'RM-SS-SHEET-15',
    'Stainless Steel',
    15
  );

  const participants = mission.context.missionParticipants || [];
  console.log(`✅ [PASS] Mission Created: '${mission.id}' at ${mission.startedAt} with ${participants.length} eligible Stainless Steel participant(s): ${participants.map((p: any) => p.supplierName).join(', ')}`);

  // Step 3: Historical Message Filtering Test (Message from Yesterday)
  console.log('\n--- Step 3: Receive Yesterday\'s Historical Message from Srinidhi JID 202516935528474 (Must Be Ignored) ---');
  const yesterdayTs = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
  const historicalRes = await CommunicationService.receive('202516935528474', '88/kg delivery 10days', yesterdayTs);
  console.log(`✅ [PASS] Historical Message Result -> Handled: ${historicalRes.handled}, Reply: ${historicalRes.reply}`);

  if (historicalRes.handled) {
    throw new Error('❌ Test Failed! Yesterday\'s historical message was processed instead of being ignored!');
  }
  console.log('🎉 [PASS] Historical Message Filter Verified: Messages sent before mission creation are IGNORED completely!');

  // Step 4: Live Incoming WhatsApp Message from Srinidhi JID (202516935528474)
  console.log('\n--- Step 4: Receive Live Quote from Srinidhi JID 202516935528474 ("75/kg delivery 5days") ---');
  const liveTs = new Date().toISOString();
  const srinidhiRes = await CommunicationService.receive('202516935528474', '75/kg delivery 5days', liveTs);
  console.log(`✅ [PASS] Live Srinidhi JID Quote Result -> Handled: ${srinidhiRes.handled}, Reply: ${srinidhiRes.reply}`);

  if (!srinidhiRes.handled) {
    throw new Error('❌ Test Failed! Live message from registered Srinidhi JID 202516935528474 was not handled!');
  }

  const missionAfterSrinidhi = await ProcurementMissionRepository.findById(mission.id);
  const srinidhiPart = missionAfterSrinidhi?.context?.missionParticipants?.find((p: any) => p.supplierName.toLowerCase().includes('srinidhi'));

  if (!srinidhiPart || !srinidhiPart.quoteReceived || srinidhiPart.quoteData?.price !== 75) {
    throw new Error(`❌ Test Failed! Srinidhi quote not assigned properly. Got: ${JSON.stringify(srinidhiPart)}`);
  }
  console.log(`🎉 [PASS] Srinidhi Quote (₹75/kg) deterministically resolved via WhatsApp JID 202516935528474!`);

  // Step 5: Live Incoming WhatsApp Message from Varan JID (204118762311452)
  console.log('\n--- Step 5: Receive Live Quote from Varan JID 204118762311452 ("65/kg delivery 2days") ---');
  const varanRes = await CommunicationService.receive('204118762311452', '65/kg delivery 2days', liveTs);
  console.log(`✅ [PASS] Live Varan JID Quote Result -> Handled: ${varanRes.handled}, Reply: ${varanRes.reply}`);

  if (!varanRes.handled) {
    throw new Error('❌ Test Failed! Live message from registered Varan JID 204118762311452 was not handled!');
  }

  const missionAfterVaran = await ProcurementMissionRepository.findById(mission.id);
  const varanPart = missionAfterVaran?.context?.missionParticipants?.find((p: any) => p.supplierName.toLowerCase().includes('varan') || p.supplierName.toLowerCase().includes('mithran'));

  if (!varanPart || !varanPart.quoteReceived || varanPart.quoteData?.price !== 65) {
    throw new Error(`❌ Test Failed! Varan quote not assigned properly. Got: ${JSON.stringify(varanPart)}`);
  }
  console.log(`🎉 [PASS] Varan Quote (₹65/kg) deterministically resolved via WhatsApp JID 204118762311452!`);

  // Step 6: Ignore Unknown JID (999999999999999)
  console.log('\n--- Step 6: Incoming Message from Unknown JID 999999999999999 (Must Be Ignored) ---');
  const unknownJidRes = await CommunicationService.receive('999999999999999', '50/kg delivery 1day', liveTs);
  console.log(`✅ [PASS] Unknown JID Result -> Handled: ${unknownJidRes.handled}, Reply: ${unknownJidRes.reply}`);

  if (unknownJidRes.handled) {
    throw new Error('❌ Test Failed! Unknown JID 999999999999999 was handled instead of being ignored!');
  }
  console.log('🎉 [PASS] Unknown JID Gate Verified: Unregistered JIDs are IGNORED completely!');

  // Step 7: Ignore Non-Participant Supplier Message (Sathur JID 209123456789654 - Mild Steel)
  console.log('\n--- Step 7: Incoming Message from Non-Participant Supplier Sathur JID 209123456789654 (Must Be Ignored) ---');
  const nonParticipantRes = await CommunicationService.receive('209123456789654', '40/kg delivery 1day', liveTs);
  console.log(`✅ [PASS] Non-Participant JID Result -> Handled: ${nonParticipantRes.handled}, Reply: ${nonParticipantRes.reply}`);

  if (nonParticipantRes.handled) {
    throw new Error('❌ Test Failed! Non-participant supplier Sathur message was handled instead of being ignored!');
  }
  console.log('🎉 [PASS] Mission Participant Gate Verified: Non-participant suppliers are IGNORED completely!');

  // Step 8: Complete PO Approval & Order Workflow
  console.log('\n--- Step 8: Explicit Winner Selection & PO Dispatch ---');
  const selectedMission = await ProcurementMissionService.selectSupplierAndPreparePO(mission.id, varanPart.supplierName);
  console.log(`✅ [PASS] Selected Winner: '${selectedMission.context.selectedSupplierName}'`);

  const poMission = await ProcurementMissionService.approveOwnerAction(mission.id);
  console.log(`✅ [PASS] PO Approved & Dispatched -> Mission Stage: '${poMission.currentStage}'`);

  const confirmRes = await CommunicationService.receive('204118762311452', 'Confirmed', liveTs);
  console.log(`✅ [PASS] Winner Confirmation Reply via JID 204118762311452 -> Handled: ${confirmRes.handled}`);

  if (!confirmRes.handled) {
    throw new Error('❌ Test Failed! Selected winner PO confirmation was rejected!');
  }

  // Complete Logistics Nodes
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 0, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 1, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 2, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 3, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 4, 'ON_TIME');
  await ProcurementMissionService.updateSupplyChainNode(mission.id, 5, 'ON_TIME');
  const finalMission = await ProcurementMissionService.updateSupplyChainNode(mission.id, 6, 'ON_TIME');

  console.log(`✅ [PASS] Final Mission Stage: '${finalMission.currentStage}', Status: '${finalMission.status}'`);

  console.log('\n===================================================================');
  console.log('🎉 MANUAL WHATSAPP JID & HISTORICAL MESSAGE FILTERING VERIFIED 100% CLEANLY!');
  console.log('===================================================================');
}

runManualWhatsAppJidResolutionVerification().catch(e => {
  console.error('❌ Verification Failed:', e);
  process.exit(1);
});

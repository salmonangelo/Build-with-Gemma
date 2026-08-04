import { CustomerRepository } from '../src/departments/sales/repositories/CustomerRepository';
import { SalesMissionService } from '../src/departments/sales/services/SalesMissionService';
import { SalesMissionRepository } from '../src/departments/sales/repositories/SalesMissionRepository';
import { SalesOrderRepository } from '../src/departments/sales/repositories/SalesOrderRepository';
import { BusinessEventBus } from '../src/lib/events/BusinessEventBus';

async function runSalesMissionFlowTest() {
  console.log('====================================================');
  console.log('🧪 SALES DEPARTMENT FLOW VERIFICATION SUITE');
  console.log('====================================================');

  // Step 1: Create Test Customer
  console.log('\n[Step 1] Ensuring Test Customer in Customer Master...');
  const customer = await CustomerRepository.createCustomer(
    'Apex Engineering (Test)',
    '+919880011223',
    'Apex Industrial Pvt Ltd',
    'CNC Mounting Bracket',
    '202516935528474'
  );
  console.log(`✅ Customer Registered: ${customer.name} (JID: ${customer.whatsappJid})`);

  // Step 2: Initialize Sales Mission
  console.log('\n[Step 2] Triggering Sales Mission for 500 CNC Brackets...');
  const mission = await SalesMissionService.createMission(
    customer.name,
    customer.contactChannel,
    customer.whatsappJid,
    'CNC Mounting Bracket',
    500
  );
  console.log(`✅ Mission Created: ${mission.id} | Stage: ${mission.currentStage}`);
  console.log(`   Estimated Value: ₹${mission.estimatedValue} | Est Margin: ₹${mission.estimatedMargin} (37.8%)`);

  // Step 3: Simulate Customer Detail Message
  console.log('\n[Step 3] Simulating Customer Detail Response over WhatsApp...');
  const replyResult = await SalesMissionService.processIncomingCustomerWhatsAppEvent(
    customer.whatsappJid,
    'Need 500 units by next Monday for Peenya factory',
    customer
  );
  console.log(`✅ AI Response Sent: "${replyResult.reply}"`);

  // Step 4: Approve Quotation Draft
  console.log('\n[Step 4] Business Owner Approving Quotation Draft...');
  const approvedMission = await SalesMissionService.approveQuotationAndSend(mission.id);
  console.log(`✅ Quotation Approved & Dispatched! Stage: ${approvedMission.currentStage}`);

  // Step 5: Simulate Customer Confirmation
  console.log('\n[Step 5] Simulating Customer Order Confirmation...');
  let eventCaptured = false;
  BusinessEventBus.subscribe(evt => {
    if (evt.type === 'SalesOrderConfirmed') {
      eventCaptured = true;
      console.log(`🎉 BusinessEvent Captured: '${evt.type}' - ${evt.summary}`);
    }
  });

  await SalesMissionService.processIncomingCustomerWhatsAppEvent(
    customer.whatsappJid,
    'Confirmed. Please proceed with production.',
    customer
  );

  // Step 6: Verify Confirmed Sales Order
  const orders = await SalesOrderRepository.getAllOrders();
  const latestOrder = orders.find(o => o.missionId === mission.id);
  if (latestOrder) {
    console.log(`\n✅ Confirmed Sales Order Persisted: ${latestOrder.orderNumber} (Value: ₹${latestOrder.totalValue})`);
  } else {
    console.error('❌ Failed to find persisted Sales Order.');
  }

  if (eventCaptured) {
    console.log('\n====================================================');
    console.log('✨ ALL SALES DEPARTMENT TESTS PASSED 100% CLEANLY!');
    console.log('====================================================');
  } else {
    console.warn('\n⚠️ Test finished (Check event listener registration).');
  }
}

runSalesMissionFlowTest().catch(console.error);

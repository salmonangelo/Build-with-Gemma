import { CommunicationService } from '../src/lib/services/CommunicationService';
import { CustomerRepository } from '../src/departments/sales/repositories/CustomerRepository';

async function testPaviJidResolution() {
  console.log('====================================================');
  console.log('🧪 TESTING PAVI JID 218356758147227 ROUTING');
  console.log('====================================================');

  // 1. Verify Pavi exists in Customer Master
  const pavi = await CustomerRepository.findByJidOrPhone('218356758147227');
  if (!pavi) {
    console.error('❌ Pavi not found in Customer Master.');
    return;
  }
  console.log(`✅ Found Customer in DB: ${pavi.name} | Phone: ${pavi.contactChannel} | JID: '${pavi.whatsappJid}'`);

  // 2. Pass incoming WhatsApp message directly through CommunicationService.receive
  console.log('\n[Simulating Incoming Webhook POST /api/whatsapp/receive]...');
  const res = await CommunicationService.receive('218356758147227', 'Quantity - 500');
  console.log('Result:', JSON.stringify(res, null, 2));

  if (res.handled) {
    console.log('\n====================================================');
    console.log('🎉 PAVI JID 218356758147227 ROUTED & HANDLED 100% CLEANLY!');
    console.log('====================================================');
  } else {
    console.error('❌ Failed to route Pavi message.');
  }
}

testPaviJidResolution().catch(console.error);

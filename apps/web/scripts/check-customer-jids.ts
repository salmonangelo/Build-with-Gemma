import { prisma } from '../src/lib/prisma-client';

async function checkCustomers() {
  console.log('====================================================');
  console.log('📋 CURRENT CUSTOMERS IN POSTGRESQL DATABASE');
  console.log('====================================================');

  const customers = await prisma.customer.findMany();
  for (const c of customers) {
    console.log(`ID: #${c.id} | Name: ${c.name} | Phone: ${c.contactChannel} | WhatsApp JID: '${c.whatsappJid}' | Product: ${c.interestedProduct}`);
  }
}

checkCustomers().catch(console.error);

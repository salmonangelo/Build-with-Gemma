import { prisma } from '../src/lib/prisma-client';

async function checkSuppliers() {
  console.log('====================================================');
  console.log('📋 CURRENT SUPPLIERS IN POSTGRESQL DATABASE');
  console.log('====================================================');

  const suppliers = await prisma.supplier.findMany();
  for (const s of suppliers) {
    console.log(`ID: #${s.id} | Name: ${s.name} | Phone: ${s.contactChannel} | WhatsApp JID: '${s.whatsappJid}' | Category: ${s.materialCategory}`);
  }
}

checkSuppliers().catch(console.error);

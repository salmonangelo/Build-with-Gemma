const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appsWeb = path.join(root, 'apps', 'web');
const pkgsDb = path.join(root, 'packages', 'database');
const pkgsShared = path.join(root, 'packages', 'shared');
const prismaDir = path.join(root, 'prisma');
const revenueAgent = path.join(root, 'revenue_agent');

console.log('🚀 Migrating project into npm workspaces monorepo structure...');

// 1. Create directories
[appsWeb, pkgsDb, pkgsShared, prismaDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log(`📁 Created ${d}`);
  }
});

// Helper to copy dir recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy revenue_agent contents to apps/web
if (fs.existsSync(revenueAgent)) {
  console.log('📦 Copying revenue_agent into apps/web...');
  copyDirSync(revenueAgent, appsWeb);
  console.log('✅ Coerced revenue_agent into apps/web!');
}

// 3. Copy Prisma schema to root prisma/
const srcSchema = path.join(revenueAgent, 'prisma', 'schema.prisma');
const destSchema = path.join(prismaDir, 'schema.prisma');
if (fs.existsSync(srcSchema)) {
  fs.copyFileSync(srcSchema, destSchema);
  console.log('✅ Copied schema.prisma to monorepo root prisma/');
}

// 4. Create packages/database/package.json & index.ts
fs.writeFileSync(path.join(pkgsDb, 'package.json'), JSON.stringify({
  "name": "@mission-os/database",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "dependencies": {
    "@prisma/client": "^7.8.0"
  }
}, null, 2));

fs.writeFileSync(path.join(pkgsDb, 'index.ts'), `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export * from '@prisma/client';
`);

// 5. Create packages/shared/package.json & index.ts
fs.writeFileSync(path.join(pkgsShared, 'package.json'), JSON.stringify({
  "name": "@mission-os/shared",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts"
}, null, 2));

fs.writeFileSync(path.join(pkgsShared, 'index.ts'), `export const APP_NAME = "Mission-OS ERP";
export const SYSTEM_VERSION = "2.0.0-monorepo";
`);

console.log('🎉 Monorepo structure creation complete!');

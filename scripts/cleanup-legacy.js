const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const legacyDir = path.join(root, 'revenue_agent');

if (fs.existsSync(legacyDir)) {
  console.log('🗑️ Removing legacy revenue_agent directory...');
  fs.rmSync(legacyDir, { recursive: true, force: true });
  console.log('✅ Legacy directory removed. Project migrated to apps/web monorepo.');
}

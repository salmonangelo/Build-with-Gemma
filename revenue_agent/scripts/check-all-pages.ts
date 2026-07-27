import http from 'http';

const routes = [
  '/',
  '/operations',
  '/pricing-agent',
  '/pricing-agent/inventory',
  '/pricing-agent/supply-chain',
  '/pricing-agent/long-term-risks',
  '/revenue-intelligence',
  '/supplier-agent',
  '/collections-agent',
  '/market-intelligence',
  '/customer-intelligence',
  '/reports',
  '/ask-ai-cfo',
  '/what-if-simulator',
  '/executive-advisor'
];

async function checkRoute(path: string): Promise<{ path: string; status: number; ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const ok = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          path,
          status: res.statusCode || 500,
          ok,
          error: ok ? undefined : `HTTP Status ${res.statusCode}`
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 0,
        ok: false,
        error: err.message
      });
    });
  });
}

async function verifyAllPages() {
  console.log("=================================================");
  console.log("🌐 Verifying All Application Page Routes...");
  console.log("=================================================\n");

  const results = [];
  for (const r of routes) {
    const res = await checkRoute(r);
    results.push(res);
    const icon = res.ok ? '✅' : '❌';
    console.log(`${icon} Route [${r}] -> Status: ${res.status} ${res.ok ? 'OK' : `FAILED (${res.error})`}`);
  }

  console.log("\n=================================================");
  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    console.error(`❌ ${failed.length} / ${routes.length} pages failed!`);
    failed.forEach(f => console.error(`   └─ Path: ${f.path} (Status ${f.status})`));
    process.exit(1);
  } else {
    console.log(`🎉 ALL ${routes.length} PAGE ROUTES ARE WORKING CLEANLY (200 OK)!`);
    console.log("=================================================\n");
  }
}

verifyAllPages();

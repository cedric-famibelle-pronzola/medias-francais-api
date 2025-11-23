// deno-lint-ignore-file no-console

import app from './src/app.ts';
import { loadData } from './src/data/index.ts';

const port = parseInt(Deno.env.get('API_PORT') || '8000');

// Load data before starting server
console.log('📂 Loading data...');

try {
  await loadData();
  console.log('✅ Data loaded successfully');
} catch (error) {
  console.error('❌ Failed to load data:', error);
  console.error(
    '💡 Make sure to run "deno task build" and "deno task enrich" first'
  );
  Deno.exit(1);
}

console.log(`🦕 Server starting on http://localhost:${port}`);

// Signal handlers for graceful shutdown (local dev only)
if (Deno.build.os !== 'linux' || !Deno.env.get('DENO_DEPLOYMENT_ID')) {
  const handleShutdown = () => {
    console.log('\n📞 Received shutdown signal');
    console.log('✅ Graceful shutdown completed');
    Deno.exit(0);
  };

  try {
    Deno.addSignalListener('SIGINT', handleShutdown);
    Deno.addSignalListener('SIGTERM', handleShutdown);
  } catch {
    // Signal listeners not supported (e.g., on Deno Deploy)
  }
}

// Start server - Deno Deploy compatible
Deno.serve({ port }, app.fetch);

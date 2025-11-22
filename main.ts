// deno-lint-ignore-file no-console

import app from './src/app.ts';
import { loadData } from './src/data/index.ts';

async function startServer() {
  const port = parseInt(Deno.env.get('API_PORT') || '3000');

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

  Deno.serve({ port }, app.fetch);
}

function handleShutdown() {
  console.log('\n📞 Received shutdown signal');
  console.log('✅ Graceful shutdown completed');
  Deno.exit(0);
}

Deno.addSignalListener('SIGINT', handleShutdown);
Deno.addSignalListener('SIGTERM', handleShutdown);

if (import.meta.main) {
  try {
    await startServer();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    Deno.exit(1);
  }
}

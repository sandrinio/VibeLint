#!/usr/bin/env npx tsx

import { startServer } from '../src/server/index.js';
import open from 'open';

function parseArgs(argv: string[]): { port: number; host: string; noOpen: boolean } {
  let port = 3847;
  let host = '127.0.0.1';
  let noOpen = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--port' && argv[i + 1]) {
      const parsed = parseInt(argv[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
        port = parsed;
      }
      i++;
    } else if (arg === '--host' && argv[i + 1]) {
      host = argv[i + 1];
      i++;
    } else if (arg === '--no-open') {
      noOpen = true;
    }
  }

  return { port, host, noOpen };
}

async function main(): Promise<void> {
  const { port, host, noOpen } = parseArgs(process.argv);

  try {
    await startServer({ port, host });

    const url = `http://localhost:${port}`;
    console.log(`\nVibeLint running at ${url}\n`);

    if (!noOpen) {
      await open(url);
    }
  } catch (error) {
    console.error('Failed to start VibeLint:', error);
    process.exit(1);
  }
}

main();

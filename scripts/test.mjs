import { build } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const output = await mkdtemp(join(tmpdir(), 'topo-tests-'));
try {
  await build({ configFile: false, logLevel: 'error', build: {
    ssr: 'tests/learning.test.ts', outDir: output,
    rollupOptions: { output: { entryFileNames: 'learning.test.mjs' } },
  } });
  const result = spawnSync(process.execPath, ['--test', join(output, 'learning.test.mjs')], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}

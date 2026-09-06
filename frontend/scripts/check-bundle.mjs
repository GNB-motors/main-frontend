// Fails the build if the main JS entry chunk grows past the budget.
// The entry chunk is resolved from dist/index.html — not by filename —
// because Rollup may also emit small shared vendor chunks named index-*.js
// once routes are code-split.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Budget history:
//   ab12b74 (pre-split, all routes eager)          = 4,417,756 B
//   Phase 3 route splitting                        = 1,608,035 B
//   Phase 4 dependency purge + async Sentry/lottie = 580,376 B ← current basis
const BUDGET = 600_000; // bytes; ~3% headroom — the plan target

const DIST = join(process.cwd(), 'dist');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const match = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (!match) {
    console.error('could not find the module script in dist/index.html');
    process.exit(1);
}
const file = match[1];
const size = statSync(join(DIST, 'assets', file)).size;
if (size > BUDGET) { console.error(`main chunk ${file} is ${size} B, over budget ${BUDGET} B`); process.exit(1); }
console.log(`bundle ok: ${file} ${size} B <= ${BUDGET} B`);

// Fails the build if the JS bundle grows past its budgets:
//   1. the main entry chunk (what every visitor downloads first),
//   2. the largest single chunk (a lazy route can't balloon unnoticed),
//   3. all emitted JS together.
// The entry chunk is resolved from dist/index.html — not by filename —
// because Rollup may also emit small shared vendor chunks named index-*.js
// once routes are code-split.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Main-chunk budget history:
//   ab12b74 (pre-split, all routes eager)          = 4,417,756 B
//   Phase 3 route splitting                        = 1,608,035 B
//   Phase 4 dependency purge + async Sentry/lottie = 580,376 B ← current basis
const BUDGET = 600_000; // bytes; ~3% headroom — the plan target

// Basis 2026-10-12: largest chunk three.module (Vehicle360 3D) = 734,293 B;
// all JS = 7,152,791 B over 393 files. ~10% headroom, because without a
// committed lockfile a fresh install (CI) resolves newer dependency versions.
const LARGEST_CHUNK_BUDGET = 800_000;
const TOTAL_JS_BUDGET = 7_900_000;

const DIST = join(process.cwd(), 'dist');
const ASSETS = join(DIST, 'assets');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const match = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (!match) {
    console.error('could not find the module script in dist/index.html');
    process.exit(1);
}

const chunks = readdirSync(ASSETS)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: f, size: statSync(join(ASSETS, f)).size }))
    .sort((a, b) => b.size - a.size);
const total = chunks.reduce((sum, c) => sum + c.size, 0);
const main = chunks.find((c) => c.file === match[1]);
const largest = chunks[0];

const failures = [];
if (main.size > BUDGET) failures.push(`main chunk ${main.file} is ${main.size} B, over budget ${BUDGET} B`);
if (largest.size > LARGEST_CHUNK_BUDGET) {
    failures.push(`largest chunk ${largest.file} is ${largest.size} B, over budget ${LARGEST_CHUNK_BUDGET} B`);
}
if (total > TOTAL_JS_BUDGET) failures.push(`all JS is ${total} B, over budget ${TOTAL_JS_BUDGET} B`);

if (failures.length) {
    failures.forEach((f) => console.error(f));
    console.error(`largest chunks: ${chunks.slice(0, 5).map((c) => `${c.file} ${c.size} B`).join(', ')}`);
    process.exit(1);
}
console.log(`bundle ok: ${main.file} ${main.size} B <= ${BUDGET} B`);
console.log(`largest chunk ok: ${largest.file} ${largest.size} B <= ${LARGEST_CHUNK_BUDGET} B`);
console.log(`all JS ok: ${total} B in ${chunks.length} files <= ${TOTAL_JS_BUDGET} B`);

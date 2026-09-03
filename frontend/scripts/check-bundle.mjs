// Fails the build if the main JS chunk grows past the budget.
// Budget: current main chunk at ab12b74 = 4,417,756 bytes. Renderers and page
// chunks are exempt — they are lazy by design.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = join(process.cwd(), 'dist', 'assets');
const BUDGET = 4_600_000; // bytes; ~4% headroom over 4,417,756
const mains = readdirSync(ASSETS).filter((f) => /^index-.*\.js$/.test(f));
if (mains.length !== 1) { console.error(`expected exactly one index-*.js, found ${mains.length}`); process.exit(1); }
const size = statSync(join(ASSETS, mains[0])).size;
if (size > BUDGET) { console.error(`main chunk ${mains[0]} is ${size} B, over budget ${BUDGET} B`); process.exit(1); }
console.log(`bundle ok: ${mains[0]} ${size} B <= ${BUDGET} B`);

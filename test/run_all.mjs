// Runs every v2_*.mjs test against a local server and prints a pass/fail summary.
// Usage: node test/run_all.mjs   (expects a server already running on :8123, see README)
import { execSync } from 'child_process';
import { readdirSync } from 'fs';

const files = readdirSync('test').filter(f => f.startsWith('v2_') && f.endsWith('.mjs')).sort();
const results = [];
for (const f of files) {
  process.stdout.write(`\n=== ${f} ===\n`);
  try {
    const out = execSync(`node test/${f}`, { encoding: 'utf8', stdio: 'pipe' });
    process.stdout.write(out);
    results.push([f, true]);
  } catch (e) {
    process.stdout.write(e.stdout || '');
    process.stderr.write(e.stderr || '');
    results.push([f, false]);
  }
}
console.log('\n' + '='.repeat(40));
console.log('SUMMARY');
for (const [f, ok] of results) console.log((ok ? 'PASS' : 'FAIL') + '  ' + f);
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} files passed`);
if (failed.length) process.exit(1);

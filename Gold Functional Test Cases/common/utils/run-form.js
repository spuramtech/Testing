// Run one form, several forms, a whole module, or everything – each form gets its own results and reports.
//   node common/utils/run-form.js --list                         list forms
//   node common/utils/run-form.js "Daily Gold Rate"              one form (name, folder or slug: daily-gold-rate)
//   node common/utils/run-form.js "Daily Gold Rate" --grep @smoke  extra args go to Playwright
//   node common/utils/run-form.js "Gold Loan Configuration"      every form in that module
//   node common/utils/run-form.js all                            every form
//   node common/utils/run-form.js "Daily Gold Rate" --report-only   rebuild the report from the last run
//   node common/utils/run-form.js "Daily Gold Rate" --grep TC_GR_009 --rerun   rerun some tests, keep the rest of the last full run
// A form folder = <Module>/<Form>/ containing tests/ and test-data/test-cases.js.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUITE = path.resolve(__dirname, '../..');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const isForm = (dir) => fs.existsSync(path.join(dir, 'tests')) && fs.existsSync(path.join(dir, 'test-data', 'test-cases.js'));

// Forms live either directly in the suite folder (<Form>/) or inside a module folder (<Module>/<Form>/)
function forms() {
  const out = [];
  for (const mod of fs.readdirSync(SUITE, { withFileTypes: true })) {
    if (!mod.isDirectory() || ['common', 'node_modules', 'all-forms'].includes(mod.name) || mod.name.startsWith('.')) continue;
    const modDir = path.join(SUITE, mod.name);
    if (isForm(modDir)) { out.push({ module: mod.name, form: mod.name, dir: modDir }); continue; }
    for (const f of fs.readdirSync(modDir, { withFileTypes: true })) {
      const dir = path.join(SUITE, mod.name, f.name);
      if (f.isDirectory() && isForm(dir)) out.push({ module: mod.name, form: f.name, dir });
    }
  }
  return out;
}

const [target, ...rest] = process.argv.slice(2);
const all = forms();
if (!target || target === '--list') {
  console.log('Forms:');
  for (const f of all) console.log(`  ${f.module === f.form ? f.form : `${f.module} / ${f.form}`}    →  npm run form -- "${f.form}"   (slug: ${slug(f.form)})`);
  process.exit(0);
}

const t = slug(target);
const selected = t === 'all' ? all : all.filter((f) => slug(f.form) === t || slug(f.module) === t || slug(`${f.module}-${f.form}`) === t);
if (!selected.length) {
  console.error(`No form matches "${target}". Available: ${all.map((f) => f.form).join(', ')}`);
  process.exit(1);
}

const reportOnly = rest.includes('--report-only');
const args = rest.filter((a) => a !== '--report-only');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let failed = 0;
for (const f of selected) {
  console.log(`\n=== ${f.module} / ${f.form} ===`);
  const env = { ...process.env, FORM_DIR: f.dir };
  // Windows runs npx through cmd.exe – quote every argument so "A|B" or spaces are not treated as shell syntax
  const q = (a) => (process.platform === 'win32' ? `"${String(a).replace(/"/g, '\\"')}"` : a);
  const pw = (a, opts = {}) => spawnSync(npx, ['playwright', 'test', ...a].map(q), { cwd: SUITE, env, shell: process.platform === 'win32', ...opts });
  fs.mkdirSync(path.join(f.dir, 'reports'), { recursive: true });
  // a full run starts clean; `--rerun` runs only what you select and merges it into the last full result
  const rerun = args.includes('--rerun');
  if (rerun) { args.splice(args.indexOf('--rerun'), 1); args.push('--reporter=list,json'); env.PLAYWRIGHT_JSON_OUTPUT_NAME = path.join(f.dir, 'test-results', `rerun-${Date.now()}.json`); }
  else if (!reportOnly) env.FORM_FULL_RUN = '1';
  if (!rerun && !reportOnly) for (const x of fs.readdirSync(path.join(f.dir, 'test-results')).filter((n) => /^rerun-.*\.json$/.test(n))) fs.rmSync(path.join(f.dir, 'test-results', x), { force: true });
  if (!reportOnly) {
    if (!rerun) {
      const list = pw(['--list', '--reporter=json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      fs.writeFileSync(path.join(f.dir, 'reports', 'discovered.json'), list.stdout || '{}');
    }
    const res = pw(args, { stdio: 'inherit' });
    if (res.status) failed++;
  }
  spawnSync(process.execPath, [path.join(__dirname, 'report.js'), f.dir], { cwd: SUITE, env, stdio: 'inherit' });
}
process.exit(failed ? 1 : 0);

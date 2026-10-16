// Builds one form's reports from REAL execution data. Usage: node common/utils/report.js "<form folder>"
//   <form>/test-data/test-cases.js   – inventory (denominator)
//   <form>/test-data/categories.js   – optional test-type categories
//   <form>/reports/discovered.json   – `playwright test --list --reporter=json` (what the runner can see)
//   <form>/test-results/results.json – Playwright JSON reporter output of the last run
// Writes <form>/reports/execution-results.json, QMetryReport.html, qmetry-import.csv, reconciliation.md
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || process.env.FORM_DIR || '.');
const REPORTS = path.join(ROOT, 'reports');
const FORM = path.basename(ROOT);
const MODULE = path.dirname(ROOT) === path.resolve(__dirname, '../..') ? 'Gold' : path.basename(path.dirname(ROOT));
const cases = require(path.join(ROOT, 'test-data', 'test-cases'));
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

// Test-type categories (optional per form): [[name, [ids…]], …]
const CAT_FILE = path.join(ROOT, 'test-data', 'categories.js');
const CATEGORIES = fs.existsSync(CAT_FILE) ? require(CAT_FILE) : [...new Set(cases.map((c) => c.type))].map((t) => [t, cases.filter((c) => c.type === t).map((c) => c.id)]);
const categoryOf = (id) => (CATEGORIES.find(([, ids]) => ids.includes(id)) || ['Other'])[0];

const idOf = (title) => (String(title).match(/TC_[A-Z0-9]+_[A-Z]*\d+/) || [])[0];

function walk(suite, fn, file) {
  for (const s of suite.suites || []) walk(s, fn, s.file || file);
  for (const spec of suite.specs || []) fn(spec, spec.file || file);
}

function discovered() {
  const list = readJson(path.join(REPORTS, 'discovered.json'));
  const ids = new Set();
  if (list) for (const s of list.suites || []) walk(s, (spec) => ids.add(idOf(spec.title)));
  return { ids, available: !!list };
}

// results.json = last full run; rerun-<time>.json files (from --rerun) override the tests they contain
function results() {
  const json = readJson(path.join(ROOT, 'test-results', 'results.json'));
  // every rerun-<time>.json, oldest first – a later rerun of the same test wins
  const dir = path.join(ROOT, 'test-results');
  const reruns = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => /^rerun-.*\.json$/.test(n)).sort().map((n) => readJson(path.join(dir, n))).filter(Boolean) : [];
  const map = new Map();
  if (!json) return { map, run: null };
  for (const s of [...(json.suites || []), ...reruns.flatMap((r) => r.suites || [])]) {
    walk(s, (spec, file) => {
      const id = idOf(spec.title);
      for (const t of spec.tests || []) {
        const r = t.results[t.results.length - 1];
        if (!r) continue;
        const ann = [...(t.annotations || []), ...(r.annotations || [])];
        const blocked = ann.find((a) => a.type === 'blocked');
        const skip = ann.find((a) => a.type === 'skip');
        let status = { passed: 'PASSED', failed: 'FAILED', timedOut: 'FAILED', interrupted: 'NOT EXECUTED', skipped: 'SKIPPED' }[r.status] || 'FAILED';
        if (status === 'SKIPPED' && blocked) status = 'BLOCKED';
        const err = (r.errors || []).map((e) => (e.message || '').replace(/\u001b\[[0-9;]*m/g, '')).join('\n').split('\n').slice(0, 12).join('\n');
        map.set(id, {
          status,
          duration: r.duration,
          startTime: r.startTime,
          file: `tests/${file}`.replace(/\\/g, '/'),
          title: spec.title,
          actual: ann.filter((a) => a.type === 'actual').map((a) => a.description).join(' | '),
          reason: blocked?.description || skip?.description || '',
          error: err,
          evidence: (r.attachments || []).filter((a) => a.path).map((a) => ({ name: a.name, path: path.relative(REPORTS, a.path).replace(/\\/g, '/') })),
          steps: (r.steps || []).map((s) => s.title),
        });
      }
    });
  }
  return { map, run: json.stats };
}

function build() {
  const { ids: disc, available: discAvailable } = discovered();
  const { map, run } = results();
  let dc = 0;
  const rows = cases.map((c) => {
    const r = map.get(c.id);
    const automated = !!c.script;
    let status;
    let reason = '';
    if (!automated) { status = c.status; reason = c.reason; }
    else if (r) { status = r.status; reason = r.reason; }
    else { status = 'NOT EXECUTED'; reason = disc.has(c.id) ? 'Discovered but not selected in the last run (filtered by --grep / file)' : 'Script not discovered by the runner'; }
    const defect = status === 'FAILED' ? `DC-${String(++dc).padStart(3, '0')}` : '';
    return {
      ...c,
      category: categoryOf(c.id),
      automated,
      discovered: automated && disc.has(c.id),
      executed: !!r && ['PASSED', 'FAILED'].includes(r.status),
      status,
      reason,
      actual: r ? (r.actual || (r.status === 'FAILED' ? r.error : '')) : '',
      error: r?.error || '',
      expectedVerified: r?.status === 'PASSED',
      duration: r ? Math.round(r.duration / 100) / 10 : null,
      timestamp: r?.startTime || '',
      evidence: r?.evidence || [],
      defect,
      automationPath: c.script || '',
    };
  });
  const count = (s) => rows.filter((r) => r.status === s).length;
  const summary = {
    generated: rows.length,
    automated: rows.filter((r) => r.automated).length,
    discovered: rows.filter((r) => r.discovered).length,
    executed: rows.filter((r) => r.executed).length,
    passed: count('PASSED'), failed: count('FAILED'), blocked: count('BLOCKED'), skipped: count('SKIPPED'), notExecuted: count('NOT EXECUTED'), na: count('N/A'),
    discoveryAvailable: discAvailable,
    runStats: run,
    generatedAt: new Date().toISOString(),
    baseURL: process.env.BASE_URL || '',
  };
  summary.reconciles = summary.passed + summary.failed + summary.blocked + summary.skipped + summary.notExecuted + summary.na === summary.generated;
  return { summary, rows };
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

function writeCsv(rows) {
  // QMetry Test Management import: one row per step; test-level columns filled on the first step row.
  // Column names follow QMetry's import template; map them in QMetry's import wizard if your project uses custom fields.
  const head = ['Test Case Key', 'Summary', 'Description', 'Precondition', 'Priority', 'Labels', 'Components', 'Test Type', 'Requirement', 'Step Summary', 'Test Data', 'Expected Result', 'Execution Status', 'Actual Result', 'Defect', 'Automation Script'];
  const out = [head.join(',')];
  for (const r of rows) {
    r.steps.forEach((step, i) => {
      const first = i === 0;
      out.push([
        r.id, first ? `${r.id} ${r.scenario}` : '', first ? `${r.module} / ${r.screen} / ${r.feature} – ${r.type}` : '', first ? r.pre : '', first ? r.priority : '',
        first ? [FORM.replace(/\s+/g, ''), r.type.replace(/\s+/g, ''), ...(r.tags ? r.tags.split(' ') : [])].join(' ') : '', first ? r.module : '', first ? r.category : '', first ? r.req : '',
        step, first ? r.data : '', i === r.steps.length - 1 ? r.expected : '', first ? r.status : '', first ? r.actual || r.reason : '', first ? r.defect : '', first ? r.automationPath : '',
      ].map(csvCell).join(','));
    });
  }
  fs.writeFileSync(path.join(REPORTS, 'qmetry-import.csv'), '﻿' + out.join('\r\n'));
}

function writeReconciliation({ summary, rows }) {
  const s = summary;
  const lines = [
    `# Coverage reconciliation – ${FORM}`,
    '',
    `Generated ${s.generatedAt} from test-results/results.json (last run) and reports/discovered.json.`,
    '',
    '| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |',
    '|---|---|---|---|---|---|---|---|---|---|',
    `| ${s.generated} | ${s.automated} | ${s.discovered} | ${s.executed} | ${s.passed} | ${s.failed} | ${s.blocked} | ${s.skipped} | ${s.notExecuted} | ${s.na} |`,
    '',
    `Passed + Failed + Blocked + Skipped + Not Executed + N/A = ${s.passed + s.failed + s.blocked + s.skipped + s.notExecuted + s.na} (${s.reconciles ? 'reconciles with' : 'DOES NOT reconcile with'} Generated = ${s.generated}).`,
    'Executed = Passed + Failed (a skipped test is not counted as executed).',
    '',
    '## Per test case',
    '',
    '| ID | Script | Discovered | Executed | Status | Expected verified | Reason / note |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.id} | ${r.automationPath || '–'} | ${r.discovered ? 'yes' : 'no'} | ${r.executed ? 'yes' : 'no'} | ${r.status} | ${r.expectedVerified ? 'yes' : 'no'} | ${(r.reason || '').replace(/\|/g, '/')} |`),
  ];
  fs.writeFileSync(path.join(REPORTS, 'reconciliation.md'), lines.join('\n'));
}

function writeHtml({ summary, rows }) {
  const s = summary;
  const data = JSON.stringify(rows).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(FORM)} QMetry Report</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--ink:#1d2330;--muted:#677084;--line:#e3e6ec;--pass:#1a7f4b;--fail:#c62828;--block:#b35c00;--skip:#5b6472;--ne:#6d4bb5;--na:#8a94a6;--accent:#2457c5}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#14171c;--card:#1d2128;--ink:#e6e9ef;--muted:#9aa3b2;--line:#2c323c;--pass:#4cc38a;--fail:#ff6b6b;--block:#f0a24a;--skip:#9aa3b2;--ne:#b39cf0;--na:#7d8696;--accent:#7aa2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,Segoe UI,Roboto,sans-serif}
main{max-width:1400px;margin:0 auto;padding:20px 16px}h1{font-size:22px;margin:0 0 4px}.sub{color:var(--muted);margin-bottom:16px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px}.card b{display:block;font-size:22px}.card span{color:var(--muted);font-size:12px}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.bar input,.bar select{padding:7px 9px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)}.bar input{flex:1;min-width:200px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);background:var(--bg);position:sticky;top:0}
tr.main{cursor:pointer}tr.main:hover{background:var(--bg)}.st{font-weight:600;font-size:12px;white-space:nowrap}
.PASSED{color:var(--pass)}.FAILED{color:var(--fail)}.BLOCKED{color:var(--block)}.SKIPPED{color:var(--skip)}.NOT{color:var(--ne)}.NA{color:var(--na)}
.detail td{background:var(--bg)}.detail dl{display:grid;grid-template-columns:150px 1fr;gap:4px 12px;margin:0}.detail dt{color:var(--muted)}.detail dd{margin:0;white-space:pre-wrap;word-break:break-word}
pre{white-space:pre-wrap;margin:0;font-size:12px}a{color:var(--accent)}.wrap{overflow-x:auto}
</style></head><body><main>
<h1>${esc(FORM)} – Functional Test Report</h1>
<div class="sub">${esc(MODULE)} · ${esc(s.baseURL)} · report built ${esc(s.generatedAt)}${s.runStats ? ` · run started ${esc(s.runStats.startTime)} (${Math.round(s.runStats.duration / 1000)} s)` : ' · no execution results found'}</div>
<div class="cards">
${[['Generated', s.generated], ['Automated', s.automated], ['Discovered', s.discovered], ['Executed', s.executed], ['Passed', s.passed, 'PASSED'], ['Failed', s.failed, 'FAILED'], ['Blocked', s.blocked, 'BLOCKED'], ['Skipped', s.skipped, 'SKIPPED'], ['Not executed', s.notExecuted, 'NOT'], ['N/A', s.na, 'NA']]
    .map(([k, v, c]) => `<div class="card"><b class="${c || ''}">${v}</b><span>${k}</span></div>`).join('')}
</div>
<div class="sub">${s.reconciles ? 'Totals reconcile' : 'Totals DO NOT reconcile'}: Passed + Failed + Blocked + Skipped + Not executed + N/A = Generated. Executed counts only Passed and Failed.</div>
<h2 style="font-size:16px;margin:18px 0 8px">Test types (${CATEGORIES.length} categories) – click a row to filter</h2>
<div class="wrap" style="margin-bottom:16px"><table><thead><tr><th>Category</th><th>Cases</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Not executed</th><th>N/A</th><th>Test IDs</th></tr></thead><tbody>
${CATEGORIES.map(([cat]) => { const rs = rows.filter((r) => r.category === cat); const n = (st) => rs.filter((r) => r.status === st).length;
    return `<tr class="main" onclick="document.getElementById('fc').value='${esc(cat)}';render();document.getElementById('fc').scrollIntoView()"><td>${esc(cat)}</td><td>${rs.length}</td><td class="PASSED">${n('PASSED') || ''}</td><td class="FAILED">${n('FAILED') || ''}</td><td class="SKIPPED">${n('SKIPPED') || ''}</td><td class="NOT">${n('NOT EXECUTED') || ''}</td><td class="NA">${n('N/A') || ''}</td><td>${rs.map((r) => `<span class="${r.status === 'NOT EXECUTED' ? 'NOT' : r.status === 'N/A' ? 'NA' : r.status}">${esc(r.id.replace(/^TC_[A-Z0-9]+_/, ''))}</span>`).join(' ')}</td></tr>`; }).join('')}
</tbody></table></div>
<div class="bar"><input id="q" placeholder="Search ID, scenario, actual result…"><select id="fs"><option value="">All statuses</option>${['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED', 'NOT EXECUTED', 'N/A'].map((x) => `<option>${x}</option>`).join('')}</select>
<select id="fp"><option value="">All priorities</option><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select><select id="fc"><option value="">All categories (${rows.length})</option>${CATEGORIES.map(([cat]) => `<option value="${esc(cat)}">${esc(cat)} (${rows.filter((r) => r.category === cat).length})</option>`).join('')}</select><select id="ft"><option value="">All detailed types</option></select></div>
<div class="wrap"><table><thead><tr><th>ID</th><th>Scenario</th><th>Category</th><th>Type</th><th>Priority</th><th>Status</th><th>Duration</th><th>Defect</th></tr></thead><tbody id="tb"></tbody></table></div>
</main><script>
const rows=${data};
const cls=s=>s==='NOT EXECUTED'?'NOT':s==='N/A'?'NA':s;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ft=document.getElementById('ft');[...new Set(rows.map(r=>r.type))].sort().forEach(t=>ft.add(new Option(t,t)));
function render(){const fc=document.getElementById('fc').value,q=document.getElementById('q').value.toLowerCase(),fs=document.getElementById('fs').value,fp=document.getElementById('fp').value,t=ft.value;
document.getElementById('tb').innerHTML=rows.filter(r=>(!fc||r.category===fc)&&(!fs||r.status===fs)&&(!fp||r.priority===fp)&&(!t||r.type===t)&&(!q||JSON.stringify(r).toLowerCase().includes(q))).map(r=>
'<tr class="main" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden"><td>'+e(r.id)+'</td><td>'+e(r.scenario)+'</td><td>'+e(r.category)+'</td><td>'+e(r.type)+'</td><td>'+e(r.priority)+'</td><td class="st '+cls(r.status)+'">'+e(r.status)+'</td><td>'+(r.duration!=null?r.duration+' s':'–')+'</td><td>'+e(r.defect)+'</td></tr>'+
'<tr class="detail" hidden><td colspan="8"><dl><dt>Requirement</dt><dd>'+e(r.req)+'</dd><dt>Module / Feature</dt><dd>'+e(r.module+' / '+r.screen+' / '+r.feature)+'</dd><dt>Preconditions</dt><dd>'+e(r.pre)+'</dd><dt>Test data</dt><dd>'+e(r.data)+'</dd><dt>Steps to produce</dt><dd>'+r.steps.map((s,i)=>(i+1)+'. '+e(s)).join('<br>')+'</dd><dt>Expected</dt><dd>'+e(r.expected)+'</dd><dt>Actual</dt><dd>'+e(r.actual||'–')+'</dd>'+(r.reason?'<dt>Reason</dt><dd>'+e(r.reason)+'</dd>':'')+(r.error?'<dt>Error</dt><dd><pre>'+e(r.error)+'</pre></dd>':'')+'<dt>Evidence</dt><dd>'+(r.evidence.length?r.evidence.map(a=>'<a href="'+e(a.path)+'" target="_blank">'+e(a.name)+'</a>').join(' · '):'–')+'</dd><dt>Script</dt><dd>'+e(r.automationPath||'not automated')+'</dd><dt>Executed at</dt><dd>'+e(r.timestamp||'–')+'</dd></dl></td></tr>').join('');}
['q','fc','fs','fp','ft'].forEach(id=>document.getElementById(id).addEventListener('input',render));render();
</script></body></html>`;
  fs.writeFileSync(path.join(REPORTS, 'QMetryReport.html'), html);
}

function main() {
  require('../config/env');
  if (!fs.existsSync(path.join(ROOT, 'test-data', 'test-cases.js'))) { console.error(`Not a form folder: ${ROOT}`); process.exit(1); }
  fs.mkdirSync(REPORTS, { recursive: true });
  const report = build();
  fs.writeFileSync(path.join(REPORTS, 'execution-results.json'), JSON.stringify(report, null, 2));
  writeCsv(report.rows);
  writeReconciliation(report);
  writeHtml(report);
  const s = report.summary;
  console.log(`Generated ${s.generated} | Automated ${s.automated} | Discovered ${s.discovered} | Executed ${s.executed} | Passed ${s.passed} | Failed ${s.failed} | Blocked ${s.blocked} | Skipped ${s.skipped} | Not Executed ${s.notExecuted} | N/A ${s.na} | reconciles: ${s.reconciles}`);
  const missing = [...new Set(report.rows.filter((r) => r.automated && !r.discovered).map((r) => r.id))];
  if (missing.length && s.discoveryAvailable) console.log(`Inventory cases without a discovered script: ${missing.join(', ')}`);
  console.log(`Report: ${path.join(REPORTS, 'QMetryReport.html')}`);
}

if (require.main === module) main();
module.exports = { build };

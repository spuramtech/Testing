// One end-to-end flow = ONE contact → ONE estimate → ONE token → ONE loan → its barcodes → inventory → disbursal.
// Every step stores what it created in test-data/current-flow.json and the next steps use ONLY those values.
// `npm run contact` starts a new flow (overwrites the file). Steps never fall back to other loans/contacts.
const fs = require('fs');
const path = require('path');

const FLOW_FILE = path.resolve(__dirname, '../test-data/current-flow.json');
const ORDER = 'contact → scheme → estimate → estimate-approval → (estimate-external) → estimate-checker → token → barcode → vault → safe → inventory → stock-audit → disbursal → disbursal-approval → scheduled-jobs → loan-receipt';

function read() {
  return fs.existsSync(FLOW_FILE) ? JSON.parse(fs.readFileSync(FLOW_FILE, 'utf8')) : {};
}

// Merge new values into the flow and keep a step log
function update(step, values) {
  const cur = read();
  const next = { ...cur, ...values, updatedAt: new Date().toISOString() };
  next.steps = [...(cur.steps || []), { step, at: new Date().toISOString(), ...values }];
  fs.writeFileSync(FLOW_FILE, JSON.stringify(next, null, 2));
  return next;
}

// Keep a copy of a flow in test-data/flows/<flowId>.json
function archive(data = read()) {
  if (!data.flowId) return null;
  const dir = path.resolve(__dirname, '../test-data/flows');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${data.flowId}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

// Start a brand-new flow (used by the contact test); the previous flow is archived first
function start(values) {
  archive();
  const flow = { flowId: `FLOW-${Date.now()}`, env: process.env.BASE_URL || '', startedAt: new Date().toISOString(), ...values };
  flow.steps = [{ step: 'contact', at: flow.startedAt, ...values }];
  fs.writeFileSync(FLOW_FILE, JSON.stringify(flow, null, 2));
  return flow;
}

// Value that MUST exist for this step; otherwise a clear error telling which step to run first
function need(key, runFirst) {
  const flow = read();
  if (!flow[key]) {
    throw new Error(`current-flow.json has no "${key}". This step only works on the current flow's own data – run "npm run ${runFirst}" first.\nFlow order: ${ORDER}`);
  }
  if (flow.env && process.env.BASE_URL && flow.env !== process.env.BASE_URL) {
    throw new Error(`current-flow.json was created on ${flow.env} but BASE_URL is ${process.env.BASE_URL}. Start a new flow with "npm run contact".`);
  }
  return flow[key];
}

// Title-case as the app displays names ("AUTOTEST GDBHCJ QA" → "Autotest Gdbhcj Qa")
function displayName(name) {
  return String(name).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { FLOW_FILE, read, update, start, need, archive, displayName, ORDER };

// SIMULATED pending estimates for the approval screens.
// The queue only shows real work when someone has just saved an estimate, and every real action is permanent.
// These helpers answer the app's own GET calls with a synthetic estimate (built from an anonymised real one in
// test-data/samples) so Verify / Review / Approve / Revert screens can be tested without touching server data.
const sampleDetail = require('../test-data/samples/estimate-detail.json');
const sampleHistory = require('../test-data/samples/status-history.json');

const clone = (o) => JSON.parse(JSON.stringify(o));

// Build an estimate in `status`. entries = number of appraisal entries (checker chooses one); makerId = pMakerby.
function buildEstimate({ ge, status, entries = 1, makerId = 15, ia2Id = 82, id = 990001 }) {
  const d = clone(sampleDetail);
  Object.assign(d, {
    precordid: id, pGenumber: ge, pStatus: status, pMakerby: makerId, pInternalAppraiser1UserId: makerId, pInternalAppraiser2UserId: ia2Id,
    pSelectedEntryId: null, pFinalapprovedvalue: null, pFinalapprovedby: null, pFinalapprovedat: null, pResultuniqueid: null,
    pAppraisersrequired: entries, pAppraisalscompletedcount: entries, pIsedmdrequired: false, pEdmdstatus: null,
  });
  const base = d.pAppraisals[0];
  d.pAppraisals = Array.from({ length: entries }, (_, i) => {
    const e = clone(base);
    const factor = 1 - i * 0.02; // each further appraiser values 2 % lower
    Object.assign(e, {
      pEntryid: id * 10 + i, pEstimateid: id, pSequence: i + 1, pMakeruserid: i === 0 ? makerId : 1000 + i,
      pEstimatedvalue: Math.round(base.pEstimatedvalue * factor * 100) / 100, pRategram: Math.round(base.pRategram * factor * 100) / 100,
      pInternalApprovedBy: status === 'PENDING_IA_APPROVAL' ? null : ia2Id,
    });
    e.pArticles = (e.pArticles || []).map((a) => ({ ...a, pEstimateid: id, pAppraisalentryid: e.pEntryid }));
    return e;
  });
  d.pCurrenthighestvalue = Math.max(...d.pAppraisals.map((e) => e.pEstimatedvalue));
  return d;
}

function buildHistory(est) {
  return clone(sampleHistory).slice(0, 1).map((h) => ({ ...h, pEstimateid: est.precordid, pAction: 'SUBMIT', pRemarks: 'Simulated estimate for automated tests' }));
}

// Serve `est` for every read the screens make. listRoutes: inbox endpoints that should contain it.
async function serve(page, est, listRoutes) {
  const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  for (const name of listRoutes) {
    await page.route(new RegExp(`goldestimate/${name}\\b`, 'i'), async (route) => {
      if (name === 'GetGoldEstimateQueue') {
        const res = await route.fetch();
        const real = await res.json().catch(() => []);
        return json(route, [est, ...real.filter((r) => r.pGenumber !== est.pGenumber)]);
      }
      return json(route, [est]);
    });
  }
  await page.route(new RegExp(`GetGoldEstimateByGeNumber\\?genumber=${est.pGenumber}`, 'i'), (route) => json(route, est));
  await page.route(new RegExp(`GetGoldEstimateStatusHistory\\?estimateid=${est.precordid}\\b`, 'i'), (route) => json(route, buildHistory(est)));
}

module.exports = { buildEstimate, serve, SIM_IA2_GE: 'GE9999999901', SIM_CHECKER_GE: 'GE9999999902' };

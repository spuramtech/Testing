// API helpers: the app calls its API on a separate host (sessionStorage.apiURL) with a Bearer token and a schema-name header.
// captureApi(page, /pattern/) records the app's own request for an endpoint so a test can replay it with different auth.

function captureApi(page, pattern) {
  const hits = [];
  page.on('request', (r) => { if (pattern.test(r.url())) hits.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }); });
  page.on('response', async (r) => {
    if (!pattern.test(r.url())) return;
    const hit = [...hits].reverse().find((h) => h.url === r.url() && !h.status);
    if (hit) { hit.status = r.status(); hit.text = await r.text().catch(() => ''); }
  });
  return hits;
}

// Replay a captured GET with the given Authorization value ('' = none)
async function replay(page, hit, authorization) {
  const headers = { ...hit.headers };
  delete headers.authorization;
  if (authorization) headers.authorization = authorization;
  const res = await page.request.get(hit.url, { headers });
  return { status: res.status(), text: await res.text() };
}

module.exports = { captureApi, replay };

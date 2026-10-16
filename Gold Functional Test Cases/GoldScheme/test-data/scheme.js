// Unique dummy Gold scheme per run.
function uniqueScheme() {
  const tag = Date.now().toString().slice(-5);
  return {
    loan: 'New Gold (GLNG)',
    code: `AT-${tag}`,
    name: `AUTOTEST SCHEME ${tag}`,
    tenure: Number(process.env.SCHEME_TENURE || 9),
    // Bullet = interest accrues over the whole tenure; Monthly = Regular Monthly Repayment (interest settled monthly)
    type: /month/i.test(process.env.SCHEME_TYPE || '') ? 'Monthly' : 'Bullet',
    rate: Number(process.env.SCHEME_RATE || 18), // % p.a. → paise/mo = rate / 12
    active: true,
  };
}

module.exports = { uniqueScheme };

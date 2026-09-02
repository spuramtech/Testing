const { ApiClient } = require('./apiClient');

/**
 * Reusable API operations for the Charge resource, against the real backend
 * at API_BASE_URL (https://demonbfc-api.finsta.co.in/api).
 *
 * fetchChargeList and login were confirmed via a live DevTools/network
 * capture on 2026-09-01. createCharge/updateCharge/deleteCharge/
 * fetchChargeById were NOT captured (doing so would create/mutate a live
 * record) — they're a best-effort guess following the confirmed
 * "/loans/masters/ChargesMaster/..." controller naming convention and MUST
 * be reconfirmed via network capture before relying on their results.
 */
class ChargeApi extends ApiClient {
  async createCharge(payload) {
    return this.post('/loans/masters/ChargesMaster/SaveChargesMaster', payload);
  }

  async updateCharge(id, payload) {
    return this.post('/loans/masters/ChargesMaster/SaveChargesMaster', { ...payload, id });
  }

  async deleteCharge(id) {
    return this.delete(`/loans/masters/ChargesMaster/DeleteChargesMaster?id=${id}`);
  }

  async fetchChargeList(params = {}) {
    return this.get('/loans/masters/ChargesMaster/GetChargesName', {
      params: { chargeStatus: 'ALL', ...params },
    });
  }

  async fetchChargeById(id) {
    return this.get(`/loans/masters/ChargesMaster/GetChargesName?chargeStatus=ALL&id=${id}`);
  }

  async login(username, password) {
    return this.post('/login', {
      pUserName: username,
      pPassword: password,
      pbranchid: '',
      pbranchname: '',
      ptoken: '',
      pOtp: '',
    });
  }
}

module.exports = { ChargeApi };

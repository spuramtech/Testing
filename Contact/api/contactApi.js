// Real endpoints captured live via network trace while navigating the
// Contact List and the 8-tab New Contact form (see
// CONTACT_FORM_AUTOMATION_PROMPT.md). Create/Update Contact endpoints are
// still unknown since triggering them requires an actual @destructive
// Save across all 8 tabs.
const ApiClient = require('./apiClient');

class ContactApi {
  constructor(token) {
    this.client = new ApiClient(undefined, token);
  }

  async init() {
    await this.client.init();
  }

  getContactsGridView({ endindex = 0, limitcount = 10, searchvalue = '', contactType = 'Individual' } = {}) {
    return this.client.get('/api/loans/masters/contactmasterNew/GetcontactviewByName', {
      ViewName: 'Contacts',
      endindex,
      limitcount,
      searchcondition: 'ALL',
      searchvalue,
      pContacttype: contactType,
    });
  }

  getContactCount(searchby = '') {
    return this.client.get('/api/loans/masters/contactmasterNew/GetContactCount', { ViewName: 'Contacts', searchby });
  }

  getContactsList() {
    return this.client.get('/api/loans/masters/contactmasterNew/GetContactsList');
  }

  getCountries() {
    return this.client.get('/api/Settings/getCountries');
  }

  getStates(countryId = 1) {
    return this.client.get('/api/Settings/getStates', { id: countryId });
  }

  getAddressType(contactType = 'Individual') {
    return this.client.get('/api/loans/masters/contactmasterNew/GetAddressType', { contactype: contactType });
  }

  getDesignations() {
    return this.client.get('/api/loans/masters/contactmasterNew/GetDesignations');
  }

  getDocumentGroupNames() {
    return this.client.get('/api/loans/masters/documentsmaster/GetDocumentGroupNames');
  }

  getBankNamesDistinct() {
    return this.client.get('/api/Accounting/Masters/GetBankNamesDistinct');
  }

  async dispose() {
    await this.client.dispose();
  }
}

module.exports = ContactApi;

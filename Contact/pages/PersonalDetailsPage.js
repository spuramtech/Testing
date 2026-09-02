const BasePage = require('./BasePage');
const { RESIDENTIAL_STATUS, MARITAL_STATUS } = require('../constants/appConstants');

// Scoped to #personal container (see AddressDetailsPage comment on why).
// Note: the live DOM renders the two "presidentialstatus" radios with the
// SAME id on both — an app bug, not a locator issue — targeted by index.
class PersonalDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#personal');
    const fc = (name) => this.container.locator(`[formcontrolname="${name}"]`);
    // This app systematically reuses the same id on a field's <label> and
    // its <input>/<select> — every field lookup below is tag-scoped.
    this.placeOfBirthInput = this.container.locator('input#pplaceofbirth');
    this.nationalityDropdown = fc('pnationality');
    this.communityDetailsDropdown = fc('pminoritycommunity');
    this.religionDropdown = this.container.locator('select#Religion');
    this.residentialStatusRadios = fc('presidentialstatus');
    // Both Resident/Non-Resident options share id="presidentialstatus" (an
    // app bug) so label[for=...] can't disambiguate them either — target
    // the raw inputs directly via forceCheckRadio instead of clicking.
    this.residentRadio = this.residentialStatusRadios.nth(0);
    this.nonResidentRadio = this.residentialStatusRadios.nth(1);
    this.marriedRadio = this.container.locator('#Married');
    this.unmarriedRadio = this.container.locator('#Single');
    this.divorcedRadio = this.container.locator('#Divorced');
    this.separatedRadio = this.container.locator('#Separated');
    this.widowedRadio = this.container.locator('#Widowed');
  }

  async setResidentialStatus(status) {
    const radio = status === RESIDENTIAL_STATUS.NON_RESIDENT ? this.nonResidentRadio : this.residentRadio;
    await this.forceCheckRadio(radio);
  }

  async setMaritalStatus(status) {
    const map = {
      [MARITAL_STATUS.MARRIED]: this.marriedRadio,
      [MARITAL_STATUS.UNMARRIED]: this.unmarriedRadio,
      [MARITAL_STATUS.DIVORCED]: this.divorcedRadio,
      [MARITAL_STATUS.SEPARATED]: this.separatedRadio,
      [MARITAL_STATUS.WIDOWED]: this.widowedRadio,
    };
    await this.forceCheckRadio(map[status]);
  }

  async fillBirthDetails({ placeOfBirth, nationality, religion }) {
    if (placeOfBirth) await this.fill(this.placeOfBirthInput, placeOfBirth);
    if (nationality) await this.selectDropdown(this.nationalityDropdown, nationality);
    if (religion) await this.selectDropdown(this.religionDropdown, religion);
  }
}

module.exports = PersonalDetailsPage;

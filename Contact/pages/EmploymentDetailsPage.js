const BasePage = require('./BasePage');
const { EMPLOYMENT_TYPE } = require('../constants/appConstants');

// Scoped to #Employement container (id spelling matches the app's own typo).
class EmploymentDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#Employement');
    // Radios are zero-size/off-screen (a11y-hidden pattern) — click their
    // <label> instead, same as a real user would.
    this.employedToggle = this.container.locator('label[for="employed"]');
    this.selfEmployedToggle = this.container.locator('label[for="selfemployed"]');
    this.othersToggle = this.container.locator('label[for="others"]');
    // id="pnameoftheorganization" is shared by both the <label> and the
    // <input> in the live DOM — scope to the input element specifically.
    this.organizationNameInput = this.container.locator('input#pnameoftheorganization');
    // This app systematically reuses the same id on a field's <label> and
    // its <input>/<select> — every field lookup below is tag-scoped.
    this.natureOfOrganizationDropdown = this.container.locator('select#pEnterpriseType');
    this.employmentRoleInput = this.container.locator('input#pemploymentrole');
    this.officeAddressInput = this.container.locator('textarea#pofficeaddress');
    this.officePhoneInput = this.container.locator('input#pofficephoneno');
    this.totalWorkExperienceInput = this.container.locator('input#ptotalworkexp');
    this.reportingToInput = this.container.locator('input#preportingto');
    this.employmentInCurrentCompanyInput = this.container.locator('input#pemployeeexp');
    this.employmentDurationUnitDropdown = this.container.locator('select#pemployeeexptype');
  }

  async selectEmploymentType(type) {
    const map = {
      [EMPLOYMENT_TYPE.EMPLOYED]: this.employedToggle,
      [EMPLOYMENT_TYPE.SELF_EMPLOYED]: this.selfEmployedToggle,
      [EMPLOYMENT_TYPE.OTHERS]: this.othersToggle,
    };
    await this.click(map[type]);
  }

  async fillEmployedDetails({ organizationName, employmentRole, officePhone, totalWorkExperience, reportingTo }) {
    if (organizationName) await this.fill(this.organizationNameInput, organizationName);
    if (employmentRole) await this.fill(this.employmentRoleInput, employmentRole);
    if (officePhone) await this.fill(this.officePhoneInput, officePhone);
    if (totalWorkExperience) await this.fill(this.totalWorkExperienceInput, totalWorkExperience);
    if (reportingTo) await this.fill(this.reportingToInput, reportingTo);
  }
}

module.exports = EmploymentDetailsPage;

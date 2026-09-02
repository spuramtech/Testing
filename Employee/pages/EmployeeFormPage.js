const BasePage = require('./BasePage');
const { ROUTES } = require('../constants/appConstants');

// Verified live via sidebar ids and formcontrolname attributes on the
// Add/Edit Employee form (#/Contact/ContactToEmployees).
// IMPORTANT: ng-select index 0 on this page is the app's global top-left
// "nav-search-custom" search box, NOT part of this form — every ng-select
// locator below is scoped to exclude it.
class EmployeeFormPage extends BasePage {
  constructor(page) {
    super(page);
    const formNgSelects = page.locator('ng-select:not(.nav-search-custom)');
    this.employeeNameCombobox = formNgSelects.nth(0);
    this.designationCombobox = formNgSelects.nth(1);
    this.roleCombobox = formNgSelects.nth(2);

    this.basicSalaryInput = page.locator('[formcontrolname="pEmploymentBasicSalary"]');
    this.allowanceInput = page.locator('[formcontrolname="pEmploymentAllowanceORvda"]');
    this.dateOfJoiningInput = page.locator('[formcontrolname="pEmploymentJoiningDate"]');
    // "Total Cost to Company (CTC) : <amount>" is a plain read-only text
    // label, not an input — no formcontrolname on it.
    this.ctcText = page.locator('text=/Total Cost to Company \\(CTC\\)/');

    this.designationAddButton = page.locator('button.btn.btn-lg-icon').nth(0);
    this.roleAddButton = page.locator('button.btn.btn-lg-icon').nth(1);

    // Verified live: Clear is an <a class="btn">, Save is a real <button>
    // (same split pattern discovered on the Contact module). The page also
    // carries hidden modals (Designation/Role "add new" popups, an EMI
    // calculator) that each have their own "Clear"/grid — scope to
    // :visible so those never get matched instead.
    this.clearButton = page.locator('a.btn:visible', { hasText: 'Clear' });
    this.saveButton = page.locator('button:visible', { hasText: 'Save' });
    // Note: unlike Clear/Save, this "View" <a> itself reports as not
    // :visible to Playwright (likely a zero-size wrapper around its
    // visible inner <span>) even though it renders and is clickable —
    // verified live as the only match without :visible, so it's omitted.
    this.viewButton = page.locator('a', { hasText: /^View$/ });
  }

  async open() {
    await this.click(this.page.locator('#a0'));
    await this.click(this.page.locator('#mhalltitle66'));
    await this.click(this.page.locator('#msm327'));
    await this.page.waitForURL(/ContactToEmployees(?!View)/, { timeout: 15000 }).catch(() => null);
  }

  async fillMandatory({ employeeName, basicSalary, allowance, designation, role, dateOfJoining }) {
    if (employeeName) await this.selectNgOption(this.employeeNameCombobox, employeeName);
    // Verified live: the CTC recalculation only reacts to real keystroke
    // events, not a single programmatic .fill() — use pressSequentially
    // (real typing) or CTC silently stays stale/zero, a fragile
    // keyup-driven binding rather than proper reactive valueChanges.
    await this.basicSalaryInput.waitFor({ state: 'visible' });
    await this.basicSalaryInput.pressSequentially(String(basicSalary), { delay: 30 });
    await this.allowanceInput.waitFor({ state: 'visible' });
    await this.allowanceInput.pressSequentially(String(allowance), { delay: 30 });
    if (designation) await this.selectNgOption(this.designationCombobox, designation);
    if (role) await this.selectNgOption(this.roleCombobox, role);
    if (dateOfJoining) await this.fill(this.dateOfJoiningInput, dateOfJoining);
    await this.page.waitForTimeout(400);
  }

  async getCtcText() {
    return (await this.ctcText.textContent()).trim();
  }

  async save() {
    // Navigation links on this app (View, sidebar) reproducibly crashed
    // the renderer under Playwright's actionability-checked click during
    // exploration — Save is a plain in-page button, not a navigation, and
    // did not exhibit this, so a normal click is used here.
    await this.click(this.saveButton);
    await this.page.waitForTimeout(1000);
  }

  async clear() {
    await this.click(this.clearButton);
  }

  // The "View" back-link crashed the Chromium renderer when clicked
  // through Playwright's normal actionability-checked .click() during
  // exploration of this app — dispatch the click directly instead.
  async goToList() {
    await this.clickViaDispatch(this.viewButton);
    await this.page.waitForURL(/ContactToEmployeesView/, { timeout: 15000 }).catch(() => null);
  }
}

module.exports = EmployeeFormPage;

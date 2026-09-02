const BasePage = require('./BasePage');

// Verified live via formcontrolname attributes on ContactNew > Contact Info.
class ContactInfoPage extends BasePage {
  constructor(page) {
    super(page);
    const fc = (name) => page.locator(`[formcontrolname="${name}"]`);
    this.firstNameInput = fc('pName');
    this.middleNameInput = fc('pMiddleName');
    this.lastNameInput = fc('pSurName');
    this.fatherFirstNameInput = fc('pFatherName');
    this.fatherLastNameInput = fc('pFatherLastName');
    this.motherFirstNameInput = fc('pMotherFirstName');
    this.motherLastNameInput = fc('pMotherLastName');
    this.spouseFirstNameInput = fc('pSpouseName');
    this.spouseLastNameInput = fc('pSpouseLastName');
    this.uploadPhotoInput = page.locator('#upload');
    this.uploadSignatureInput = page.locator('#uploadSignature');
    this.dobInput = fc('pDob');
    this.ageInput = fc('pAge');
    // Radios are zero-size/off-screen (a11y-hidden pattern) — click their
    // <label> instead, same as a real user would.
    this.genderMaleRadio = page.locator('label[for="male"]');
    this.genderFemaleRadio = page.locator('label[for="female"]');
    this.genderThirdRadio = page.locator('label[for="tgender"]');
    this.ckycNumberInput = fc('pCKYCNumber');
    this.contactNumberInput = fc('pContactNumber');
    this.emailInput = fc('pEmailId');
  }

  async fillMandatory({ firstName, dob, gender }) {
    if (firstName) await this.fill(this.firstNameInput, firstName);
    await this.fillReadonlyDate(this.dobInput, dob);
    const genderMap = { Male: this.genderMaleRadio, Female: this.genderFemaleRadio };
    await this.click(genderMap[gender] || this.genderMaleRadio);
  }

  async fillFullName({ firstName, middleName, lastName }) {
    await this.fill(this.firstNameInput, firstName);
    if (middleName) await this.fill(this.middleNameInput, middleName);
    if (lastName) await this.fill(this.lastNameInput, lastName);
  }

  async uploadPhoto(filePath) {
    await this.uploadFile(this.uploadPhotoInput, filePath);
  }

  async uploadSignature(filePath) {
    await this.uploadFile(this.uploadSignatureInput, filePath);
  }
}

module.exports = ContactInfoPage;

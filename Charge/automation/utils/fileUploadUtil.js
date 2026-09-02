/**
 * Uploads a file via a native <input type="file"> locator.
 * Works whether the input is hidden behind a styled "Upload" button.
 */
async function uploadFile(page, inputLocator, filePath) {
  const input = typeof inputLocator === 'string' ? page.locator(inputLocator) : inputLocator;
  await input.setInputFiles(filePath);
}

module.exports = { uploadFile };

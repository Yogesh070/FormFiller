/**
 * Puppeteer configuration for Jest
 */
module.exports = {
  launch: {
    // Use the new headless mode instead of the old implementation
    headless: false,
    slowMo: 50,
    // Add any other Puppeteer launch options here
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // Increase timeout for slow CI environments
    timeout: 30000,
    // Don't enforce a specific Chrome version
    ignoreDefaultArgs: ['--disable-extensions'],
    // Allow Puppeteer to download and use its own Chrome if needed
    product: 'chrome',
  },
  browserContext: 'default',
};
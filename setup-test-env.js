/**
 * Script to set up the testing environment
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up testing environment...');

// Detect package manager (npm, yarn, pnpm)
let packageManager = 'npm';
if (fs.existsSync(path.join(__dirname, 'pnpm-lock.yaml'))) {
  packageManager = 'pnpm';
} else if (fs.existsSync(path.join(__dirname, 'yarn.lock'))) {
  packageManager = 'yarn';
}
console.log(`Detected package manager: ${packageManager}`);

// Install dependencies function - adapts to detected package manager
function installDependency(dependency) {
  console.log(`Installing ${dependency}...`);
  try {
    let command;
    if (packageManager === 'yarn') {
      command = `yarn add ${dependency} --dev`;
    } else if (packageManager === 'pnpm') {
      command = `pnpm add ${dependency} -D`;
    } else {
      command = `npm install ${dependency} --save-dev`;
    }
    
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to install ${dependency}:`, error.message);
    return false;
  }
}

// Check if Puppeteer is installed
try {
  require.resolve('puppeteer');
  console.log('✅ Puppeteer is installed.');
} catch (e) {
  console.log('⚠️ Puppeteer is not installed. Installing...');
  const success = installDependency('puppeteer@latest');
  if (!success) {
    console.log('⚠️ Manual installation required. Run:');
    console.log(`${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} puppeteer --${packageManager === 'npm' ? 'save-dev' : 'dev'}`);
  }
}

// Ensure jest-puppeteer is installed
try {
  require.resolve('jest-puppeteer');
  console.log('✅ jest-puppeteer is installed.');
} catch (e) {
  console.log('⚠️ jest-puppeteer is not installed. Installing...');
  const success = installDependency('jest-puppeteer@latest');
  if (!success) {
    console.log('⚠️ Manual installation required. Run:');
    console.log(`${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} jest-puppeteer --${packageManager === 'npm' ? 'save-dev' : 'dev'}`);
  }
}

// Create necessary directories if they don't exist
const testDir = path.join(__dirname, 'test');
const e2eDir = path.join(testDir, 'e2e');

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
  console.log('✅ Created test directory.');
}

if (!fs.existsSync(e2eDir)) {
  fs.mkdirSync(e2eDir);
  console.log('✅ Created e2e test directory.');
}

// Verify that our test form exists
const testFormPath = path.join(e2eDir, 'testForm.html');
if (!fs.existsSync(testFormPath)) {
  console.log('⚠️ Test form not found. Make sure to create it before running tests.');
} else {
  console.log('✅ Test form exists.');
}

// Check for proper configuration
const jestPuppeteerConfigPath = path.join(__dirname, 'jest-puppeteer.config.js');
if (!fs.existsSync(jestPuppeteerConfigPath)) {
  console.log('⚠️ jest-puppeteer.config.js not found. Creating it...');
  
  // Create a basic config file
  const configContent = `
module.exports = {
  launch: {
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    product: 'chrome',
  },
  browserContext: 'default',
};
`;
  
  fs.writeFileSync(jestPuppeteerConfigPath, configContent);
  console.log('✅ Created jest-puppeteer.config.js.');
} else {
  console.log('✅ jest-puppeteer.config.js exists.');
}

// Check for Jest E2E config
const jestE2EConfigPath = path.join(__dirname, 'jest.config.e2e.js');
if (!fs.existsSync(jestE2EConfigPath)) {
  console.log('⚠️ jest.config.e2e.js not found. Creating it...');
  
  // Create a basic config file
  const configContent = `
module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/test/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['./test/setup.ts'],
};
`;
  
  fs.writeFileSync(jestE2EConfigPath, configContent);
  console.log('✅ Created jest.config.e2e.js.');
} else {
  console.log('✅ jest.config.e2e.js exists.');
}

console.log('\nTrying to find jest-environment-puppeteer paths...');
try {
  const jestPuppeteerPath = require.resolve('jest-puppeteer');
  const jestPuppeteerDir = path.dirname(jestPuppeteerPath);
  const setupPath = path.join(jestPuppeteerDir, '..', 'jest-environment-puppeteer', 'setup.js');
  const teardownPath = path.join(jestPuppeteerDir, '..', 'jest-environment-puppeteer', 'teardown.js');
  
  console.log(`Using detected paths:
    - Setup: ${fs.existsSync(setupPath) ? '✅ Found' : '❌ Not found'}: ${setupPath}
    - Teardown: ${fs.existsSync(teardownPath) ? '✅ Found' : '❌ Not found'}: ${teardownPath}`);
} catch (error) {
  console.log('⚠️ Could not resolve jest-puppeteer paths. Using preset instead.');
}

console.log('\nEnvironment setup complete. You can now run tests with:');
console.log(`${packageManager} run test:e2e`);
console.log('\nIf you still encounter issues, try:');
console.log(`${packageManager === 'npm' ? 'npx' : packageManager} jest --config jest.config.e2e.js --detectOpenHandles`);
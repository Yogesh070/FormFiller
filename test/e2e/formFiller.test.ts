import * as path from 'path';
import { ElementHandle, Page } from 'puppeteer';

describe('Form Filler Extension E2E Tests', () => {
  let testFormUrl: string;
  let page: Page;
  
  beforeAll(async () => {
    // Set up the test form URL
    const testFormPath = path.resolve(__dirname, './testForm.html');
    testFormUrl = `file://${testFormPath}`;
  });
  
  beforeEach(async () => {
    // Create a new page for each test using the global browser instance
    page = await (global as any).browser.newPage();
    // Reset the page before each test
    await page.goto(testFormUrl);
    await page.waitForSelector('form#testForm');
  });
  
  afterEach(async () => {
    // Close the page after each test
    await page.close();
  });
  
  /**
   * Helper function to load extension content script into the page
   * This simulates the extension being installed
   */
  async function injectExtensionScript() {
    // Load and evaluate the form field detector
    const fieldDetectorPath = path.resolve(__dirname, '../../dist/content.js');
    await page.addScriptTag({ path: fieldDetectorPath });
    
    // Wait for script execution
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Helper function to get the value of a form element
   */
  async function getFormElementValue(selector: string): Promise<string> {
    return await page.$eval(selector, (el) => {
      const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      return input.value;
    });
  }
  
  /**
   * Helper function to check if a checkbox is checked
   */
  async function isCheckboxChecked(selector: string): Promise<boolean> {
    return await page.$eval(selector, (el) => {
      const checkbox = el as HTMLInputElement;
      return checkbox.checked;
    });
  }
  
  /**
   * Helper function to trigger form filling
   */
  async function triggerFormFill() {
    // Execute our extension's fillForms function directly in the page context
    await page.evaluate(() => {
      // Access the global instance or create a temporary one
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        altKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });
    
    // Wait for the form filling to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  test('Extension script can be injected into the page', async () => {
    await injectExtensionScript();
    
    // Check if the script was injected by looking for a global variable or function
    const extensionLoaded = await page.evaluate(() => {
      return typeof window.chrome !== 'undefined';
    });
    
    expect(extensionLoaded).toBe(true);
  });
  
  test('Form fields can be detected', async () => {
    await injectExtensionScript();
    
    // Execute the field detection directly
    const detectedFields = await page.evaluate(() => {
      // Access our injected FieldDetector
      const detector = new (window as any).FieldDetector();
      return detector.detectFields();
    });
    
    // We should have detected all the fields in our test form
    expect(detectedFields.length).toBeGreaterThan(0);
    
    // Check that key fields were detected
    const fieldNames = detectedFields.map((field: any) => field.name);
    expect(fieldNames).toContain('firstName');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('password');
  });
  
  test('Form fields can be filled automatically', async () => {
    await injectExtensionScript();
    
    // Trigger form filling
    await triggerFormFill();
    
    // Check that fields were populated with expected values
    const firstName = await getFormElementValue('#firstName');
    const lastName = await getFormElementValue('#lastName');
    const email = await getFormElementValue('#email');
    const phone = await getFormElementValue('#phone');
    
    // These should match our static mappings
    expect(firstName).toBe('John');
    expect(lastName).toBe('Doe');
    expect(email).toBe('test@example.com');
    expect(phone).toBe('555-123-4567');
    
    // Check that checkboxes were set correctly
    const termsChecked = await isCheckboxChecked('#terms');
    expect(termsChecked).toBe(true);
  });
  
  test('Select elements are populated correctly', async () => {
    await injectExtensionScript();
    
    // Trigger form filling
    await triggerFormFill();
    
    // Check that select elements have a value
    const gender = await getFormElementValue('#gender');
    expect(gender).not.toBe('');
  });
  
  test('Form can be submitted after auto-filling', async () => {
    await injectExtensionScript();
    
    // Trigger form filling
    await triggerFormFill();
    
    // Click the submit button
    const submitButton: ElementHandle<Element> | null = await page.$('#submitBtn');
    
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    // Set up listener for dialog (alert)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Form submitted successfully!');
      await dialog.accept();
    });
    
    // Submit the form
    await submitButton.click();
    
    // Wait for the alert to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  test('All field types are filled appropriately', async () => {
    await injectExtensionScript();
    
    // Trigger form filling
    await triggerFormFill();
    
    // Check various field types
    const password = await getFormElementValue('#password');
    expect(password).toBe('Password123!');
    
    const address = await getFormElementValue('#address');
    expect(address).toBe('123 Main St');
    
    const city = await getFormElementValue('#city');
    expect(city).toBe('New York');
    
    const comments = await getFormElementValue('#comments');
    expect(comments).toBe('This is a test message from the form filler extension.');
    
    const website = await getFormElementValue('#website');
    expect(website).toBe('https://example.com');
    
    const dob = await getFormElementValue('#dob');
    expect(dob).not.toBe('');
  });
});
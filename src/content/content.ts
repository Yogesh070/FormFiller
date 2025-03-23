import { FormFiller } from './formFiller';
import { logger } from '../utils/logger';
import { MessageType, ExtensionMessage } from '../utils/types';
import { storageService } from '../utils/storage';
import { FieldDetector } from './fieldDetector';

// Expose classes for testing
declare global {
  interface Window {
    FieldDetector: typeof FieldDetector;
    FormFiller: typeof FormFiller;
  }
}

// Expose classes to window for testing
window.FieldDetector = FieldDetector;
window.FormFiller = FormFiller;

/**
 * Content script that runs in the context of web pages
 * Handles form detection and filling based on user actions and configuration
 */
class ContentScript {
  private formFiller: FormFiller | null = null;
  
  /**
   * Initialize the content script
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing Form Filler extension content script');
    
    try {
      // Load configuration
      const config = await storageService.getConfig();
      
      // Initialize form filler with the field mappings
      this.formFiller = new FormFiller(config.fieldMappings);
      
      // Set up message listeners
      this.setupMessageListeners();
      
      // Auto-fill forms if enabled
      if (config.enabled && config.autoFillOnLoad) {
        // Wait for the page to fully load
        if (document.readyState === 'complete') {
          this.fillForms();
        } else {
          window.addEventListener('load', () => this.fillForms());
        }
      }
      
      // Add a keyboard shortcut for manual filling (Alt+F)
      document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key === 'f') {
          event.preventDefault();
          this.fillForms();
        }
      });
      
      logger.info('Form Filler extension initialized successfully');
    } catch (error) {
      logger.error('Error initializing Form Filler extension', error);
    }
  }
  
  /**
   * Set up message listeners for communication with the background script
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      switch (message.type) {
        case MessageType.FILL_FORM:
          this.fillForms();
          sendResponse({ success: true });
          break;
          
        case MessageType.TOGGLE_ENABLED:
          // Update enabled state, will be used on next fill
          sendResponse({ success: true });
          break;
          
        case MessageType.GET_CONFIG:
          // Config is handled by the background script
          sendResponse({ success: true });
          break;
          
        default:
          logger.debug(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      // Return true to indicate that the response is sent asynchronously
      return true;
    });
  }
  
  /**
   * Fill forms on the current page
   */
  private async fillForms(): Promise<void> {
    try {
      logger.info('Filling forms');
      
      if (!this.formFiller) {
        const config = await storageService.getConfig();
        this.formFiller = new FormFiller(config.fieldMappings);
      }
      
      // Allow a small delay for dynamic forms to fully load
      setTimeout(() => {
        const filledCount = this.formFiller!.fillForms();
        
        // Notify the background script of the result
        chrome.runtime.sendMessage({
          type: MessageType.FORM_FILLED,
          payload: { filledCount }
        });
      }, 300);
    } catch (error) {
      logger.error('Error filling forms', error);
      
      // Notify the background script of the error
      chrome.runtime.sendMessage({
        type: MessageType.ERROR,
        payload: { error: 'Failed to fill forms' }
      });
    }
  }
}

// Initialize the content script
const contentScript = new ContentScript();
contentScript.initialize().catch((error) => {
  logger.error('Failed to initialize content script', error);
});
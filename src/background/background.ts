import { MessageType, ExtensionMessage, LogLevel, FormConfig } from '../utils/types';
import { storageService } from '../utils/storage';

/**
 * Background script for the form filler extension
 * Manages extension state and handles communication between popup and content scripts
 */
class BackgroundScript {
  private logs: Array<{ level: LogLevel; message: string; timestamp: string }> = [];
  
  /**
   * Initialize the background script
   */
  public initialize(): void {
    console.info('Initializing Form Filler extension background script');
    
    // Set up message listeners
    this.setupMessageListeners();
    
    // Set up context menu
    this.setupContextMenu();
    
    // Set up browser action click handler
    chrome.action.onClicked.addListener((tab) => {
      // If the user clicks the extension icon, show the popup
      // This is a fallback in case the popup doesn't open automatically
      if (tab.id) {
        this.sendMessageToContent(tab.id, { type: MessageType.FILL_FORM })
          .catch(error => console.error('Error sending fill form message:', error));
      }
    });
  }
  
  /**
   * Set up message listeners for communication with popup and content scripts
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      // Handle messages from popup
      switch (message.type) {
        case MessageType.FILL_FORM:
          this.handleFillForm(sender.tab?.id, sendResponse)
            .catch(error => {
              console.error('Error handling fill form:', error);
              sendResponse({ success: false, error: 'Failed to fill forms' });
            });
          break;
          
        case MessageType.TOGGLE_ENABLED:
          this.handleToggleEnabled(message.payload?.enabled, sendResponse)
            .catch(error => {
              console.error('Error handling toggle enabled:', error);
              sendResponse({ success: false, error: 'Failed to toggle enabled state' });
            });
          break;
          
        case MessageType.GET_CONFIG:
          this.handleGetConfig(sendResponse)
            .catch(error => {
              console.error('Error handling get config:', error);
              sendResponse({ success: false, error: 'Failed to get configuration' });
            });
          break;
          
        case MessageType.SET_CONFIG:
          this.handleSetConfig(message.payload as FormConfig, sendResponse)
            .catch(error => {
              console.error('Error handling set config:', error);
              sendResponse({ success: false, error: 'Failed to set configuration' });
            });
          break;
          
        case MessageType.FORM_FILLED:
          // Log the result
          console.info(`Forms filled: ${message.payload?.filledCount}`);
          sendResponse({ success: true });
          break;
          
        case MessageType.LOG:
          // Store logs from content scripts
          const logData = message.payload;
          if (logData && typeof logData === 'object' && 'level' in logData && 'message' in logData) {
            this.logs.push({
              level: logData.level as LogLevel,
              message: logData.message as string,
              timestamp: logData.timestamp as string || new Date().toISOString()
            });
            
            // Trim logs if they get too long
            if (this.logs.length > 1000) {
              this.logs = this.logs.slice(-1000);
            }
          }
          sendResponse({ success: true });
          break;
          
        case MessageType.ERROR:
          console.error('Error from content script:', message.payload?.error);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      // Return true to indicate that the response is sent asynchronously
      return true;
    });
  }
  
  /**
   * Set up context menu items
   */
  private setupContextMenu(): void {
    // Add context menu item to fill forms
    chrome.contextMenus.create({
      id: 'fill-form',
      title: 'Fill form',
      contexts: ['page', 'editable']
    });
    
    // Add context menu handler
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'fill-form' && tab?.id) {
        this.sendMessageToContent(tab.id, { type: MessageType.FILL_FORM })
          .catch(error => console.error('Error sending fill form message:', error));
      }
    });
  }
  
  /**
   * Handle the fill form message
   * @param tabId The ID of the tab to fill forms in
   * @param sendResponse Callback to send a response
   */
  private async handleFillForm(tabId: number | undefined, sendResponse: (response: any) => void): Promise<void> {
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID provided' });
      return;
    }
    
    try {
      // Check if extension is enabled
      const config = await storageService.getConfig();
      
      if (!config.enabled) {
        sendResponse({ success: false, error: 'Extension is disabled' });
        return;
      }
      
      // Send message to content script to fill forms and wait for response
      const response = await this.sendMessageToContent(tabId, { type: MessageType.FILL_FORM });
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fill forms');
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling fill form:', error);
      sendResponse({ success: false, error: 'Failed to fill forms' });
      throw error;
    }
  }
  
  /**
   * Handle the toggle enabled message
   * @param enabled Whether the extension should be enabled
   * @param sendResponse Callback to send a response
   */
  private async handleToggleEnabled(enabled: boolean | undefined, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (typeof enabled !== 'boolean') {
        sendResponse({ success: false, error: 'No enabled state provided' });
        return;
      }
      
      // Update the configuration
      const config = await storageService.getConfig();
      config.enabled = enabled;
      await storageService.saveConfig(config);
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling toggle enabled:', error);
      sendResponse({ success: false, error: 'Failed to toggle enabled state' });
      throw error;
    }
  }
  
  /**
   * Handle the get config message
   * @param sendResponse Callback to send a response
   */
  private async handleGetConfig(sendResponse: (response: any) => void): Promise<void> {
    try {
      const config = await storageService.getConfig();
      sendResponse({ success: true, config });
    } catch (error) {
      console.error('Error handling get config:', error);
      sendResponse({ success: false, error: 'Failed to get configuration' });
      throw error;
    }
  }
  
  /**
   * Handle the set config message
   * @param config The configuration to set
   * @param sendResponse Callback to send a response
   */
  private async handleSetConfig(config: FormConfig, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!config || typeof config !== 'object') {
        sendResponse({ success: false, error: 'Invalid configuration provided' });
        return;
      }
      
      await storageService.saveConfig(config);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling set config:', error);
      sendResponse({ success: false, error: 'Failed to set configuration' });
      throw error;
    }
  }
  
  /**
   * Send a message to a content script
   * @param tabId The ID of the tab to send the message to
   * @param message The message to send
   * @returns Promise that resolves with the response
   */
  private sendMessageToContent(tabId: number, message: ExtensionMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  }
  
  /**
   * Get all logs from content scripts
   * @returns Array of logs
   */
  public getLogs(): Array<{ level: LogLevel; message: string; timestamp: string }> {
    return this.logs;
  }
}

// Initialize the background script
const backgroundScript = new BackgroundScript();
backgroundScript.initialize();
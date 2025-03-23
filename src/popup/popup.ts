import { MessageType, FormConfig } from '../utils/types';

/**
 * Popup script for the form filler extension
 * Handles user interaction with the extension popup
 */
class PopupScript {
  private enableToggle: HTMLInputElement;
  private autoFillToggle: HTMLInputElement;
  private fillFormsBtn: HTMLButtonElement;
  private optionsBtn: HTMLButtonElement;
  private statusText: HTMLElement;
  private config: FormConfig | null = null;
  
  /**
   * Initialize the popup script
   */
  constructor() {
    // Get elements
    this.enableToggle = document.getElementById('enableToggle') as HTMLInputElement;
    this.autoFillToggle = document.getElementById('autoFillToggle') as HTMLInputElement;
    this.fillFormsBtn = document.getElementById('fillFormsBtn') as HTMLButtonElement;
    this.optionsBtn = document.getElementById('optionsBtn') as HTMLButtonElement;
    this.statusText = document.getElementById('statusText') as HTMLElement;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load configuration
    this.loadConfig();
  }
  
  /**
   * Set up event listeners for popup elements
   */
  private setupEventListeners(): void {
    // Enable toggle
    this.enableToggle.addEventListener('change', () => {
      const enabled = this.enableToggle.checked;
      this.statusText.textContent = enabled ? 'Enabled' : 'Disabled';
      this.updateConfig({ enabled });
    });
    
    // Auto-fill toggle
    this.autoFillToggle.addEventListener('change', () => {
      const autoFillOnLoad = this.autoFillToggle.checked;
      this.updateConfig({ autoFillOnLoad });
    });
    
    // Fill forms button
    this.fillFormsBtn.addEventListener('click', () => {
      this.fillForms();
    });
    
    // Options button
    this.optionsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        // Fallback for browsers that don't support openOptionsPage
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  }
  
  /**
   * Load the extension configuration
   */
  private async loadConfig(): Promise<void> {
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || !tabs[0] || !tabs[0].id) {
        console.error('Could not get active tab');
        return;
      }
      
      // Get the configuration
      chrome.runtime.sendMessage(
        { type: MessageType.GET_CONFIG },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting configuration:', chrome.runtime.lastError);
            return;
          }
          
          if (!response.success) {
            console.error('Failed to get configuration:', response.error);
            return;
          }
          
          this.config = response.config;
          
          // Update UI based on configuration
          this.updateUI();
        }
      );
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }
  
  /**
   * Update the UI based on the current configuration
   */
  private updateUI(): void {
    if (!this.config) return;
    
    this.enableToggle.checked = this.config.enabled;
    this.autoFillToggle.checked = this.config.autoFillOnLoad;
    this.statusText.textContent = this.config.enabled ? 'Enabled' : 'Disabled';
    
    // Disable buttons if extension is disabled
    this.fillFormsBtn.disabled = !this.config.enabled;
    this.autoFillToggle.disabled = !this.config.enabled;
  }
  
  /**
   * Update the extension configuration
   * @param configUpdate Partial configuration to update
   */
  private updateConfig(configUpdate: Partial<FormConfig>): void {
    if (!this.config) return;
    
    // Update the local config
    this.config = { ...this.config, ...configUpdate };
    
    // Send the updated config to the background script
    chrome.runtime.sendMessage(
      { type: MessageType.SET_CONFIG, payload: this.config },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error updating configuration:', chrome.runtime.lastError);
          return;
        }
        
        if (!response.success) {
          console.error('Failed to update configuration:', response.error);
          return;
        }
        
        // Update UI after config change
        this.updateUI();
      }
    );
  }
  
  /**
   * Send a message to fill forms in the active tab
   */
  private async fillForms(): Promise<void> {
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || !tabs[0] || !tabs[0].id) {
        console.error('Could not get active tab');
        return;
      }
      
      const tabId = tabs[0].id;
      
      // Send message to fill forms
      chrome.tabs.sendMessage(
        tabId,
        { type: MessageType.FILL_FORM },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error filling forms:', chrome.runtime.lastError);
            return;
          }
          
          if (!response || !response.success) {
            console.error('Failed to fill forms:', response?.error);
            return;
          }
          
          // Flash the button to indicate success
          this.fillFormsBtn.classList.add('success');
          setTimeout(() => {
            this.fillFormsBtn.classList.remove('success');
          }, 2000);
        }
      );
    } catch (error) {
      console.error('Error filling forms:', error);
    }
  }
}

// Initialize the popup script when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupScript();
});
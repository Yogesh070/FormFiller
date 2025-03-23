import { FormConfig, FieldMapping, FieldType } from './types';
import { logger } from './logger';

/**
 * Default form field mappings for PHASE1
 * These are static mappings that will be replaced with dynamic mappings in PHASE2
 */
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    type: FieldType.EMAIL,
    keywords: ['email', 'e-mail'],
    value: 'test@example.com',
  },
  {
    type: FieldType.PASSWORD,
    keywords: ['password', 'passwd', 'pass'],
    value: 'Password123!',
  },
  {
    name: 'firstName',
    keywords: ['first name', 'firstname', 'given name', 'forename'],
    value: 'John',
  },
  {
    name: 'lastName',
    keywords: ['last name', 'lastname', 'surname', 'family name'],
    value: 'Doe',
  },
  {
    type: FieldType.TELEPHONE,
    keywords: ['phone', 'mobile', 'cell', 'telephone'],
    value: '555-123-4567',
  },
  {
    keywords: ['address', 'street'],
    value: '123 Main St',
  },
  {
    keywords: ['city', 'town'],
    value: 'New York',
  },
  {
    keywords: ['state', 'province', 'region'],
    value: 'NY',
  },
  {
    keywords: ['zip', 'postal', 'postcode'],
    value: '10001',
  },
  {
    keywords: ['country'],
    value: 'United States',
  },
  {
    type: FieldType.DATE,
    keywords: ['birth', 'dob', 'date of birth'],
    value: '1990-01-01',
  },
  {
    type: FieldType.CHECKBOX,
    keywords: ['terms', 'agree', 'consent', 'accept'],
    value: true,
  },
  {
    type: FieldType.CHECKBOX,
    keywords: ['newsletter', 'subscribe', 'updates'],
    value: false,
  },
  {
    type: FieldType.TEXTAREA,
    keywords: ['message', 'comments', 'feedback'],
    value: 'This is a test message from the form filler extension.',
  },
  {
    type: FieldType.SELECT,
    keywords: ['gender'],
    value: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  {
    type: FieldType.SELECT,
    keywords: ['title', 'prefix', 'salutation'],
    value: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
  },
  {
    type: FieldType.URL,
    keywords: ['website', 'site', 'url', 'web'],
    value: 'https://example.com',
  },
  {
    type: FieldType.NUMBER,
    keywords: ['age'],
    value: '30',
  },
];

/**
 * Default extension configuration
 */
const DEFAULT_CONFIG: FormConfig = {
  enabled: true,
  autoFillOnLoad: false,
  fieldMappings: DEFAULT_FIELD_MAPPINGS,
};

/**
 * Storage utility for the extension
 * Handles persistence of extension configuration
 */
class StorageService {
  private readonly CONFIG_KEY = 'form_filler_config';
  
  /**
   * Get the current extension configuration
   * @returns Promise that resolves to the current configuration
   */
  public async getConfig(): Promise<FormConfig> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([this.CONFIG_KEY], (result) => {
          const config = result[this.CONFIG_KEY] as FormConfig;
          resolve(config || DEFAULT_CONFIG);
        });
      } else {
        // Fallback for testing environments
        logger.warn('Chrome storage not available, using default config');
        resolve(DEFAULT_CONFIG);
      }
    });
  }

  /**
   * Save the extension configuration
   * @param config The configuration to save
   * @returns Promise that resolves when the configuration is saved
   */
  public async saveConfig(config: FormConfig): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ [this.CONFIG_KEY]: config }, () => {
          logger.info('Configuration saved', config);
          resolve();
        });
      } else {
        // Fallback for testing environments
        logger.warn('Chrome storage not available, config not saved');
        resolve();
      }
    });
  }

  /**
   * Reset the extension configuration to default values
   * @returns Promise that resolves when the configuration is reset
   */
  public async resetConfig(): Promise<void> {
    return this.saveConfig(DEFAULT_CONFIG);
  }
}

// Export a singleton instance
export const storageService = new StorageService();
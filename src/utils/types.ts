/**
 * Types for the form filler extension
 */

/**
 * Enum for the field types that can be detected and filled
 */
export enum FieldType {
    TEXT = 'text',
    EMAIL = 'email',
    PASSWORD = 'password',
    TELEPHONE = 'tel',
    NUMBER = 'number',
    DATE = 'date',
    TEXTAREA = 'textarea',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
    URL = 'url',
    SEARCH = 'search',
    COLOR = 'color',
    RANGE = 'range',
    FILE = 'file',
    MONTH = 'month',
    WEEK = 'week',
    TIME = 'time',
    DATETIME = 'datetime-local',
    UNKNOWN = 'unknown'
  }
  
  /**
   * Interface for detected form fields
   */
  export interface DetectedField {
    id: string;
    name: string;
    type: FieldType;
    element: HTMLElement;
    label?: string;
    placeholder?: string;
    // Additional attributes that might help with identification
    attributes: Record<string, string>;
  }
  
  /**
   * Interface for form field mapping (static in PHASE1)
   * Will be enhanced in PHASE2 for dynamic data management
   */
  export interface FieldMapping {
    id?: string;
    name?: string;
    type?: FieldType;
    label?: string;
    placeholder?: string;
    // For fuzzy matching, contains keywords that might appear in field attributes
    keywords?: string[];
    // Default value to fill in
    value: string | boolean | string[];
  }
  
  /**
   * Form configuration interface
   */
  export interface FormConfig {
    // Whether the extension is enabled
    enabled: boolean;
    // Whether to auto-fill forms on page load
    autoFillOnLoad: boolean;
    // Field mappings by type
    fieldMappings: FieldMapping[];
  }
  
  /**
   * Log levels for the logger
   */
  export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
  }
  
  /**
   * Extension message types for communication between components
   */
  export enum MessageType {
    FILL_FORM = 'FILL_FORM',
    TOGGLE_ENABLED = 'TOGGLE_ENABLED',
    GET_CONFIG = 'GET_CONFIG',
    SET_CONFIG = 'SET_CONFIG',
    FORM_FILLED = 'FORM_FILLED',
    LOG = 'LOG',
    ERROR = 'ERROR'
  }
  
  /**
   * Extension message interface
   */
  export interface ExtensionMessage {
    type: MessageType;
    payload?: any;
  }
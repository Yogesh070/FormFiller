import { DetectedField, FieldType } from '../utils/types';
import { logger } from '../utils/logger';

/**
 * Field detector class
 * Responsible for detecting form fields in the page DOM
 */
export class FieldDetector {
  /**
   * Detect all form fields in the document
   * @returns Array of detected form fields
   */
  public detectFields(): DetectedField[] {
    logger.debug('Detecting form fields');
    
    const detectedFields: DetectedField[] = [];
    
    // Find all form elements
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      const formFields = this.detectFieldsInForm(form);
      detectedFields.push(...formFields);
    });
    
    // Some pages might have form fields outside of <form> tags
    // so we also look for common input elements throughout the page
    if (detectedFields.length === 0) {
      logger.debug('No form tags found, scanning for inputs directly');
      const pageFields = this.detectFieldsInElement(document.body);
      detectedFields.push(...pageFields);
    }
    
    logger.info(`Detected ${detectedFields.length} form fields`);
    return detectedFields;
  }
  
  /**
   * Detect form fields within a specific form element
   * @param form The form element to scan
   * @returns Array of detected form fields
   */
  private detectFieldsInForm(form: HTMLFormElement): DetectedField[] {
    return this.detectFieldsInElement(form);
  }
  
  /**
   * Detect form fields within any element
   * @param element The element to scan
   * @returns Array of detected form fields
   */
  private detectFieldsInElement(element: HTMLElement): DetectedField[] {
    const detectedFields: DetectedField[] = [];
    
    // Find all input elements
    const inputs = element.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      try {
        const field = this.createDetectedField(input as HTMLElement);
        if (field) {
          detectedFields.push(field);
        }
      } catch (error) {
        logger.error('Error detecting field', error);
      }
    });
    
    return detectedFields;
  }
  
  /**
   * Create a DetectedField object from an HTML element
   * @param element The element to convert
   * @returns The DetectedField object or null if not a supported field
   */
  private createDetectedField(element: HTMLElement): DetectedField | null {
    // Skip hidden fields and submit buttons
    if (
      element.getAttribute('type') === 'hidden' ||
      element.getAttribute('type') === 'submit' ||
      element.getAttribute('type') === 'button' ||
      element.getAttribute('type') === 'image' ||
      element.getAttribute('type') === 'reset' ||
      element.hasAttribute('disabled')
    ) {
      return null;
    }
    
    const id = element.getAttribute('id') || '';
    const name = element.getAttribute('name') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    
    // If the element has no id, name, or placeholder, it's probably not a fillable field
    if (!id && !name && !placeholder) {
      return null;
    }
    
    const type = this.determineFieldType(element);
    const label = this.findLabelForElement(element);
    
    // Gather all attributes for better field identification
    const attributes: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value;
    });
    
    // Check if the field is likely to be an auto-complete field
    if (
      element.getAttribute('autocomplete') === 'off' ||
      element.hasAttribute('readonly') ||
      element.getAttribute('role') === 'combobox'
    ) {
      attributes['isAutoComplete'] = 'true';
    }
    
    return {
      id,
      name,
      type,
      element,
      label,
      placeholder,
      attributes,
    };
  }
  
  /**
   * Determine the type of a field based on the element
   * @param element The element to check
   * @returns The field type
   */
  private determineFieldType(element: HTMLElement): FieldType {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'textarea') {
      return FieldType.TEXTAREA;
    }
    
    if (tagName === 'select') {
      return FieldType.SELECT;
    }
    
    if (tagName === 'input') {
      const inputElement = element as HTMLInputElement;
      const typeAttr = inputElement.getAttribute('type');
      
      switch (typeAttr) {
        case 'text': return FieldType.TEXT;
        case 'email': return FieldType.EMAIL;
        case 'password': return FieldType.PASSWORD;
        case 'tel': return FieldType.TELEPHONE;
        case 'number': return FieldType.NUMBER;
        case 'date': return FieldType.DATE;
        case 'checkbox': return FieldType.CHECKBOX;
        case 'radio': return FieldType.RADIO;
        case 'url': return FieldType.URL;
        case 'search': return FieldType.SEARCH;
        case 'color': return FieldType.COLOR;
        case 'range': return FieldType.RANGE;
        case 'file': return FieldType.FILE;
        case 'month': return FieldType.MONTH;
        case 'week': return FieldType.WEEK;
        case 'time': return FieldType.TIME;
        case 'datetime-local': return FieldType.DATETIME;
        default: return FieldType.TEXT; // Default to text for unrecognized types
      }
    }
    
    return FieldType.UNKNOWN;
  }
  
  /**
   * Find the label text for an element
   * @param element The element to find a label for
   * @returns The label text or undefined if no label found
   */
  private findLabelForElement(element: HTMLElement): string | undefined {
    const id = element.getAttribute('id');
    let labelText: string | undefined;
    
    // Method 1: Find <label> with for="elementId"
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        labelText = label.textContent?.trim();
      }
    }
    
    // Method 2: Find parent <label> that contains this element
    if (!labelText) {
      let parent = element.parentElement;
      while (parent) {
        if (parent.tagName.toLowerCase() === 'label') {
          labelText = parent.textContent?.trim();
          // Remove the text of the element itself from the label text
          const elementText = element.textContent?.trim();
          if (labelText && elementText) {
            labelText = labelText.replace(elementText, '').trim();
          }
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    // Method 3: Check for aria-label
    if (!labelText) {
      labelText = element.getAttribute('aria-label') || undefined;
    }
    
    // Method 4: Check for aria-labelledby
    if (!labelText) {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelElement = document.getElementById(labelledBy);
        if (labelElement) {
          labelText = labelElement.textContent?.trim();
        }
      }
    }
    
    return labelText;
  }
}
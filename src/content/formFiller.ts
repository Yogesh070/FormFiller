import { DetectedField, FieldMapping, FieldType } from '../utils/types';
import { logger } from '../utils/logger';
import { FieldDetector } from './fieldDetector';

/**
 * FormFiller class
 * Responsible for filling detected form fields with mapped values
 */
export class FormFiller {
  private fieldDetector: FieldDetector;
  private fieldMappings: FieldMapping[];
  
  /**
   * Constructor for FormFiller
   * @param fieldMappings The field mappings to use for filling forms
   */
  constructor(fieldMappings: FieldMapping[]) {
    this.fieldDetector = new FieldDetector();
    this.fieldMappings = fieldMappings;
  }
  
  /**
   * Update field mappings
   * @param fieldMappings The new field mappings
   */
  public updateFieldMappings(fieldMappings: FieldMapping[]): void {
    this.fieldMappings = fieldMappings;
  }
  
  /**
   * Fill all forms on the current page
   * @returns Number of fields filled
   */
  public fillForms(): number {
    const detectedFields = this.fieldDetector.detectFields();
    let filledCount = 0;
    
    detectedFields.forEach((field) => {
      const filled = this.fillField(field);
      if (filled) filledCount++;
    });
    
    logger.info(`Filled ${filledCount} out of ${detectedFields.length} detected fields`);
    return filledCount;
  }
  
  /**
   * Fill a specific form field
   * @param field The field to fill
   * @returns Whether the field was filled successfully
   */
  private fillField(field: DetectedField): boolean {
    try {
      // Find the best matching field mapping
      const mapping = this.findBestMapping(field);
      
      if (!mapping) {
        logger.debug(`No mapping found for field: ${field.id || field.name}`, field);
        return false;
      }
      
      // Get the value to fill
      const value = mapping.value;
      
      // Fill the field based on its type
      switch (field.type) {
        case FieldType.TEXT:
        case FieldType.EMAIL:
        case FieldType.PASSWORD:
        case FieldType.TELEPHONE:
        case FieldType.NUMBER:
        case FieldType.URL:
        case FieldType.SEARCH:
        case FieldType.DATE:
        case FieldType.MONTH:
        case FieldType.WEEK:
        case FieldType.TIME:
        case FieldType.DATETIME:
          return this.fillInputField(field.element as HTMLInputElement, value as string);
        
        case FieldType.TEXTAREA:
          return this.fillTextareaField(field.element as HTMLTextAreaElement, value as string);
        
        case FieldType.SELECT:
          return this.fillSelectField(field.element as HTMLSelectElement, value as string | string[]);
        
        case FieldType.CHECKBOX:
        case FieldType.RADIO:
          return this.fillToggleField(field.element as HTMLInputElement, value as boolean);
        
        default:
          logger.debug(`Unsupported field type: ${field.type}`, field);
          return false;
      }
    } catch (error) {
      logger.error(`Error filling field: ${field.id || field.name}`, error);
      return false;
    }
  }
  
  /**
   * Find the best matching field mapping for a detected field
   * @param field The detected field
   * @returns The best matching field mapping or undefined if no match found
   */
  private findBestMapping(field: DetectedField): FieldMapping | undefined {
    // Priority 1: Match by ID
    if (field.id) {
      const idMatch = this.fieldMappings.find(m => m.id === field.id);
      if (idMatch) return idMatch;
    }
    
    // Priority 2: Match by name
    if (field.name) {
      const nameMatch = this.fieldMappings.find(m => m.name === field.name);
      if (nameMatch) return nameMatch;
    }
    
    // Priority 3: Match by type and label/placeholder keywords
    const typeMatches = this.fieldMappings.filter(m => !m.id && !m.name && m.type === field.type);
    
    if (typeMatches.length > 0) {
      // Look for keyword matches in label and placeholder
      const keywords: string[] = [];
      
      if (field.label) keywords.push(field.label.toLowerCase());
      if (field.placeholder) keywords.push(field.placeholder.toLowerCase());
      
      // Add attribute values that might contain useful information
      const usefulAttrs = ['title', 'alt', 'aria-label', 'data-label'];
      usefulAttrs.forEach(attr => {
        const value = field.attributes[attr];
        if (value) keywords.push(value.toLowerCase());
      });
      
      // Check for matches with field name
      if (field.name) keywords.push(field.name.toLowerCase());
      
      // Find the mapping with the most keyword matches
      let bestMatch: FieldMapping | undefined;
      let bestMatchScore = 0;
      
      typeMatches.forEach(mapping => {
        if (!mapping.keywords) return;
        
        let score = 0;
        mapping.keywords.forEach(keyword => {
          const keywordLower = keyword.toLowerCase();
          keywords.forEach(fieldKeyword => {
            if (fieldKeyword.includes(keywordLower)) {
              score++;
              // Exact matches are worth more
              if (fieldKeyword === keywordLower) score++;
            }
          });
        });
        
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = mapping;
        }
      });
      
      if (bestMatch) return bestMatch;
    }
    
    // Priority 4: Match by label/placeholder keywords for any type
    const keywordMatches = this.fieldMappings.filter(m => !m.id && !m.name && m.keywords && m.keywords.length > 0);
    
    if (keywordMatches.length > 0 && (field.label || field.placeholder || field.name)) {
      const fieldText = [
        field.label,
        field.placeholder,
        field.name,
        ...Object.values(field.attributes)
      ].filter(Boolean).join(' ').toLowerCase();
      
      let bestMatch: FieldMapping | undefined;
      let bestMatchScore = 0;
      
      keywordMatches.forEach(mapping => {
        if (!mapping.keywords) return;
        
        let score = 0;
        mapping.keywords.forEach(keyword => {
          if (fieldText.includes(keyword.toLowerCase())) {
            score++;
          }
        });
        
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = mapping;
        }
      });
      
      if (bestMatch) return bestMatch;
    }
    
    // Priority 5: Fall back to a type match if available
    return this.fieldMappings.find(m => m.type === field.type);
  }
  
  /**
   * Fill an input field
   * @param input The input element
   * @param value The value to fill
   * @returns Whether the field was filled successfully
   */
  private fillInputField(input: HTMLInputElement, value: string): boolean {
    // Skip readonly and disabled fields
    if (input.readOnly || input.disabled) {
      logger.debug(`Field is read-only or disabled: ${input.id || input.name}`);
      return false;
    }
    
    // Set the input value
    input.value = value;
    
    // Trigger input and change events to simulate user interaction
    this.triggerEvents(input, ['input', 'change']);
    
    return true;
  }
  
  /**
   * Fill a textarea field
   * @param textarea The textarea element
   * @param value The value to fill
   * @returns Whether the field was filled successfully
   */
  private fillTextareaField(textarea: HTMLTextAreaElement, value: string): boolean {
    // Skip readonly and disabled fields
    if (textarea.readOnly || textarea.disabled) {
      logger.debug(`Field is read-only or disabled: ${textarea.id || textarea.name}`);
      return false;
    }
    
    // Set the textarea value
    textarea.value = value;
    
    // Trigger input and change events to simulate user interaction
    this.triggerEvents(textarea, ['input', 'change']);
    
    return true;
  }
  
  /**
   * Fill a select field
   * @param select The select element
   * @param value The value to fill (string or array of potential values)
   * @returns Whether the field was filled successfully
   */
  private fillSelectField(select: HTMLSelectElement, value: string | string[]): boolean {
    // Skip disabled fields
    if (select.disabled) {
      logger.debug(`Field is disabled: ${select.id || select.name}`);
      return false;
    }
    
    // Convert single value to array
    const possibleValues = Array.isArray(value) ? value : [value];
    
    // Try to find a matching option
    let matched = false;
    
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const optionValue = option.value.toLowerCase();
      const optionText = option.text.toLowerCase();
      
      for (const val of possibleValues) {
        const checkValue = val.toLowerCase();
        
        if (optionValue === checkValue || optionText === checkValue) {
          select.selectedIndex = i;
          matched = true;
          break;
        }
      }
      
      if (matched) break;
    }
    
    // If no exact match, try substring match
    if (!matched && select.options.length > 0) {
      for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const optionValue = option.value.toLowerCase();
        const optionText = option.text.toLowerCase();
        
        for (const val of possibleValues) {
          const checkValue = val.toLowerCase();
          
          if (optionValue.includes(checkValue) || optionText.includes(checkValue)) {
            select.selectedIndex = i;
            matched = true;
            break;
          }
        }
        
        if (matched) break;
      }
    }
    
    // If still no match and not the first option (index 0), select first non-placeholder option
    if (!matched && select.selectedIndex <= 0 && select.options.length > 1) {
      // Skip the first option if it looks like a placeholder
      const firstOption = select.options[0];
      const isPlaceholder = firstOption.value === '' || 
                            firstOption.text.toLowerCase().includes('select') ||
                            firstOption.text.toLowerCase().includes('choose');
      
      select.selectedIndex = isPlaceholder && select.options.length > 1 ? 1 : 0;
      matched = true;
    }
    
    // Trigger change event
    if (matched) {
      this.triggerEvents(select, ['change']);
    }
    
    return matched;
  }
  
  /**
   * Fill a checkbox or radio field
   * @param input The input element
   * @param value Whether the field should be checked
   * @returns Whether the field was filled successfully
   */
  private fillToggleField(input: HTMLInputElement, value: boolean): boolean {
    // Skip disabled fields
    if (input.disabled) {
      logger.debug(`Field is disabled: ${input.id || input.name}`);
      return false;
    }
    
    // Only change the checked state if it doesn't already match
    if (input.checked !== value) {
      input.checked = value;
      this.triggerEvents(input, ['click', 'change']);
    }
    
    return true;
  }
  
  /**
   * Trigger DOM events on an element
   * @param element The element to trigger events on
   * @param eventTypes The types of events to trigger
   */
  private triggerEvents(element: HTMLElement, eventTypes: string[]): void {
    eventTypes.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });
  }
}
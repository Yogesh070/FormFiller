import { LogLevel, MessageType } from './types';

/**
 * Logger utility for the extension
 * Provides consistent logging across different components
 */
class Logger {
  private enabled: boolean = true;
  private logLevel: LogLevel = LogLevel.INFO;

  /**
   * Enable or disable logging
   * @param enabled Whether logging is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set the minimum log level
   * @param level The minimum log level to display
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the numeric value of a log level for comparison
   * @param level The log level
   * @returns The numeric value of the log level
   */
  private getLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return 0;
      case LogLevel.INFO:
        return 1;
      case LogLevel.WARN:
        return 2;
      case LogLevel.ERROR:
        return 3;
      default:
        return 1; // Default to INFO
    }
  }

  /**
   * Check if a log level should be displayed
   * @param level The log level to check
   * @returns Whether the log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enabled && this.getLevelValue(level) >= this.getLevelValue(this.logLevel);
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[FormFiller] ${message}`, data || '');
      this.sendLogToBackground(LogLevel.DEBUG, message, data);
    }
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[FormFiller] ${message}`, data || '');
      this.sendLogToBackground(LogLevel.INFO, message, data);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[FormFiller] ${message}`, data || '');
      this.sendLogToBackground(LogLevel.WARN, message, data);
    }
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error to include in the log
   */
  public error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[FormFiller] ${message}`, error || '');
      this.sendLogToBackground(LogLevel.ERROR, message, error);
    }
  }

  /**
   * Send a log message to the background script
   * @param level The log level
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  private sendLogToBackground(level: LogLevel, message: string, data?: any): void {
    // Only send logs to background if we're in a content script (chrome.runtime exists)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: MessageType.LOG,
          payload: {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        // Ignore errors when sending logs to prevent infinite loops
      }
    }
  }
}

// Export a singleton instance
export const logger = new Logger();
/**
 * Logger utility for the Factory Enhancer Agent
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private logHandlers: ((level: LogLevel, message: string) => void)[] = [];
  
  constructor() {
    // Add console log handler by default
    this.addLogHandler((level, message) => {
      const timestamp = new Date().toISOString();
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`[${timestamp}] [DEBUG] ${message}`);
          break;
        case LogLevel.INFO:
          console.info(`[${timestamp}] [INFO] ${message}`);
          break;
        case LogLevel.WARN:
          console.warn(`[${timestamp}] [WARN] ${message}`);
          break;
        case LogLevel.ERROR:
          console.error(`[${timestamp}] [ERROR] ${message}`);
          break;
      }
    });
  }
  
  /**
   * Set the log level
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Get the current log level
   */
  public getLevel(): LogLevel {
    return this.level;
  }
  
  /**
   * Add a log handler
   */
  public addLogHandler(handler: (level: LogLevel, message: string) => void): void {
    this.logHandlers.push(handler);
  }
  
  /**
   * Remove a log handler
   */
  public removeLogHandler(handler: (level: LogLevel, message: string) => void): void {
    const index = this.logHandlers.indexOf(handler);
    
    if (index !== -1) {
      this.logHandlers.splice(index, 1);
    }
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message);
    }
  }
  
  /**
   * Log an info message
   */
  public info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message);
    }
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message);
    }
  }
  
  /**
   * Log an error message
   */
  public error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message);
    }
  }
  
  /**
   * Log a message with a specific level
   */
  private log(level: LogLevel, message: string): void {
    for (const handler of this.logHandlers) {
      try {
        handler(level, message);
      } catch (error) {
        console.error(`Error in log handler: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

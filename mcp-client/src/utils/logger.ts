/**
 * Logger utility for the Nexus MCP client.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  prefix: 'Nexus MCP',
  enableTimestamp: true,
  enableColors: true
};

/**
 * ANSI color codes
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Logger class
 */
export class Logger {
  private config: LoggerConfig;
  
  /**
   * Creates a new Logger instance.
   * @param config Logger configuration
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Sets the log level.
   * @param level Log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
  
  /**
   * Sets the log prefix.
   * @param prefix Log prefix
   */
  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }
  
  /**
   * Enables or disables timestamps.
   * @param enable Whether to enable timestamps
   */
  enableTimestamp(enable: boolean): void {
    this.config.enableTimestamp = enable;
  }
  
  /**
   * Enables or disables colors.
   * @param enable Whether to enable colors
   */
  enableColors(enable: boolean): void {
    this.config.enableColors = enable;
  }
  
  /**
   * Formats a log message.
   * @param level Log level
   * @param message Log message
   * @returns Formatted log message
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    // Add timestamp
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }
    
    // Add prefix
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }
    
    // Add level
    const levelStr = LogLevel[level];
    parts.push(`[${levelStr}]`);
    
    // Add message
    parts.push(message);
    
    // Join parts
    return parts.join(' ');
  }
  
  /**
   * Logs a debug message.
   * @param message Log message
   * @param args Additional arguments
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formattedMessage = this.format(LogLevel.DEBUG, message);
      
      if (this.config.enableColors) {
        console.debug(`${colors.dim}${formattedMessage}${colors.reset}`, ...args);
      } else {
        console.debug(formattedMessage, ...args);
      }
    }
  }
  
  /**
   * Logs an info message.
   * @param message Log message
   * @param args Additional arguments
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formattedMessage = this.format(LogLevel.INFO, message);
      
      if (this.config.enableColors) {
        console.info(`${colors.green}${formattedMessage}${colors.reset}`, ...args);
      } else {
        console.info(formattedMessage, ...args);
      }
    }
  }
  
  /**
   * Logs a warning message.
   * @param message Log message
   * @param args Additional arguments
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      const formattedMessage = this.format(LogLevel.WARN, message);
      
      if (this.config.enableColors) {
        console.warn(`${colors.yellow}${formattedMessage}${colors.reset}`, ...args);
      } else {
        console.warn(formattedMessage, ...args);
      }
    }
  }
  
  /**
   * Logs an error message.
   * @param message Log message
   * @param args Additional arguments
   */
  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formattedMessage = this.format(LogLevel.ERROR, message);
      
      if (this.config.enableColors) {
        console.error(`${colors.red}${formattedMessage}${colors.reset}`, ...args);
      } else {
        console.error(formattedMessage, ...args);
      }
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Creates a new logger instance with a specific prefix.
 * @param prefix Logger prefix
 * @returns New logger instance
 */
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix });
}

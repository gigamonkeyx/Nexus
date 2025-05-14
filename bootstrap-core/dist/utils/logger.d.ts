/**
 * Logger utility for the bootstrapping approach
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class Logger {
    private level;
    private logHandlers;
    constructor();
    /**
     * Set the log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get the current log level
     */
    getLevel(): LogLevel;
    /**
     * Add a log handler
     */
    addLogHandler(handler: (level: LogLevel, message: string) => void): void;
    /**
     * Remove a log handler
     */
    removeLogHandler(handler: (level: LogLevel, message: string) => void): void;
    /**
     * Log a debug message
     */
    debug(message: string): void;
    /**
     * Log an info message
     */
    info(message: string): void;
    /**
     * Log a warning message
     */
    warn(message: string): void;
    /**
     * Log an error message
     */
    error(message: string): void;
    /**
     * Log a message with a specific level
     */
    private log;
}
export declare const logger: Logger;
export {};

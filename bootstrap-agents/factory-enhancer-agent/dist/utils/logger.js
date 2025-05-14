"use strict";
/**
 * Logger utility for the Factory Enhancer Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor() {
        this.level = LogLevel.INFO;
        this.logHandlers = [];
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
    setLevel(level) {
        this.level = level;
    }
    /**
     * Get the current log level
     */
    getLevel() {
        return this.level;
    }
    /**
     * Add a log handler
     */
    addLogHandler(handler) {
        this.logHandlers.push(handler);
    }
    /**
     * Remove a log handler
     */
    removeLogHandler(handler) {
        const index = this.logHandlers.indexOf(handler);
        if (index !== -1) {
            this.logHandlers.splice(index, 1);
        }
    }
    /**
     * Log a debug message
     */
    debug(message) {
        if (this.level <= LogLevel.DEBUG) {
            this.log(LogLevel.DEBUG, message);
        }
    }
    /**
     * Log an info message
     */
    info(message) {
        if (this.level <= LogLevel.INFO) {
            this.log(LogLevel.INFO, message);
        }
    }
    /**
     * Log a warning message
     */
    warn(message) {
        if (this.level <= LogLevel.WARN) {
            this.log(LogLevel.WARN, message);
        }
    }
    /**
     * Log an error message
     */
    error(message) {
        if (this.level <= LogLevel.ERROR) {
            this.log(LogLevel.ERROR, message);
        }
    }
    /**
     * Log a message with a specific level
     */
    log(level, message) {
        for (const handler of this.logHandlers) {
            try {
                handler(level, message);
            }
            catch (error) {
                console.error(`Error in log handler: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
}
// Export a singleton instance
exports.logger = new Logger();

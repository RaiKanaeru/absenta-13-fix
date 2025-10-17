/**
 * Centralized Logging System
 * Sistem logging terpusat untuk aplikasi Absenta
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Log categories
export const LOG_CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  DATABASE: 'database',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  SYSTEM: 'system',
  BUSINESS: 'business',
  ERROR: 'error'
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
    this.maxFileSize = parseInt(process.env.LOG_MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.maxFiles = parseInt(process.env.LOG_MAX_FILES) || 5;
    this.enableConsole = process.env.LOG_ENABLE_CONSOLE !== 'false';
    this.enableFile = process.env.LOG_ENABLE_FILE !== 'false';
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Initialize log files
    this.initializeLogFiles();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initializeLogFiles() {
    const logFiles = [
      'application.log',
      'error.log',
      'security.log',
      'performance.log',
      'database.log'
    ];

    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }
    });
  }

  getLogLevel(level) {
    return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return this.getLogLevel(level) <= this.getLogLevel(this.logLevel);
  }

  formatMessage(level, category, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      category,
      message,
      meta: {
        ...meta,
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'localhost'
      }
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    if (!this.enableFile) return;

    const filePath = path.join(this.logDir, filename);
    
    try {
      // Check file size and rotate if necessary
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(filePath);
        }
      }

      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  rotateLogFile(filePath) {
    try {
      // Move current file to .1, .1 to .2, etc.
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${filePath}.${i}`;
        const newFile = `${filePath}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest file
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Move current file to .1
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, `${filePath}.1`);
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  log(level, category, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, category, message, meta);

    // Console output
    if (this.enableConsole) {
      const consoleMessage = `[${new Date().toISOString()}] ${level.toUpperCase()} [${category}] ${message}`;
      
      switch (level.toUpperCase()) {
        case 'ERROR':
          console.error(consoleMessage, meta);
          break;
        case 'WARN':
          console.warn(consoleMessage, meta);
          break;
        case 'DEBUG':
        case 'TRACE':
          console.debug(consoleMessage, meta);
          break;
        default:
          console.log(consoleMessage, meta);
      }
    }

    // File output
    if (this.enableFile) {
      // Write to specific log files based on category and level
      if (level.toUpperCase() === 'ERROR') {
        this.writeToFile('error.log', formattedMessage);
      }
      
      if (category === LOG_CATEGORIES.SECURITY) {
        this.writeToFile('security.log', formattedMessage);
      }
      
      if (category === LOG_CATEGORIES.PERFORMANCE) {
        this.writeToFile('performance.log', formattedMessage);
      }
      
      if (category === LOG_CATEGORIES.DATABASE) {
        this.writeToFile('database.log', formattedMessage);
      }
      
      // Always write to main application log
      this.writeToFile('application.log', formattedMessage);
    }
  }

  // Convenience methods
  error(category, message, meta = {}) {
    this.log('ERROR', category, message, meta);
  }

  warn(category, message, meta = {}) {
    this.log('WARN', category, message, meta);
  }

  info(category, message, meta = {}) {
    this.log('INFO', category, message, meta);
  }

  debug(category, message, meta = {}) {
    this.log('DEBUG', category, message, meta);
  }

  trace(category, message, meta = {}) {
    this.log('TRACE', category, message, meta);
  }

  // Specialized logging methods
  logAuth(action, username, ip, success, meta = {}) {
    this.info(LOG_CATEGORIES.AUTH, `Authentication ${action}`, {
      username,
      ip,
      success,
      ...meta
    });
  }

  logApi(method, url, statusCode, responseTime, ip, meta = {}) {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, LOG_CATEGORIES.API, `API Request`, {
      method,
      url,
      statusCode,
      responseTime,
      ip,
      ...meta
    });
  }

  logDatabase(operation, table, query, duration, meta = {}) {
    this.info(LOG_CATEGORIES.DATABASE, `Database ${operation}`, {
      table,
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...meta
    });
  }

  logSecurity(event, severity, username, ip, meta = {}) {
    const level = severity === 'critical' ? 'ERROR' : 
                  severity === 'high' ? 'WARN' : 'INFO';
    
    this.log(level, LOG_CATEGORIES.SECURITY, `Security Event: ${event}`, {
      severity,
      username,
      ip,
      ...meta
    });
  }

  logPerformance(operation, duration, meta = {}) {
    const level = duration > 5000 ? 'WARN' : 'INFO'; // Warn if > 5 seconds
    
    this.log(level, LOG_CATEGORIES.PERFORMANCE, `Performance: ${operation}`, {
      duration,
      ...meta
    });
  }

  logBusiness(action, entity, entityId, meta = {}) {
    this.info(LOG_CATEGORIES.BUSINESS, `Business Action: ${action}`, {
      entity,
      entityId,
      ...meta
    });
  }

  // Log analysis methods
  getLogStats() {
    const stats = {
      totalLogs: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0,
      categories: {}
    };

    try {
      const logFiles = fs.readdirSync(this.logDir);
      
      logFiles.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            try {
              const logEntry = JSON.parse(line);
              stats.totalLogs++;
              
              switch (logEntry.level) {
                case 'ERROR':
                  stats.errors++;
                  break;
                case 'WARN':
                  stats.warnings++;
                  break;
                case 'INFO':
                  stats.info++;
                  break;
                case 'DEBUG':
                  stats.debug++;
                  break;
              }
              
              if (logEntry.category) {
                stats.categories[logEntry.category] = (stats.categories[logEntry.category] || 0) + 1;
              }
            } catch (error) {
              // Skip invalid JSON lines
            }
          });
        }
      });
    } catch (error) {
      console.error('Error analyzing logs:', error);
    }

    return stats;
  }

  // Cleanup old logs
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const logFiles = fs.readdirSync(this.logDir);
      
      logFiles.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;


import Constants from 'expo-constants';

// Determine if we're in development
const isDev = __DEV__ || Constants.expoConfig?.extra?.isDev;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private currentLevel: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = isDev ? LogLevel.DEBUG : LogLevel.NONE) {
    this.currentLevel = level;
    this.prefix = '[CupCircle]';
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return [`${this.prefix} ${timestamp} [${level}] ${message}`, ...args];
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(...this.formatMessage('DEBUG', message, ...args));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(...this.formatMessage('INFO', message, ...args));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.formatMessage('WARN', message, ...args));
    }
  }

  error(message: string, error?: any, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (error) {
        console.error(...this.formatMessage('ERROR', message, ...args), error);
      } else {
        console.error(...this.formatMessage('ERROR', message, ...args));
      }
    }
  }

  // Convenience method for API calls
  api(method: string, url: string, data?: any) {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }

  // Convenience method for user actions
  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data);
  }

  // Convenience method for navigation
  navigation(from: string, to: string) {
    this.debug(`Navigation: ${from} -> ${to}`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for easy imports
export default logger;

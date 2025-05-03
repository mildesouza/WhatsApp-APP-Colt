import { LogLevel, LogMessage } from '../types/logger';

class Logger {
  private static instance: Logger;
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    };
  }

  public info(message: string, data?: unknown): void {
    const logMessage = this.formatMessage('info', message, data);
    if (this.isDevelopment) {
      console.info(`[${logMessage.timestamp}] [INFO] ${message}`, data || '');
    }
  }

  public warn(message: string, data?: unknown): void {
    const logMessage = this.formatMessage('warn', message, data);
    console.warn(`[${logMessage.timestamp}] [WARN] ${message}`, data || '');
  }

  public error(message: string, error?: Error | unknown): void {
    const logMessage = this.formatMessage('error', message, error);
    console.error(`[${logMessage.timestamp}] [ERROR] ${message}`, error || '');
  }

  public debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      const logMessage = this.formatMessage('debug', message, data);
      console.debug(`[${logMessage.timestamp}] [DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = Logger.getInstance(); 
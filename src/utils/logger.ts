// Utilitário de logging centralizado
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${context}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    const formattedMessage = this.formatMessage(entry);

    // Em desenvolvimento, mostra todos os logs
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    } else {
      // Em produção, mostra apenas warn e error
      if (level === 'warn' || level === 'error') {
        console[level](formattedMessage);
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance(); 
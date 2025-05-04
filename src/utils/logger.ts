// Módulo de logging centralizado
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
}

class Logger {
  private static instance: Logger;
  private isDebugEnabled: boolean;

  private constructor() {
    this.isDebugEnabled = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: any): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private log(logMessage: LogMessage): void {
    const formattedMessage = `[${logMessage.timestamp}] [${logMessage.level}] ${logMessage.message}`;
    
    switch (logMessage.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, logMessage.context || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, logMessage.context || '');
        break;
      case LogLevel.DEBUG:
        if (this.isDebugEnabled) {
          console.debug(formattedMessage, logMessage.context || '');
        }
        break;
      default:
        console.log(formattedMessage, logMessage.context || '');
    }
  }

  public info(message: string, context?: any): void {
    this.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  public warn(message: string, context?: any): void {
    this.log(this.formatMessage(LogLevel.WARN, message, context));
  }

  public error(message: string, context?: any): void {
    this.log(this.formatMessage(LogLevel.ERROR, message, context));
  }

  public debug(message: string, context?: any): void {
    if (this.isDebugEnabled) {
      this.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }
}

export const logger = Logger.getInstance(); 
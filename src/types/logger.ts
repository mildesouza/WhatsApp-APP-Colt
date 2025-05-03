export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: string;
} 
export type EventCallback<T = unknown> = (data: T) => void;

export interface EventMap {
  'message:send': MessageEvent;
  'message:received': MessageEvent;
  'status:change': StatusEvent;
  'error:occurred': ErrorEvent;
  'firebase:initialized': FirebaseEvent;
  'firebase:error': FirebaseErrorEvent;
}

export interface MessageEvent {
  id: string;
  content: string;
  timestamp: number;
  sender: string;
  recipient: string;
}

export interface StatusEvent {
  type: 'online' | 'offline' | 'typing';
  userId: string;
  timestamp: number;
}

export interface ErrorEvent {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

export interface FirebaseEvent {
  status: 'initialized' | 'configured';
  timestamp: number;
}

export interface FirebaseErrorEvent {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
} 
import { EventMessage } from '../types';
import { logger } from './logger';

type EventCallback = (data: any) => void;

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventCallback[]>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe(eventType: string, callback: EventCallback): void {
    try {
      const callbacks = this.listeners.get(eventType) || [];
      callbacks.push(callback);
      this.listeners.set(eventType, callbacks);
      logger.debug(`Subscribed to event: ${eventType}`);
    } catch (error) {
      logger.error('Error subscribing to event', { eventType, error });
    }
  }

  public unsubscribe(eventType: string, callback: EventCallback): void {
    try {
      const callbacks = this.listeners.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        this.listeners.set(eventType, callbacks);
        logger.debug(`Unsubscribed from event: ${eventType}`);
      }
    } catch (error) {
      logger.error('Error unsubscribing from event', { eventType, error });
    }
  }

  public emit(message: EventMessage): void {
    try {
      const callbacks = this.listeners.get(message.type) || [];
      callbacks.forEach(callback => {
        try {
          callback(message.data);
        } catch (error) {
          logger.error('Error in event callback', { 
            eventType: message.type, 
            error 
          });
        }
      });
      logger.debug(`Event emitted: ${message.type}`, { data: message.data });
    } catch (error) {
      logger.error('Error emitting event', { message, error });
    }
  }
}

export const eventBus = EventBus.getInstance(); 
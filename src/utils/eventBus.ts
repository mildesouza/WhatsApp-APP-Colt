import { EventCallback, EventMap } from '../types/events';
import { logger } from './logger';

class EventBus {
  private static instance: EventBus;
  private events: Map<keyof EventMap, EventCallback[]>;

  private constructor() {
    this.events = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    try {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event)?.push(callback as EventCallback);
      logger.debug(`Event listener registered for: ${String(event)}`);
    } catch (error) {
      logger.error(`Failed to register event listener for: ${String(event)}`, error);
    }
  }

  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    try {
      const callbacks = this.events.get(event) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event callback for: ${String(event)}`, error);
        }
      });
      logger.debug(`Event emitted: ${String(event)}`, { data });
    } catch (error) {
      logger.error(`Failed to emit event: ${String(event)}`, error);
    }
  }

  public off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    try {
      const callbacks = this.events.get(event) || [];
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
        logger.debug(`Event listener removed for: ${String(event)}`);
      }
    } catch (error) {
      logger.error(`Failed to remove event listener for: ${String(event)}`, error);
    }
  }
}

export const eventBus = EventBus.getInstance(); 
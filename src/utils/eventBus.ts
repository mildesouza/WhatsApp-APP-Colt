import { logger } from './logger';
import { EventMessage, EventType } from '../types';

type EventCallback = (...args: any[]) => void;

class EventBus {
  private static instance: EventBus;
  private listeners: { [key: string]: EventCallback[] } = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  public emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Erro ao executar callback para evento ${event}:`, error);
      }
    });
  }

  clearHandlers(event?: string): void {
    try {
      if (event) {
        this.listeners[event] = [];
        logger.debug(`Handlers limpos para evento: ${event}`);
      } else {
        this.listeners = {};
        logger.debug('Todos os handlers foram limpos');
      }
    } catch (error) {
      logger.error(`Erro ao limpar handlers${event ? ` para evento: ${event}` : ''}`, { error });
    }
  }
}

export const eventBus = EventBus.getInstance(); 
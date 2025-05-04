import { logger } from './logger';
import { EventMessage, EventType } from '../types';

type EventHandler<T = unknown> = (data: T) => void;

class EventBus {
  private static instance: EventBus;
  private handlers: Map<EventType, EventHandler[]>;

  private constructor() {
    this.handlers = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T = unknown>(event: EventType, handler: EventHandler<T>): void {
    try {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, []);
      }
      
      this.handlers.get(event)?.push(handler as EventHandler);
      logger.debug(`Registrado handler para evento: ${event}`);
    } catch (error) {
      logger.error(`Erro ao registrar handler para evento: ${event}`, { error });
    }
  }

  off<T = unknown>(event: EventType, handler: EventHandler<T>): void {
    try {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler as EventHandler);
        if (index > -1) {
          handlers.splice(index, 1);
          logger.debug(`Removido handler para evento: ${event}`);
        }
      }
    } catch (error) {
      logger.error(`Erro ao remover handler para evento: ${event}`, { error });
    }
  }

  emit<T = unknown>(event: EventType, data: T): void {
    try {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const message: EventMessage<T> = {
          type: event,
          data,
          timestamp: Date.now()
        };

        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            logger.error(`Erro ao executar handler para evento: ${event}`, { error });
          }
        });

        logger.debug(`Evento emitido: ${event}`, { data });
      }
    } catch (error) {
      logger.error(`Erro ao emitir evento: ${event}`, { error });
    }
  }

  clearHandlers(event?: EventType): void {
    try {
      if (event) {
        this.handlers.delete(event);
        logger.debug(`Handlers limpos para evento: ${event}`);
      } else {
        this.handlers.clear();
        logger.debug('Todos os handlers foram limpos');
      }
    } catch (error) {
      logger.error(`Erro ao limpar handlers${event ? ` para evento: ${event}` : ''}`, { error });
    }
  }
}

export const eventBus = EventBus.getInstance(); 
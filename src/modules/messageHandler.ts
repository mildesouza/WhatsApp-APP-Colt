import { MessageEvent } from '../types/events';
import { eventBus } from '../utils/eventBus';
import { logger } from '../utils/logger';

export class MessageHandler {
  private static instance: MessageHandler;

  private constructor() {
    this.initializeEventListeners();
  }

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  private initializeEventListeners(): void {
    try {
      eventBus.on('message:send', this.handleMessageSend.bind(this));
      eventBus.on('message:received', this.handleMessageReceived.bind(this));
      logger.info('MessageHandler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MessageHandler', error);
    }
  }

  private async handleMessageSend(message: MessageEvent): Promise<void> {
    try {
      logger.debug('Processing outgoing message', message);
      
      // Aqui iria a lógica de envio da mensagem
      await this.sendMessage(message);
      
      logger.info('Message sent successfully', { messageId: message.id });
    } catch (error) {
      logger.error('Failed to send message', error);
      eventBus.emit('error:occurred', {
        code: 'MESSAGE_SEND_ERROR',
        message: 'Failed to send message',
        details: error,
        timestamp: Date.now()
      });
    }
  }

  private async handleMessageReceived(message: MessageEvent): Promise<void> {
    try {
      logger.debug('Processing incoming message', message);
      
      // Aqui iria a lógica de processamento da mensagem recebida
      await this.processReceivedMessage(message);
      
      logger.info('Message processed successfully', { messageId: message.id });
    } catch (error) {
      logger.error('Failed to process received message', error);
      eventBus.emit('error:occurred', {
        code: 'MESSAGE_PROCESS_ERROR',
        message: 'Failed to process received message',
        details: error,
        timestamp: Date.now()
      });
    }
  }

  private async sendMessage(message: MessageEvent): Promise<void> {
    // Implementação do envio de mensagem
    return Promise.resolve();
  }

  private async processReceivedMessage(message: MessageEvent): Promise<void> {
    // Implementação do processamento de mensagem recebida
    return Promise.resolve();
  }
}

export const messageHandler = MessageHandler.getInstance(); 
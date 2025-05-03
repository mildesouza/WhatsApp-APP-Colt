import { messageHandler } from './modules/messageHandler';
import { eventBus } from './utils/eventBus';
import { logger } from './utils/logger';

try {
  // Inicializa o messageHandler (que já registra seus próprios event listeners)
  messageHandler;

  // Exemplo de envio de mensagem
  eventBus.emit('message:send', {
    id: crypto.randomUUID(),
    content: 'Hello from background!',
    timestamp: Date.now(),
    sender: 'background',
    recipient: 'content'
  });

  logger.info('Background script initialized successfully');
} catch (error) {
  logger.error('Failed to initialize background script', error);
} 
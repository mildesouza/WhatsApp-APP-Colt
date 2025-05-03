import { messageHandler } from './modules/messageHandler';
import { firebaseService } from './modules/firebaseConfig';
import { eventBus } from './utils/eventBus';
import { logger } from './utils/logger';

try {
  // Inicializa o Firebase
  const firebaseApp = firebaseService.getApp();
  logger.info('Firebase app retrieved successfully');

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

  // Emite evento de inicialização bem-sucedida
  eventBus.emit('firebase:initialized', {
    status: 'initialized',
    timestamp: Date.now()
  });

  logger.info('Background script initialized successfully');
} catch (error) {
  logger.error('Failed to initialize background script', error);
  eventBus.emit('firebase:error', {
    code: 'BACKGROUND_INIT_ERROR',
    message: 'Failed to initialize background script',
    details: error,
    timestamp: Date.now()
  });
} 
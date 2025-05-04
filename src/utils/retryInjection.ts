export const MAX_RETRIES = 10;
export const RETRY_INTERVAL = 1000;

export const retryInjection = async (
  injectionFn: () => boolean,
  condition: () => boolean
): Promise<boolean> => {
  let retries = 0;
  
  const attempt = async (): Promise<boolean> => {
    if (retries >= MAX_RETRIES) {
      console.error('[WhatsApp Orçamentos] Máximo de tentativas de injeção atingido');
      return false;
    }
    
    if (condition()) {
      return injectionFn();
    }
    
    retries++;
    return new Promise(resolve => {
      setTimeout(() => resolve(attempt()), RETRY_INTERVAL);
    });
  };
  
  return attempt();
}; 
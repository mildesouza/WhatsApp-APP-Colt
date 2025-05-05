export const CONFIG = {
  SELECTORS: {
    CONVERSATION_PANEL: '#main, .two, [data-testid="conversation-panel-wrapper"], [data-testid="pane-side"]',
    CHAT_LIST: '[data-testid="chat-list"]',
    PHONE_DATA: '[data-id]',
    CHAT_HEADER: '[data-testid="conversation-header"]',
    CONTACT_NAME: '[data-testid="conversation-contact-name"]',
    LAST_SEEN: '[data-testid="conversation-last-seen"]'
  },
  STORAGE: {
    PREFIX: 'whatsapp_orcamentos_'
  },
  STYLES: {
    COLORS: {
      PRIMARY: '#128C7E',
      SECONDARY: '#25D366',
      ERROR: '#dc3545',
      BACKGROUND: '#f0f2f5',
      TEXT: '#41525d'
    },
    FONTS: {
      FAMILY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    },
    SIZES: {
      PANEL_WIDTH: '360px'
    }
  },
  RETRY: {
    MAX_ATTEMPTS: 20,
    INTERVAL: 1000
  }
}; 
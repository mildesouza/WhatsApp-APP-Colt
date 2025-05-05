export {};

declare global {
  interface Window {
    whatsappOrcamentosLoaded: boolean | undefined;
    currentWhatsAppPhone: string | null;
  }
  // Permitir armazenar referência do listener de auto-save
  interface HTMLFormElement {
    __autoSaveListener?: EventListener;
  }
}

// Importar tipo PainelData centralizado
import type { PainelData } from './types/Orcamento';

// Importar funções de storage centralizado
import { saveData, loadData, clearData, getKey } from './utils/storage';

// Importar o painel de orçamentos
import { PainelOrcamento } from './modules/orcamento/PainelOrcamento';
import { logger } from './utils/logger';
import { CONFIG } from './config/constants';
import './css/painel-orcamento.css';

let painelOrcamento: PainelOrcamento | null = null;

// Função para verificar se o WhatsApp Web está carregado
function isWhatsAppReady(): boolean {
  return !!document.querySelector(CONFIG.SELECTORS.CONVERSATION_PANEL);
}

// Função para inicializar a extensão
function inicializarExtensao() {
  if (window.whatsappOrcamentosLoaded) {
    return;
  }

  try {
    painelOrcamento = new PainelOrcamento();
    window.whatsappOrcamentosLoaded = true;
    logger.success('Extensão inicializada com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar extensão:', error);
  }
}

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'togglePanel') {
    if (!painelOrcamento) {
      inicializarExtensao();
    }
    painelOrcamento?.toggle();
  } else if (message.action === 'checkStatus') {
    sendResponse({ isWhatsAppReady: isWhatsAppReady() });
  }
});

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarExtensao);
} else {
  inicializarExtensao();
}

// Limpar recursos quando a página for fechada
window.addEventListener('unload', () => {
  if (painelOrcamento) {
    painelOrcamento.destruir();
    painelOrcamento = null;
  }
}); 
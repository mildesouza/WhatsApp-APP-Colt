import { injectOrcamentoSidebar } from '../modules/orcamento/OrcamentoSidebar';
import { retryInjection } from '../utils/retryInjection';

// Flag para evitar múltiplas injeções
declare global {
  interface Window {
    whatsappOrcamentosLoaded: boolean;
  }
}

// Função de inicialização
const initialize = async () => {
  if (typeof window.whatsappOrcamentosLoaded !== 'undefined') {
    console.log('[WhatsApp Orçamentos] Script já inicializado anteriormente');
    return;
  }

  window.whatsappOrcamentosLoaded = true;
  console.log('[WhatsApp Orçamentos] Primeira inicialização');

  // Condição para verificar se o DOM do WhatsApp está pronto
  const isWhatsAppReady = () => {
    return !!document.querySelector('#app, #main, .two');
  };

  // Tentar injetar o painel lateral com retry
  const success = await retryInjection(
    () => {
      try {
        injectOrcamentoSidebar();
        return true;
      } catch (error) {
        console.error('[WhatsApp Orçamentos] Erro na injeção:', error);
        return false;
      }
    },
    isWhatsAppReady
  );

  if (!success) {
    console.error('[WhatsApp Orçamentos] Não foi possível injetar o painel lateral');
  }
};

// Iniciar o processo de injeção
initialize();

// Preservar a função de extração de telefone exatamente como está
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extrairTelefone") {
    sendResponse({
      telefone: (function () {
        try {
          const elementos = document.querySelectorAll("[data-id]");
          for (const el of elementos) {
            const dataId = el.getAttribute("data-id");
            if (dataId && dataId.includes("@c.us")) {
              const match = dataId.match(/([0-9]+)@c\.us/);
              if (match && match[1]) return match[1];
            }
          }

          const href = window.location.href;
          if (href.includes("/p/") || href.includes("web.whatsapp.com/send")) {
            const phone = new URLSearchParams(window.location.search).get("phone");
            if (phone) return phone;
          }

          return null;
        } catch (err) {
          console.error("[WhatsApp Orçamentos] ❌ Erro:", err);
          return null;
        }
      })()
    });
  }

  return true;
}); 
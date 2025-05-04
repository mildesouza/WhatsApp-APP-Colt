// Informar que o script foi carregado
console.log('[WhatsApp Orçamentos] Script de conteúdo carregado');

// Declarar tipo para a extensão do window
declare global {
  interface Window {
    whatsappOrcamentosLoaded: boolean;
  }
}

// Flag para evitar múltiplas injeções
if (typeof window.whatsappOrcamentosLoaded === 'undefined') {
  window.whatsappOrcamentosLoaded = true;
  console.log('[WhatsApp Orçamentos] Primeira inicialização');
} else {
  console.log('[WhatsApp Orçamentos] Script já inicializado anteriormente');
}

/**
 * NÃO MODIFICAR!
 * Método de extração de contato de alta criticidade.
 * Qualquer alteração pode quebrar a compatibilidade do plugin.
 * Só mantenha este código exatamente como está.
 */
export function extraiContato( /* ... */ ) {
  // ... implementação existente ...
}

// Função otimizada para extrair o telefone do contato ativo usando Método 2
function extrairTelefone(): string | null {
  console.log('[WhatsApp Orçamentos] Iniciando extração de telefone...');
  
  // Método eficaz: extrair do atributo data-id
  try {
    // Verifica todos os elementos <div> com atributos data- que possam conter IDs de contato
    const potentialDataElements = document.querySelectorAll('[data-id]');
    console.log('[WhatsApp Orçamentos] Elementos com data-id encontrados:', potentialDataElements.length);
    
    for (const el of potentialDataElements) {
      const dataId = el.getAttribute('data-id');
      console.log('[WhatsApp Orçamentos] Data-ID encontrado:', dataId);
      
      if (dataId && dataId.includes('@c.us')) {
        // O formato típico é algo como "5511987654321@c.us" ou "false_5511987654321@c.us_HASH"
        const phoneMatch = dataId.match(/([0-9]+)@c\.us/);
        if (phoneMatch && phoneMatch[1]) {
          const phone = phoneMatch[1];
          console.log('[WhatsApp Orçamentos] ✅ Telefone extraído do data-id:', phone);
          return phone;
        }
      }
    }
    
    // Se nenhum telefone for encontrado pelo método principal, verificamos a URL
    const url = window.location.href;
    console.log('[WhatsApp Orçamentos] URL atual:', url);
    
    if (url.includes('/p/') || url.includes('web.whatsapp.com/send')) {
      // Se estiver em um chat via link direto, extrair da URL
      const urlParams = new URLSearchParams(window.location.search);
      const phone = urlParams.get('phone');
      if (phone) {
        console.log('[WhatsApp Orçamentos] ✅ Telefone extraído da URL:', phone);
        return phone;
      }
    }
    
    console.error('[WhatsApp Orçamentos] Não foi possível extrair o telefone via data-id');
    return null;
  } catch (error) {
    console.error('[WhatsApp Orçamentos] Erro ao extrair telefone:', error);
    return null;
  }
}

// Função para verificar se existe um chat aberto
function extrairTelefoneCompleto(): string | null {
  console.log('[WhatsApp Orçamentos] Iniciando extração completa...');
  
  try {
    // Verifica se existe algum chat aberto
    const chatContainer = document.querySelector('#main') || 
                         document.querySelector('.two') || 
                         document.querySelector('[data-testid="conversation-panel-wrapper"]');
    
    console.log('[WhatsApp Orçamentos] Container de chat:', chatContainer ? 'Encontrado' : 'Não encontrado');
    
    if (!chatContainer) {
      throw new Error('Nenhum chat aberto atualmente');
    }
    
    // Tenta extrair usando a função principal
    const phone = extrairTelefone();
    
    if (!phone) {
      throw new Error('Não foi possível extrair o telefone');
    }
    
    return phone;
  } catch (error) {
    console.error('[WhatsApp Orçamentos] Erro na extração completa:', error);
    return null;
  }
}

// Interface para a resposta da mensagem
interface ExtracaoResponse {
  success: boolean;
  telefone?: string;
  error?: string;
}

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extrairTelefone') {
    const telefone = extrairTelefone();
    sendResponse({ telefone });
  }
  return true; // Mantém a conexão aberta para resposta assíncrona
});

// Informa que o script foi carregado completamente
console.log('[WhatsApp Orçamentos] Script de conteúdo inicializado completamente'); 
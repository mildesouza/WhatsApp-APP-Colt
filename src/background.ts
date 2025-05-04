// Background script
console.log('Background script iniciado');

// Função para injetar o content script em uma aba
async function injectContentScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.bundle.js']
    });
    
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['css/popup.css']
    });
    
    console.log('Content script e CSS injetados na tab:', tabId);
  } catch (err) {
    console.error('Erro ao injetar scripts:', err);
  }
}

// Handler para instalação e atualização da extensão
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extensão instalada/atualizada:', details.reason);
  
  // Procurar por todas as abas do WhatsApp Web
  const tabs = await chrome.tabs.query({
    url: "https://web.whatsapp.com/*"
  });
  
  // Injetar o content script em todas as abas encontradas
  for (const tab of tabs) {
    if (tab.id) {
      await injectContentScript(tab.id);
    }
  }
});

// Listener para novas abas/atualizações
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('web.whatsapp.com')) {
    console.log('WhatsApp Web detectado na tab:', tabId);
    injectContentScript(tabId);
  }
});

// Criar um canal de comunicação entre o popup e o content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extrairTelefone') {
    // Encaminhar a mensagem para a aba ativa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ error: 'Nenhuma aba ativa' });
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extrairTelefone' })
        .then(response => {
          console.log('Resposta do content script:', response);
          sendResponse(response);
        })
        .catch(error => {
          console.error('Erro na comunicação:', error);
          sendResponse({ error: 'Falha na comunicação com a página' });
        });
    });
    
    return true; // Indica que a resposta será assíncrona
  }
}); 
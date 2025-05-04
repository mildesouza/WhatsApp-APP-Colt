// Background script
console.log('Background script iniciado');

// Manter controle de qual aba está com WhatsApp aberto
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('web.whatsapp.com')) {
    console.log('WhatsApp Web detectado na tab:', tabId);
    
    // Inserir o script na página 
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/content.js']
    })
    .then(() => {
      console.log('Content script injetado na tab do WhatsApp Web');
    })
    .catch(err => {
      console.error('Erro ao injetar content script:', err);
    });
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
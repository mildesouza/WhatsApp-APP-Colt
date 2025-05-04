// Interfaces
interface Orcamento {
  descricao: string;
  valor: string;
  data: string;
}

interface OrcamentosStorage {
  [telefone: string]: Orcamento[];
}

interface ExtracaoResponse {
  success: boolean;
  telefone?: string;
  error?: string;
}

// Elementos do DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('[WhatsApp Orçamentos] Popup carregado');

  const loadingElement = document.getElementById('loading');
  const erroElement = document.getElementById('erro');
  const resultadoElement = document.getElementById('resultado');
  const telefoneElement = document.getElementById('telefone');
  const semOrcamentosElement = document.getElementById('sem-orcamentos');
  const listaOrcamentosElement = document.getElementById('lista-orcamentos');
  const descricaoOrcamentoElement = document.getElementById('descricao-orcamento') as HTMLInputElement;
  const valorOrcamentoElement = document.getElementById('valor-orcamento') as HTMLInputElement;
  const salvarOrcamentoButton = document.getElementById('salvar-orcamento');
  const erroMensagemElement = document.getElementById('erro-mensagem');
  const atualizarBotao = document.getElementById('atualizar-botao');

  if (!loadingElement || !erroElement || !resultadoElement || !telefoneElement || 
      !semOrcamentosElement || !listaOrcamentosElement || !descricaoOrcamentoElement || 
      !valorOrcamentoElement || !erroMensagemElement) {
    console.error('[WhatsApp Orçamentos] Elementos do DOM não encontrados');
    return;
  }

  // Variável para armazenar o telefone atual
  let telefoneAtual = '';

  // Função para mostrar o erro
  function mostrarErro(mensagem: string): void {
    console.error('[WhatsApp Orçamentos] Erro:', mensagem);
    
    loadingElement.style.display = 'none';
    erroElement.style.display = 'block';
    resultadoElement.style.display = 'none';
    
    if (erroMensagemElement) {
      erroMensagemElement.textContent = mensagem || 'Não foi possível extrair o número de telefone.';
    }
  }

  // Função para mostrar o resultado
  function mostrarResultado(telefone: string): void {
    console.log('[WhatsApp Orçamentos] Mostrando resultado para telefone:', telefone);
    
    loadingElement.style.display = 'none';
    erroElement.style.display = 'none';
    resultadoElement.style.display = 'block';
    
    telefoneAtual = telefone;
    telefoneElement.textContent = telefone;
    
    // Carregar orçamentos existentes
    carregarOrcamentos(telefone);
  }

  // Função para extrair o telefone
  function extrairTelefone(): void {
    console.log('[WhatsApp Orçamentos] Iniciando extração de telefone...');
    
    // Mostrar estado de carregamento
    loadingElement.style.display = 'block';
    erroElement.style.display = 'none';
    resultadoElement.style.display = 'none';
    
    // Verificar se estamos na página do WhatsApp Web
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      console.log('[WhatsApp Orçamentos] Tab atual:', currentTab);
      
      if (!currentTab.url || !currentTab.url.includes('web.whatsapp.com')) {
        mostrarErro('Esta extensão só funciona no WhatsApp Web. Por favor, abra https://web.whatsapp.com');
        return;
      }
      
      console.log('[WhatsApp Orçamentos] Enviando mensagem para a tab:', currentTab.id);
      
      // Enviar mensagem para o content script
      chrome.tabs.sendMessage(
        currentTab.id!,
        {action: 'extrairTelefone'},
        function(response: ExtracaoResponse) {
          console.log('[WhatsApp Orçamentos] Resposta recebida:', response);
          
          // Verificar se tivemos uma resposta válida
          if (chrome.runtime.lastError) {
            console.error('[WhatsApp Orçamentos] Erro ao comunicar com a página:', chrome.runtime.lastError.message);
            mostrarErro('Erro ao comunicar com a página: ' + chrome.runtime.lastError.message);
            return;
          }
          
          if (!response) {
            mostrarErro('Não foi possível conectar ao WhatsApp Web. Tente recarregar a página.');
            return;
          }
          
          // Verificar se a extração foi bem-sucedida
          if (response.success && response.telefone) {
            mostrarResultado(response.telefone);
          } else {
            let mensagemErro = 'Não foi possível extrair o telefone.';
            
            if (response.error) {
              mensagemErro += ' Motivo: ' + response.error;
            }
            
            mostrarErro(mensagemErro);
          }
        }
      );
    });
  }

  // Função para carregar orçamentos existentes
  function carregarOrcamentos(telefone: string): void {
    console.log('[WhatsApp Orçamentos] Carregando orçamentos para:', telefone);
    
    // Carregar orçamentos do armazenamento local
    chrome.storage.local.get(['orcamentos'], function(result: { orcamentos?: OrcamentosStorage }) {
      const orcamentos = result.orcamentos || {};
      const orcamentosContato = orcamentos[telefone] || [];
      
      if (orcamentosContato.length === 0) {
        semOrcamentosElement!.style.display = 'block';
        listaOrcamentosElement!.style.display = 'none';
      } else {
        semOrcamentosElement!.style.display = 'none';
        listaOrcamentosElement!.style.display = 'block';
        
        // Limpar lista atual
        listaOrcamentosElement!.innerHTML = '';
        
        // Adicionar cada orçamento à lista
        orcamentosContato.forEach(function(orcamento) {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${orcamento.descricao}</strong>
            <span>R$ ${orcamento.valor}</span>
            <span class="data">${new Date(orcamento.data).toLocaleDateString()}</span>
          `;
          listaOrcamentosElement!.appendChild(li);
        });
      }
    });
  }

  // Função para salvar um novo orçamento
  function salvarOrcamento(): void {
    console.log('[WhatsApp Orçamentos] Salvando novo orçamento...');
    
    const descricao = descricaoOrcamentoElement.value.trim();
    const valor = valorOrcamentoElement.value.trim();
    
    if (!descricao || !valor) {
      alert('Por favor, preencha a descrição e o valor do orçamento.');
      return;
    }
    
    if (!telefoneAtual) {
      alert('Não há um telefone selecionado.');
      return;
    }
    
    // Buscar orçamentos existentes
    chrome.storage.local.get(['orcamentos'], function(result: { orcamentos?: OrcamentosStorage }) {
      const orcamentos = result.orcamentos || {};
      const orcamentosContato = orcamentos[telefoneAtual] || [];
      
      // Adicionar novo orçamento
      orcamentosContato.push({
        descricao: descricao,
        valor: valor,
        data: new Date().toISOString()
      });
      
      // Atualizar orçamentos
      orcamentos[telefoneAtual] = orcamentosContato;
      
      // Salvar no armazenamento
      chrome.storage.local.set({orcamentos: orcamentos}, function() {
        console.log('[WhatsApp Orçamentos] Orçamento salvo com sucesso');
        
        // Limpar campos
        descricaoOrcamentoElement.value = '';
        valorOrcamentoElement.value = '';
        
        // Recarregar orçamentos
        carregarOrcamentos(telefoneAtual);
      });
    });
  }
  
  // Event listener para o botão de salvar orçamento
  if (salvarOrcamentoButton) {
    salvarOrcamentoButton.addEventListener('click', salvarOrcamento);
  }
  
  // Event listener para o botão de atualizar
  if (atualizarBotao) {
    atualizarBotao.addEventListener('click', extrairTelefone);
  }

  // Iniciar a extração de telefone quando o popup for aberto
  console.log('[WhatsApp Orçamentos] Iniciando extração automática...');
  extrairTelefone();
}); 
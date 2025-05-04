// Elementos do DOM
document.addEventListener('DOMContentLoaded', function() {
  const loadingElement = document.getElementById('loading');
  const erroElement = document.getElementById('erro');
  const resultadoElement = document.getElementById('resultado');
  const telefoneElement = document.getElementById('telefone');
  const semOrcamentosElement = document.getElementById('sem-orcamentos');
  const listaOrcamentosElement = document.getElementById('lista-orcamentos');
  const descricaoOrcamentoElement = document.getElementById('descricao-orcamento');
  const valorOrcamentoElement = document.getElementById('valor-orcamento');
  const salvarOrcamentoButton = document.getElementById('salvar-orcamento');
  const erroMensagemElement = document.getElementById('erro-mensagem');
  const atualizarBotao = document.getElementById('atualizar-botao');

  // Variável para armazenar o telefone atual
  let telefoneAtual = '';

  // Função para mostrar o erro
  function mostrarErro(mensagem) {
    loadingElement.style.display = 'none';
    erroElement.style.display = 'block';
    resultadoElement.style.display = 'none';
    
    if (erroMensagemElement) {
      erroMensagemElement.textContent = mensagem || 'Não foi possível extrair o número de telefone.';
    }
    
    console.error('Erro:', mensagem);
  }

  // Função para mostrar o resultado
  function mostrarResultado(telefone) {
    loadingElement.style.display = 'none';
    erroElement.style.display = 'none';
    resultadoElement.style.display = 'block';
    
    telefoneAtual = telefone;
    telefoneElement.textContent = telefone;
    
    // Carregar orçamentos existentes
    carregarOrcamentos(telefone);
  }

  // Função para extrair o telefone
  function extrairTelefone() {
    console.log('Iniciando extração de telefone...');
    
    // Mostrar estado de carregamento
    loadingElement.style.display = 'block';
    erroElement.style.display = 'none';
    resultadoElement.style.display = 'none';
    
    // Verificar se estamos na página do WhatsApp Web
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      if (!currentTab.url || !currentTab.url.includes('web.whatsapp.com')) {
        mostrarErro('Esta extensão só funciona no WhatsApp Web. Por favor, abra https://web.whatsapp.com');
        return;
      }
      
      console.log('Enviando mensagem para a tab:', currentTab.id);
      
      // Enviar mensagem para o content script
      chrome.tabs.sendMessage(
        currentTab.id,
        {action: 'extrairTelefone'},
        function(response) {
          console.log('Resposta recebida:', response);
          
          // Verificar se tivemos uma resposta válida
          if (chrome.runtime.lastError) {
            console.error('Erro ao comunicar com a página:', chrome.runtime.lastError.message);
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
  function carregarOrcamentos(telefone) {
    // Carregar orçamentos do armazenamento local
    chrome.storage.local.get(['orcamentos'], function(result) {
      const orcamentos = result.orcamentos || {};
      const orcamentosContato = orcamentos[telefone] || [];
      
      if (orcamentosContato.length === 0) {
        semOrcamentosElement.style.display = 'block';
        listaOrcamentosElement.style.display = 'none';
      } else {
        semOrcamentosElement.style.display = 'none';
        listaOrcamentosElement.style.display = 'block';
        
        // Limpar lista atual
        listaOrcamentosElement.innerHTML = '';
        
        // Adicionar cada orçamento à lista
        orcamentosContato.forEach(function(orcamento, index) {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${orcamento.descricao}</strong>
            <span>R$ ${orcamento.valor}</span>
            <span class="data">${new Date(orcamento.data).toLocaleDateString()}</span>
          `;
          listaOrcamentosElement.appendChild(li);
        });
      }
    });
  }

  // Função para salvar um novo orçamento
  function salvarOrcamento() {
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
    chrome.storage.local.get(['orcamentos'], function(result) {
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
  extrairTelefone();
}); 
import { budgetFirestore, OrcamentoSimples } from './modules/budgetFirestore';
import { logger } from './utils/logger';

class PopupController {
  private telefoneInput: HTMLInputElement;
  private nomeClienteInput: HTMLInputElement;
  private itensContainer: HTMLDivElement;
  private valorTotalSpan: HTMLSpanElement;
  private adicionarItemBtn: HTMLButtonElement;
  private salvarOrcamentoBtn: HTMLButtonElement;
  private statusDiv: HTMLDivElement;
  private atualizarBtn: HTMLButtonElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.extrairTelefone();
  }

  private initializeElements() {
    this.telefoneInput = document.getElementById('telefone') as HTMLInputElement;
    this.nomeClienteInput = document.getElementById('nome-cliente') as HTMLInputElement;
    this.itensContainer = document.getElementById('itens-orcamento') as HTMLDivElement;
    this.valorTotalSpan = document.getElementById('valor-total') as HTMLSpanElement;
    this.adicionarItemBtn = document.getElementById('adicionar-item') as HTMLButtonElement;
    this.salvarOrcamentoBtn = document.getElementById('salvar-orcamento') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;
    this.atualizarBtn = document.getElementById('atualizar-botao') as HTMLButtonElement;
  }

  private setupEventListeners() {
    this.adicionarItemBtn.addEventListener('click', () => this.adicionarNovoItem());
    this.salvarOrcamentoBtn.addEventListener('click', () => this.salvarOrcamento());
    this.atualizarBtn.addEventListener('click', () => this.extrairTelefone());
    this.itensContainer.addEventListener('input', (e) => {
      if (e.target instanceof HTMLInputElement && e.target.classList.contains('valor-item')) {
        this.atualizarTotal();
      }
    });
  }

  private async extrairTelefone() {
    try {
      // Oculta mensagem de erro e mostra loading
      document.getElementById('erro')!.style.display = 'none';
      document.getElementById('loading')!.style.display = 'block';
      document.getElementById('resultado')!.style.display = 'none';

      // Obtém a aba ativa do WhatsApp Web
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('Nenhuma aba ativa encontrada');
      }

      // Envia mensagem para o content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extrairTelefone' });
      
      if (response && response.telefone) {
        this.telefoneInput.value = response.telefone;
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('resultado')!.style.display = 'block';
      } else {
        throw new Error('Não foi possível extrair o número de telefone');
      }
    } catch (error) {
      logger.error('Erro ao extrair telefone', { error });
      document.getElementById('loading')!.style.display = 'none';
      document.getElementById('erro')!.style.display = 'block';
      document.getElementById('erro-mensagem')!.textContent = 
        'Certifique-se de que um chat está aberto no WhatsApp Web e recarregue a página.';
    }
  }

  private criarElementoItem(): HTMLDivElement {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-orcamento';
    itemDiv.innerHTML = `
      <div class="campo">
        <label for="descricao-item">Descrição:</label>
        <input type="text" class="descricao-item" placeholder="Ex: Serviço de instalação">
      </div>
      <div class="campo">
        <label for="valor-item">Valor (R$):</label>
        <input type="number" step="0.01" class="valor-item" placeholder="150.00">
      </div>
      <button class="remover-item">×</button>
    `;

    const removerBtn = itemDiv.querySelector('.remover-item') as HTMLButtonElement;
    removerBtn.addEventListener('click', () => {
      itemDiv.remove();
      this.atualizarTotal();
    });

    return itemDiv;
  }

  private adicionarNovoItem() {
    const novoItem = this.criarElementoItem();
    this.itensContainer.appendChild(novoItem);
  }

  private atualizarTotal() {
    const valorInputs = this.itensContainer.querySelectorAll('.valor-item') as NodeListOf<HTMLInputElement>;
    const total = Array.from(valorInputs)
      .reduce((soma, input) => soma + (Number(input.value) || 0), 0);
    this.valorTotalSpan.textContent = `R$ ${total.toFixed(2)}`;
  }

  private coletarItens(): Array<{descricao: string; valor: number}> {
    const itens: Array<{descricao: string; valor: number}> = [];
    const itemDivs = this.itensContainer.querySelectorAll('.item-orcamento');

    itemDivs.forEach(div => {
      const descricao = (div.querySelector('.descricao-item') as HTMLInputElement).value;
      const valor = Number((div.querySelector('.valor-item') as HTMLInputElement).value);
      
      if (descricao && !isNaN(valor)) {
        itens.push({ descricao, valor });
      }
    });

    return itens;
  }

  private mostrarStatus(mensagem: string, tipo: 'sucesso' | 'erro') {
    this.statusDiv.textContent = mensagem;
    this.statusDiv.className = `mensagem ${tipo}`;
    this.statusDiv.style.display = 'block';
    
    setTimeout(() => {
      this.statusDiv.style.display = 'none';
    }, 3000);
  }

  private async salvarOrcamento() {
    try {
      const itens = this.coletarItens();
      
      if (itens.length === 0) {
        this.mostrarStatus('Adicione pelo menos um item ao orçamento', 'erro');
        return;
      }

      if (!this.nomeClienteInput.value.trim()) {
        this.mostrarStatus('Digite o nome do cliente', 'erro');
        return;
      }

      const total = itens.reduce((soma, item) => soma + item.valor, 0);
      
      const orcamento: OrcamentoSimples = {
        telefone: this.telefoneInput.value,
        nomeCliente: this.nomeClienteInput.value,
        itens,
        total,
        criadoEm: new Date()
      };

      const id = await budgetFirestore.salvarOrcamento(orcamento);
      
      if (id) {
        this.mostrarStatus('Orçamento salvo com sucesso!', 'sucesso');
        // Limpar formulário
        this.nomeClienteInput.value = '';
        this.itensContainer.innerHTML = '';
        this.adicionarNovoItem(); // Adiciona um item vazio
        this.atualizarTotal();
      } else {
        this.mostrarStatus('Erro ao salvar orçamento', 'erro');
      }
    } catch (error) {
      logger.error('Erro ao salvar orçamento', { error });
      this.mostrarStatus('Erro ao salvar orçamento', 'erro');
    }
  }
}

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
}); 
import { CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import { extrairTelefone } from '../../utils/telefone';
import { eventBus } from '../../utils/eventBus';
import { saveData, loadData } from '../../utils/storage';
import { Orcamento } from '../../types';

export class PainelOrcamento {
  private container: HTMLDivElement;
  private toggleButton: HTMLButtonElement;
  private isVisible: boolean = false;
  private currentPhone: string | null = null;
  private observer: MutationObserver | null = null;
  private isProcessing: boolean = false;
  private updateTimeout: NodeJS.Timeout | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.container = this.criarPainel();
    this.toggleButton = this.criarToggleButton();
    document.body.appendChild(this.container);
    document.body.appendChild(this.toggleButton);
    this.inicializar();
  }

  private inicializar(): void {
    this.observer = new MutationObserver(() => {
      if (this.isVisible && !this.isProcessing) {
        this.debouncedAtualizarTelefone();
      }
    });

    let retries = 0;
    const initializeObserver = setInterval(() => {
      const conversationContainer = document.querySelector(CONFIG.SELECTORS.CONVERSATION_PANEL);
      
      if (conversationContainer) {
        clearInterval(initializeObserver);
        this.observer.observe(conversationContainer, {
          childList: true,
          subtree: true
        });
        logger.info('Observer inicializado com sucesso');
      } else if (retries++ > 10) {
        clearInterval(initializeObserver);
        logger.error('Não foi possível encontrar o contêiner de conversas');
      }
    }, 1000);
  }

  private debouncedAtualizarTelefone(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.atualizarTelefoneCliente();
    }, 500);
  }

  private async atualizarTelefoneCliente(): Promise<void> {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      const phoneElement = document.querySelector(CONFIG.SELECTORS.PHONE_DATA);
      
      if (phoneElement) {
        const newPhone = extrairTelefone(phoneElement.getAttribute('data-id') || '');
        
        if (newPhone && newPhone !== this.currentPhone) {
          this.currentPhone = newPhone;
          window.currentWhatsAppPhone = newPhone;
          
          // Atualizar UI
          const telefoneElement = document.getElementById('telefone-cliente');
          const telefoneInput = document.querySelector('#telefone') as HTMLInputElement;
          
          if (telefoneElement) {
            telefoneElement.textContent = `📱 Telefone: ${newPhone}`;
          }
          
          if (telefoneInput) {
            telefoneInput.value = newPhone;
          }

          // Carregar dados salvos do cliente
          const dados = loadData(newPhone);
          if (dados) {
            const form = this.container.querySelector('form');
            if (form) {
              (form.querySelector('#nome') as HTMLInputElement).value = dados.dadosPessoais.nome || '';
              (form.querySelector('#email') as HTMLInputElement).value = dados.dadosPessoais.email || '';
              (form.querySelector('#observacoes') as HTMLTextAreaElement).value = dados.observacoes || '';

              // Limpar e recriar itens
              const itemsContainer = form.querySelector('#itens-container');
              if (itemsContainer) {
                itemsContainer.innerHTML = '';
                if (dados.itens && dados.itens.length > 0) {
                  dados.itens.forEach(item => {
                    this.adicionarItemRow(itemsContainer as HTMLDivElement);
                    const lastRow = itemsContainer.lastElementChild;
                    if (lastRow) {
                      const inputs = lastRow.querySelectorAll('input');
                      inputs[0].value = item.descricao;
                      inputs[1].value = item.valor.toString();
                    }
                  });
                } else {
                  this.adicionarItemRow(itemsContainer as HTMLDivElement);
                }
              }
            }
          }

          eventBus.emit('telefoneAtualizado', newPhone);
          logger.info(`Telefone atualizado: ${newPhone}`);
        }
      } else {
        // Limpar campos se não houver telefone
        const telefoneElement = document.getElementById('telefone-cliente');
        if (telefoneElement) {
          telefoneElement.textContent = 'Nenhum contato selecionado';
        }
        
        const form = this.container.querySelector('form');
        if (form) {
          (form.querySelector('#telefone') as HTMLInputElement).value = '';
          (form.querySelector('#nome') as HTMLInputElement).value = '';
          (form.querySelector('#email') as HTMLInputElement).value = '';
          (form.querySelector('#observacoes') as HTMLTextAreaElement).value = '';
          
          const itemsContainer = form.querySelector('#itens-container');
          if (itemsContainer) {
            itemsContainer.innerHTML = '';
            this.adicionarItemRow(itemsContainer as HTMLDivElement);
          }
        }
      }
    } catch (error) {
      logger.error('Erro ao atualizar telefone:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.style.transform = this.isVisible ? 'translateX(0)' : 'translateX(100%)';
    
    if (this.isVisible) {
      this.atualizarTelefoneCliente();
    }
  }

  public destruir(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    
    this.container.remove();
    this.toggleButton.remove();
  }

  private criarPainel(): HTMLDivElement {
    const painel = document.createElement('div');
    painel.id = 'whatsapp-orcamento-panel';
    painel.style.cssText = `
      width: ${CONFIG.STYLES.SIZES.PANEL_WIDTH};
      height: 100%;
      position: absolute;
      top: 0;
      right: 0;
      background-color: #ffffff;
      box-shadow: -2px 0 6px rgba(0,0,0,0.1);
      z-index: 1000;
      transition: transform 0.3s ease-in-out;
      transform: translateX(100%);
      padding: 20px;
      overflow-y: auto;
      font-family: ${CONFIG.STYLES.FONTS.FAMILY};
    `;

    // Adicionar cabeçalho
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    `;

    const titulo = document.createElement('h2');
    titulo.textContent = 'Orçamentos';
    titulo.style.margin = '0';
    titulo.style.color = CONFIG.STYLES.COLORS.PRIMARY;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0 5px;
      color: ${CONFIG.STYLES.COLORS.TEXT};
    `;
    closeButton.onclick = () => this.toggle();

    header.appendChild(titulo);
    header.appendChild(closeButton);
    painel.appendChild(header);

    // Adicionar conteúdo do painel
    this.adicionarConteudo(painel);

    return painel;
  }

  private criarToggleButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = '🧾';
    button.title = 'Orçamentos';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1001;
      padding: 10px;
      background: ${CONFIG.STYLES.COLORS.PRIMARY};
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: background-color 0.2s;
    `;
    button.onmouseover = () => {
      button.style.backgroundColor = CONFIG.STYLES.COLORS.SECONDARY;
    };
    button.onmouseout = () => {
      button.style.backgroundColor = CONFIG.STYLES.COLORS.PRIMARY;
    };
    button.onclick = () => this.toggle();
    return button;
  }

  private adicionarConteudo(painel: HTMLDivElement): void {
    // Seção de informações do cliente
    const clienteInfo = document.createElement('div');
    clienteInfo.innerHTML = `
      <div class="cliente-info" style="
        margin-bottom: 20px;
        padding: 16px;
        background: ${CONFIG.STYLES.COLORS.BACKGROUND};
        border-radius: 8px;
      ">
        <h3 style="
          color: ${CONFIG.STYLES.COLORS.PRIMARY};
          margin: 0 0 10px 0;
          font-size: 16px;
        ">Informações do Cliente</h3>
        <div id="telefone-cliente" style="
          padding: 8px;
          background: white;
          border-radius: 4px;
          color: ${CONFIG.STYLES.COLORS.PRIMARY};
          font-weight: 500;
        "></div>
      </div>
    `;
    painel.appendChild(clienteInfo);

    // Formulário de orçamento
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-section" style="
        margin-bottom: 24px;
        padding: 16px;
        background: ${CONFIG.STYLES.COLORS.BACKGROUND};
        border-radius: 8px;
      ">
        <h3 style="
          color: ${CONFIG.STYLES.COLORS.PRIMARY};
          margin: 0 0 16px 0;
          font-size: 16px;
        ">Dados Pessoais</h3>
        <div class="input-group" style="margin-bottom: 12px;">
          <label for="nome" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Nome:</label>
          <input type="text" id="nome" name="nome" required style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>
        <div class="input-group" style="margin-bottom: 12px;">
          <label for="email" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">E-mail:</label>
          <input type="email" id="email" name="email" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>
        <div class="input-group" style="margin-bottom: 12px;">
          <label for="telefone" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Telefone:</label>
          <input type="tel" id="telefone" name="telefone" readonly style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            background: ${CONFIG.STYLES.COLORS.BACKGROUND};
          ">
        </div>
      </div>

      <div class="form-section" style="
        margin-bottom: 24px;
        padding: 16px;
        background: ${CONFIG.STYLES.COLORS.BACKGROUND};
        border-radius: 8px;
      ">
        <h3 style="
          color: ${CONFIG.STYLES.COLORS.PRIMARY};
          margin: 0 0 16px 0;
          font-size: 16px;
        ">Itens do Orçamento</h3>
        <div id="itens-container"></div>
        <button type="button" id="adicionar-item" style="
          background: ${CONFIG.STYLES.COLORS.PRIMARY};
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          width: 100%;
          font-size: 14px;
          margin-top: 8px;
          transition: background-color 0.2s;
        ">+ Adicionar Item</button>
      </div>

      <div class="form-section" style="
        margin-bottom: 24px;
        padding: 16px;
        background: ${CONFIG.STYLES.COLORS.BACKGROUND};
        border-radius: 8px;
      ">
        <h3 style="
          color: ${CONFIG.STYLES.COLORS.PRIMARY};
          margin: 0 0 16px 0;
          font-size: 16px;
        ">Observações</h3>
        <textarea id="observacoes" name="observacoes" rows="4" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
        "></textarea>
      </div>

      <button type="submit" style="
        background: ${CONFIG.STYLES.COLORS.PRIMARY};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 12px 24px;
        cursor: pointer;
        width: 100%;
        font-size: 16px;
        font-weight: 500;
        margin-top: 16px;
        transition: background-color 0.2s;
      ">Salvar Orçamento</button>
    `;

    // Configurar eventos do formulário
    form.onsubmit = (e) => this.handleSubmit(e);
    
    const addItemButton = form.querySelector('#adicionar-item') as HTMLButtonElement;
    addItemButton.onclick = () => {
      this.adicionarItemRow();
      // O auto-save será acionado pelo observer do itemsContainer
    };
    
    // Adicionar primeiro item por padrão
    this.adicionarItemRow(form.querySelector('#itens-container') as HTMLDivElement);

    // Configurar auto-save
    this.setupAutoSave(form);

    painel.appendChild(form);
  }

  private adicionarItemRow(container?: HTMLDivElement): void {
    const itemsContainer = container || document.querySelector('#itens-container');
    if (!itemsContainer) return;

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
    `;

    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.placeholder = 'Descrição do item';
    descInput.required = true;
    descInput.style.cssText = `
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    `;

    const valorInput = document.createElement('input');
    valorInput.type = 'number';
    valorInput.placeholder = 'Valor';
    valorInput.required = true;
    valorInput.min = '0';
    valorInput.step = '0.01';
    valorInput.style.cssText = `
      width: 120px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    `;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.innerHTML = '×';
    removeButton.style.cssText = `
      background: ${CONFIG.STYLES.COLORS.ERROR};
      color: white;
      border: none;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    `;
    removeButton.onclick = () => {
      if (itemsContainer.children.length > 1) {
        row.remove();
      }
    };

    row.appendChild(descInput);
    row.appendChild(valorInput);
    row.appendChild(removeButton);
    itemsContainer.appendChild(row);
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const telefone = extrairTelefone();

    if (!telefone) {
      alert('Selecione um contato antes de salvar o orçamento.');
      return;
    }

    const dados: Orcamento = {
      dadosPessoais: {
        nome: (form.querySelector('#nome') as HTMLInputElement).value,
        email: (form.querySelector('#email') as HTMLInputElement).value,
        cpf: '',
        dataNascimento: '',
        endereco: ''
      },
      observacoes: (form.querySelector('#observacoes') as HTMLTextAreaElement).value,
      itens: Array.from(form.querySelectorAll('#itens-container > div')).map(row => {
        const inputs = row.querySelectorAll('input');
        return {
          descricao: inputs[0].value,
          valor: parseFloat(inputs[1].value)
        };
      })
    };

    saveData(telefone, dados);
    alert('Orçamento salvo com sucesso!');
  }

  private setupAutoSave(form: HTMLFormElement): void {
    // Função de auto-save com debounce
    const debouncedSave = () => {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      
      this.autoSaveTimeout = setTimeout(() => {
        this.salvarDados(form);
      }, 500);
    };

    // Adicionar listeners para dados pessoais
    form.querySelector('#nome')?.addEventListener('input', debouncedSave);
    form.querySelector('#email')?.addEventListener('input', debouncedSave);
    form.querySelector('#observacoes')?.addEventListener('input', debouncedSave);

    // Configurar observer para itens do orçamento
    const itemsContainer = form.querySelector('#itens-container');
    if (itemsContainer) {
      // Observer para detectar adição/remoção de itens
      const itemsObserver = new MutationObserver(debouncedSave);
      itemsObserver.observe(itemsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      // Adicionar listener para mudanças nos inputs existentes
      itemsContainer.addEventListener('input', debouncedSave);
    }
  }

  private salvarDados(form: HTMLFormElement): void {
    if (!this.currentPhone) {
      logger.warn('Tentativa de auto-save sem telefone selecionado');
      return;
    }

    try {
      const dados: Orcamento = {
        dadosPessoais: {
          nome: (form.querySelector('#nome') as HTMLInputElement)?.value || '',
          email: (form.querySelector('#email') as HTMLInputElement)?.value || '',
          cpf: '',
          dataNascimento: '',
          endereco: ''
        },
        observacoes: (form.querySelector('#observacoes') as HTMLTextAreaElement)?.value || '',
        itens: Array.from(form.querySelectorAll('#itens-container > div')).map(row => {
          const inputs = row.querySelectorAll('input');
          return {
            descricao: inputs[0]?.value || '',
            valor: parseFloat(inputs[1]?.value || '0')
          };
        })
      };

      saveData(this.currentPhone, dados);
      logger.info('Dados salvos automaticamente');
    } catch (error) {
      logger.error('Erro ao auto-salvar dados:', error);
    }
  }
} 
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
  private readonly STORAGE_KEY_SECTIONS = 'whatsapp_orcamentos_sections';

  constructor() {
    this.container = this.criarPainel();
    this.toggleButton = this.criarToggleButton();
    document.body.appendChild(this.container);
    document.body.appendChild(this.toggleButton);
    this.inicializar();
    
    // Adicionar estilos globais
    const style = document.createElement('style');
    style.textContent = `
        .form-section {
            transition: all 0.3s ease-out;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .form-section.minimizado {
            margin-bottom: 8px;
        }
        
        .form-section.minimizado .section-content {
            max-height: 0 !important;
            padding: 0 !important;
            border-top: none;
            opacity: 0;
        }
        
        .section-content {
            transition: all 0.3s ease-out;
            opacity: 1;
        }
        
        .toggle-indicator {
            opacity: 0.7;
        }
        
        .section-header:hover .toggle-indicator {
            opacity: 1;
        }
        
        #whatsapp-orcamento-panel .scroll-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            scrollbar-width: thin;
            scrollbar-color: ${CONFIG.STYLES.COLORS.PRIMARY} #f0f0f0;
        }
        
        #whatsapp-orcamento-panel .scroll-container::-webkit-scrollbar {
            width: 6px;
        }
        
        #whatsapp-orcamento-panel .scroll-container::-webkit-scrollbar-track {
            background: #f0f0f0;
        }
        
        #whatsapp-orcamento-panel .scroll-container::-webkit-scrollbar-thumb {
            background-color: ${CONFIG.STYLES.COLORS.PRIMARY};
            border-radius: 3px;
        }
    `;
    document.head.appendChild(style);
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
      
      if (conversationContainer && this.observer) {
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
        const newPhone = extrairTelefone();
        
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
        height: 100vh;
        position: fixed;
        top: 0;
        right: 0;
        background-color: #ffffff;
        box-shadow: -2px 0 6px rgba(0,0,0,0.1);
        z-index: 1000;
        transition: transform 0.3s ease-in-out;
        transform: translateX(100%);
        display: flex;
        flex-direction: column;
        font-family: ${CONFIG.STYLES.FONTS.FAMILY};
    `;

    // Adicionar cabeçalho
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background-color: #fff;
        border-bottom: 1px solid ${CONFIG.STYLES.COLORS.BACKGROUND};
        flex-shrink: 0;
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

    // Criar container para o conteúdo scrollável com classe específica
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'scroll-container';
    
    // Adicionar conteúdo do painel dentro do container scrollável
    this.adicionarConteudo(scrollContainer);
    painel.appendChild(scrollContainer);

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

  private criarBlocoColapsavel(titulo: string, conteudo: HTMLElement, id: string): HTMLDivElement {
    const bloco = document.createElement('div');
    bloco.className = 'form-section';
    bloco.id = `section-${id}`;
    bloco.style.cssText = `
        margin-bottom: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        background: white;
    `;

    const header = document.createElement('div');
    header.className = 'section-header';
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: white;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s;
        border-radius: 4px;
    `;

    const tituloElement = document.createElement('h3');
    tituloElement.textContent = titulo;
    tituloElement.style.cssText = `
        margin: 0;
        font-size: 15px;
        font-weight: 500;
        color: ${CONFIG.STYLES.COLORS.PRIMARY};
    `;

    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'toggle-indicator';
    toggleBtn.style.cssText = `
        font-size: 12px;
        color: ${CONFIG.STYLES.COLORS.PRIMARY};
        transition: transform 0.3s ease;
        display: inline-block;
        pointer-events: none;
        width: 12px;
        text-align: center;
    `;

    const conteudoContainer = document.createElement('div');
    conteudoContainer.className = 'section-content';
    conteudoContainer.style.cssText = `
        padding: 0;
        background: white;
        border-top: 1px solid #e0e0e0;
        transition: all 0.3s ease-out;
        overflow: hidden;
    `;

    const conteudoWrapper = document.createElement('div');
    conteudoWrapper.style.cssText = `
        padding: 12px;
    `;
    conteudoWrapper.appendChild(conteudo);
    conteudoContainer.appendChild(conteudoWrapper);

    header.appendChild(tituloElement);
    header.appendChild(toggleBtn);
    bloco.appendChild(header);
    bloco.appendChild(conteudoContainer);

    // Recuperar estado salvo
    const estadosSalvos = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SECTIONS) || '{}');
    const expandido = estadosSalvos[id] !== false;

    const atualizarEstado = (expandir: boolean) => {
        if (expandir) {
            bloco.classList.remove('minimizado');
            conteudoContainer.style.maxHeight = `${conteudoWrapper.offsetHeight}px`;
            toggleBtn.textContent = '▼';
            toggleBtn.style.transform = 'rotate(0deg)';
            header.style.borderRadius = '4px 4px 0 0';
            setTimeout(() => {
                if (!bloco.classList.contains('minimizado')) {
                    conteudoContainer.style.padding = '12px';
                }
            }, 150);
        } else {
            bloco.classList.add('minimizado');
            conteudoContainer.style.maxHeight = '0';
            conteudoContainer.style.padding = '0';
            toggleBtn.textContent = '▲';
            toggleBtn.style.transform = 'rotate(180deg)';
            header.style.borderRadius = '4px';
        }
        
        // Salvar estado
        const estados = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SECTIONS) || '{}');
        estados[id] = expandir;
        localStorage.setItem(this.STORAGE_KEY_SECTIONS, JSON.stringify(estados));
    };

    // Configurar estado inicial
    atualizarEstado(expandido);

    // Adicionar evento de clique no cabeçalho inteiro
    header.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        atualizarEstado(bloco.classList.contains('minimizado'));
    };

    // Adicionar hover effect
    header.onmouseenter = () => {
        header.style.backgroundColor = '#f5f5f5';
    };
    header.onmouseleave = () => {
        header.style.backgroundColor = 'white';
    };

    return bloco;
  }

  private adicionarConteudo(container: HTMLDivElement): void {
    // Seção de informações do cliente
    const clienteInfo = document.createElement('div');
    clienteInfo.innerHTML = `
        <div id="telefone-cliente" style="
            padding: 12px;
            background: white;
            border-radius: 4px;
            color: ${CONFIG.STYLES.COLORS.PRIMARY};
            font-weight: 500;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        "></div>
    `;
    container.appendChild(clienteInfo);

    // Formulário principal
    const form = document.createElement('form');
    form.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;

    // Seção Dados Pessoais
    const dadosPessoaisDiv = document.createElement('div');
    dadosPessoaisDiv.innerHTML = this.criarHTMLDadosPessoais();
    const blocoDadosPessoais = this.criarBlocoColapsavel('Dados Pessoais', dadosPessoaisDiv, 'dados-pessoais');
    form.appendChild(blocoDadosPessoais);

    // Seção Endereço
    const enderecoDiv = document.createElement('div');
    enderecoDiv.innerHTML = this.criarHTMLEndereco();
    const blocoEndereco = this.criarBlocoColapsavel('Endereço de Entrega', enderecoDiv, 'endereco');
    form.appendChild(blocoEndereco);

    // Seção Orçamento
    const orcamentoDiv = document.createElement('div');
    orcamentoDiv.innerHTML = `
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
        ">+ Adicionar Item</button>
    `;
    const blocoOrcamento = this.criarBlocoColapsavel('Itens do Orçamento', orcamentoDiv, 'orcamento');
    form.appendChild(blocoOrcamento);

    // Seção Observações
    const observacoesDiv = document.createElement('div');
    observacoesDiv.innerHTML = `
        <textarea id="observacoes" name="observacoes" rows="4" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            resize: vertical;
        "></textarea>
    `;
    const blocoObservacoes = this.criarBlocoColapsavel('Observações', observacoesDiv, 'observacoes');
    form.appendChild(blocoObservacoes);

    // Botão Salvar
    const botaoSalvar = document.createElement('button');
    botaoSalvar.type = 'submit';
    botaoSalvar.textContent = 'Salvar Orçamento';
    botaoSalvar.style.cssText = `
        background: ${CONFIG.STYLES.COLORS.PRIMARY};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 12px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        margin-top: 20px;
        width: 100%;
    `;

    form.appendChild(botaoSalvar);
    form.onsubmit = (e) => this.handleSubmit(e);

    // Configurar eventos
    const addItemButton = form.querySelector('#adicionar-item') as HTMLButtonElement;
    if (addItemButton) {
        addItemButton.onclick = () => this.adicionarItemRow();
    }

    // Adicionar primeiro item por padrão
    this.adicionarItemRow(form.querySelector('#itens-container') as HTMLDivElement);

    // Configurar auto-save
    this.setupAutoSave(form);

    container.appendChild(form);
  }

  private criarHTMLDadosPessoais(): string {
    return `
      <div class="input-group" style="margin-bottom: 12px;">
        <label for="nome" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">Nome Completo:</label>
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
        <label for="dataNascimento" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">Data de Nascimento:</label>
        <input type="date" id="dataNascimento" name="dataNascimento" style="
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
    `;
  }

  private criarHTMLEndereco(): string {
    return `
      <div class="input-group" style="margin-bottom: 12px;">
        <label for="cep" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">CEP:</label>
        <input type="text" id="cep" name="cep" maxlength="9" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
      </div>

      <div class="input-group" style="margin-bottom: 12px;">
        <label for="logradouro" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">Logradouro:</label>
        <input type="text" id="logradouro" name="logradouro" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div class="input-group" style="flex: 0 0 30%;">
          <label for="numero" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Número:</label>
          <input type="text" id="numero" name="numero" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>

        <div class="input-group" style="flex: 1;">
          <label for="complemento" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Complemento:</label>
          <input type="text" id="complemento" name="complemento" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>
      </div>

      <div class="input-group" style="margin-bottom: 12px;">
        <label for="bairro" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">Bairro:</label>
        <input type="text" id="bairro" name="bairro" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div class="input-group" style="flex: 1;">
          <label for="cidade" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Cidade:</label>
          <input type="text" id="cidade" name="cidade" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>

        <div class="input-group" style="flex: 0 0 100px;">
          <label for="estado" style="
            display: block;
            margin-bottom: 4px;
            color: ${CONFIG.STYLES.COLORS.TEXT};
            font-size: 14px;
          ">Estado:</label>
          <select id="estado" name="estado" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            background: white;
          ">
            <option value="">UF</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>
        </div>
      </div>

      <div class="input-group">
        <label for="referencia" style="
          display: block;
          margin-bottom: 4px;
          color: ${CONFIG.STYLES.COLORS.TEXT};
          font-size: 14px;
        ">Ponto de Referência:</label>
        <input type="text" id="referencia" name="referencia" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
      </div>
    `;
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
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          referencia: ''
        }
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
    const debouncedSave = () => {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      
      this.autoSaveTimeout = setTimeout(() => {
        this.salvarDados(form);
      }, 500);
    };

    // Adicionar listeners para todos os campos
    const campos = [
      '#nome', '#email', '#dataNascimento',
      '#cep', '#logradouro', '#numero', '#complemento',
      '#bairro', '#cidade', '#estado', '#referencia',
      '#observacoes'
    ];

    campos.forEach(campo => {
      form.querySelector(campo)?.addEventListener('input', debouncedSave);
    });

    // Configurar observer para itens do orçamento
    const itemsContainer = form.querySelector('#itens-container');
    if (itemsContainer) {
      const itemsObserver = new MutationObserver(debouncedSave);
      itemsObserver.observe(itemsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
      });

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
          endereco: {
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            referencia: ''
          }
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
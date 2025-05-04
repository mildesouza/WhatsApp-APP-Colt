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

// content.ts - Versão consolidada em IIFE
(() => {
  // 1. Configuração e tipos
  const CONFIG = {
    RETRY_MAX: 10,
    RETRY_INTERVAL: 1000,
    SELECTORS: {
      CHAT: '#main, .two, [data-testid="conversation-panel-wrapper"]',
      PHONE: '[data-id]',
      SIDEBAR_TARGET: '#app > div > div > div.two > div:first-child'
    },
    LOG_PREFIX: '[WhatsApp Orçamentos]',
  };

  // 2. Utilitários de log
  const log = {
    info: (msg: string) => console.log(`${CONFIG.LOG_PREFIX} ${msg}`),
    error: (msg: string) => console.error(`${CONFIG.LOG_PREFIX} ❌ ${msg}`),
    success: (msg: string) => console.log(`${CONFIG.LOG_PREFIX} ✅ ${msg}`)
  };

  // 3. Função de extração de telefone (preservada exatamente como validada)
  function extrairTelefone(): string | null {
    log.info("Iniciando extração de telefone...");
        try {
          const elementos = document.querySelectorAll("[data-id]");
          for (const el of elementos) {
            const dataId = el.getAttribute("data-id");
            if (dataId && dataId.includes("@c.us")) {
              const match = dataId.match(/([0-9]+)@c\.us/);
              if (match && match[1]) {
            log.success(`Telefone extraído: ${match[1]}`);
                return match[1];
              }
            }
          }

          const href = window.location.href;
          if (href.includes("/p/") || href.includes("web.whatsapp.com/send")) {
            const phone = new URLSearchParams(window.location.search).get("phone");
            if (phone) {
          log.success(`Telefone extraído da URL: ${phone}`);
              return phone;
            }
          }

      log.error("Falha na extração de telefone");
          return null;
        } catch (err) {
      log.error(`Erro: ${err}`);
          return null;
    }
  }

  // 4. Estilos do painel
  const styles = `
    .orcamento-panel {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      width: 300px;
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform-origin: top right;
    }
    .orcamento-panel.minimized {
      transform: scale(0);
      opacity: 0;
    }
    .orcamento-header {
      padding: 12px 16px;
      background: #128C7E;
      color: white;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .orcamento-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .close-btn:hover {
      opacity: 0.8;
    }
    .orcamento-content {
      padding: 16px;
    }
    .contact-info {
      margin-bottom: 16px;
      padding: 12px;
      background: #f0f2f5;
      border-radius: 6px;
    }
    .phone {
      font-size: 14px;
      color: #128C7E;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .status {
      font-size: 12px;
      color: #667781;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-btn {
      width: 100%;
      padding: 8px 12px;
      background: #128C7E;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .action-btn:hover {
      background: #0C6B5E;
    }
    .action-btn.secondary {
      background: #f0f2f5;
      color: #128C7E;
    }
    .action-btn.secondary:hover {
      background: #e0e2e5;
    }
  `;

  // 5. Injeção do painel lateral com retry via MutationObserver
  function injetarPainelLateral() {
    log.info("Iniciando injeção do painel lateral...");

    let retries = 0;
    const observer = new MutationObserver(() => {
      const target = document.querySelector(CONFIG.SELECTORS.SIDEBAR_TARGET);
      
      if (target) {
        try {
          // Criar elemento de estilo
          const styleElement = document.createElement('style');
          styleElement.textContent = styles;
          document.head.appendChild(styleElement);

          // Criar painel
          const painel = document.createElement('div');
          painel.className = 'orcamento-panel minimized'; // Começa minimizado
          painel.innerHTML = `
            <div class="orcamento-header">
              <h3 class="orcamento-title">Orçamentos WhatsApp</h3>
              <button class="close-btn" aria-label="Fechar painel">×</button>
            </div>
            <div class="orcamento-content">
              <div class="contact-info">
                <div class="phone">Nenhum contato selecionado</div>
                <div class="status">Selecione um contato para começar</div>
              </div>
              <form class="orcamento-form" onsubmit="return false;">
                <div class="collapsible-section">
                  <button type="button" class="toggle-btn" aria-expanded="false">
                    <span class="toggle-icon">▶</span>
                    Dados Pessoais
                  </button>
                  <div class="collapsible-content">
                    <div class="form-group">
                      <label for="nome">Nome</label>
                      <input type="text" id="nome" class="form-input" 
                             placeholder="Nome completo">
                    </div>
                    <div class="form-group">
                      <label for="email">E-mail</label>
                      <input type="email" id="email" class="form-input" 
                             placeholder="exemplo@email.com">
                      <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                      <label for="cpf">CPF</label>
                      <input type="text" id="cpf" class="form-input" 
                             placeholder="000.000.000-00" maxlength="14">
                      <span class="error-message"></span>
                    </div>
                    <div class="form-group">
                      <label for="dataNascimento">Data de Nascimento</label>
                      <input type="date" id="dataNascimento" class="form-input">
                    </div>
                    <div class="form-group">
                      <label for="endereco">Endereço Completo</label>
                      <textarea id="endereco" class="form-input" 
                              placeholder="Digite o endereço completo"></textarea>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label for="observacoes">Observações</label>
                  <textarea id="observacoes" class="form-input" 
                          placeholder="Observações gerais"></textarea>
                </div>
                <div class="itens-container">
                  <h4>Itens do Orçamento</h4>
                  <div id="lista-itens"></div>
                  <button type="button" class="action-btn secondary add-item">
                    + Adicionar Item
                  </button>
                </div>
                <div class="actions">
                  <button type="button" class="action-btn secondary">Histórico</button>
                </div>
              </form>
            </div>
          `;

          // Adicionar estilos adicionais
          const additionalStyles = `
            .form-group {
              margin-bottom: 16px;
            }
            .form-input {
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;
            }
            .form-input:focus {
              border-color: #128C7E;
              outline: none;
            }
            .error-message {
              color: #dc3545;
              font-size: 12px;
              margin-top: 4px;
              display: none;
            }
            .form-input.error {
              border-color: #dc3545;
            }
            .itens-container {
              margin: 16px 0;
            }
            .item-row {
              display: flex;
              gap: 8px;
              margin-bottom: 8px;
            }
            .item-row input[type="number"] {
              width: 120px;
            }
            .remove-item {
              color: #dc3545;
              cursor: pointer;
              background: none;
              border: none;
              padding: 4px;
            }
            .collapsible-section {
              margin-bottom: 16px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .toggle-btn {
              width: 100%;
              padding: 12px;
              background: #f8f9fa;
              border: none;
              text-align: left;
              cursor: pointer;
              display: flex;
              align-items: center;
              font-weight: 500;
            }
            .toggle-btn:hover {
              background: #f0f2f5;
            }
            .toggle-icon {
              display: inline-block;
              margin-right: 8px;
              transition: transform 0.2s;
            }
            .toggle-btn[aria-expanded="true"] .toggle-icon {
              transform: rotate(90deg);
            }
            .collapsible-content {
              padding: 16px;
              display: none;
            }
            .collapsible-content.expanded {
              display: block;
            }
          `;
          styleElement.textContent = styles + additionalStyles;

          // Funções de validação
          const validateEmail = (input: HTMLInputElement) => {
            const email = input.value.trim();
            if (email && !email.includes('@') || !email.includes('.')) {
              input.classList.add('error');
              const errorSpan = input.nextElementSibling as HTMLElement;
              errorSpan.textContent = 'E-mail inválido';
              errorSpan.style.display = 'block';
              return false;
            }
            input.classList.remove('error');
            const errorSpan = input.nextElementSibling as HTMLElement;
            errorSpan.style.display = 'none';
            return true;
          };

          const validateCPF = (input: HTMLInputElement) => {
            const cpf = input.value.replace(/\D/g, '');
            if (cpf && cpf.length !== 11) {
              input.classList.add('error');
              const errorSpan = input.nextElementSibling as HTMLElement;
              errorSpan.textContent = 'CPF deve ter 11 dígitos';
              errorSpan.style.display = 'block';
              return false;
            }
            input.classList.remove('error');
            const errorSpan = input.nextElementSibling as HTMLElement;
            errorSpan.style.display = 'none';
            return true;
          };

          const validateValor = (input: HTMLInputElement) => {
            const valor = parseFloat(input.value);
            if (isNaN(valor) || valor <= 0) {
              input.classList.add('error');
              return false;
            }
            input.classList.remove('error');
            return true;
          };

          // Formatação do CPF
          const formatCPF = (input: HTMLInputElement) => {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 9) {
              value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
              value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, '$1.$2.$3');
            } else if (value.length > 3) {
              value = value.replace(/^(\d{3})(\d{3}).*/, '$1.$2');
            }
            input.value = value;
          };

          const createItemRow = () => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
              <input type="text" class="form-input" placeholder="Descrição do item" required>
              <input type="number" class="form-input" placeholder="Valor" min="0" step="0.01" required>
              <button type="button" class="remove-item">×</button>
            `;
            return div;
          };

          // Event handlers
          const form = painel.querySelector('.orcamento-form') as HTMLFormElement;
          const toggleBtn = form.querySelector('.toggle-btn') as HTMLButtonElement;
          const collapsibleContent = form.querySelector('.collapsible-content') as HTMLDivElement;
          const emailInput = form.querySelector('#email') as HTMLInputElement;
          const cpfInput = form.querySelector('#cpf') as HTMLInputElement;
          const listaItens = form.querySelector('#lista-itens') as HTMLDivElement;
          const addItemButton = form.querySelector('.add-item') as HTMLButtonElement;

          // Adicionar primeiro item por padrão
          listaItens.appendChild(createItemRow());

          // Toggle da seção colapsável
          toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', (!isExpanded).toString());
            collapsibleContent.classList.toggle('expanded');
          });

          // Event listeners
          addItemButton.addEventListener('click', () => {
            listaItens.appendChild(createItemRow());
          });

          listaItens.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('remove-item')) {
              const row = (e.target as HTMLElement).closest('.item-row');
              if (row && listaItens.children.length > 1) {
                row.remove();
              }
            }
          });

          // Validação de campos
          emailInput.addEventListener('blur', () => validateEmail(emailInput));
          cpfInput.addEventListener('input', () => formatCPF(cpfInput));
          cpfInput.addEventListener('blur', () => validateCPF(cpfInput));

          // Event listener do formulário
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            
            // Validar e-mail se preenchido
            if (emailInput.value.trim()) {
              isValid = validateEmail(emailInput);
            }
            
            // Validar CPF se preenchido
            if (cpfInput.value.trim()) {
              isValid = isValid && validateCPF(cpfInput);
            }
            
            // Validar valores dos itens
            const valorInputs = form.querySelectorAll('input[type="number"]');
            valorInputs.forEach(input => {
              if (!validateValor(input as HTMLInputElement)) {
                isValid = false;
              }
            });

            if (isValid) {
              const phone = extrairTelefone();
              if (phone) {
                saveFormData(form, phone);
              } else {
                log.info('Nenhum telefone ativo para salvar');
              }
            }
          });

          // Função para salvar dados de forma segura
          const saveFormData = (form: HTMLFormElement, phone: string) => {
            if (!phone) {
              log.info('Nenhum telefone ativo para salvar dados');
              return;
            }

            try {
              const dadosPessoais = {
                nome: (form.querySelector('#nome') as HTMLInputElement)?.value || '',
                email: (form.querySelector('#email') as HTMLInputElement)?.value || '',
                cpf: (form.querySelector('#cpf') as HTMLInputElement)?.value || '',
                dataNascimento: (form.querySelector('#dataNascimento') as HTMLInputElement)?.value || '',
                endereco: (form.querySelector('#endereco') as HTMLTextAreaElement)?.value || ''
              };

              const observacoes = (form.querySelector('#observacoes') as HTMLTextAreaElement)?.value || '';
              
              // Construir array de itens com tipagem explícita
              const itens: Array<{ descricao: string; valor: number }> = Array.from(
                form.querySelectorAll<HTMLDivElement>('.item-row')
              ).map((row: HTMLDivElement) => {
                const inputs = row.querySelectorAll('input');
                return {
                  descricao: inputs[0]?.value || '',
                  valor: parseFloat(inputs[1]?.value || '0') || 0
                };
              });

              saveData(phone, {
                dadosPessoais,
                observacoes,
                itens
              });
              
              log.info(`Dados salvos para ${phone}`);
            } catch (error) {
              log.error(`Erro ao salvar dados: ${error}`);
            }
          };

          // Função para atualizar display do telefone de forma segura
          const updatePhoneDisplay = (phone: string | null, container: HTMLElement) => {
            try {
              log.info(`Atualizando display para telefone: ${phone}`);
              
              const phoneElement = container.querySelector('.phone');
              const statusElement = container.querySelector('.status');
              
              if (phoneElement && statusElement) {
                if (phone) {
                  phoneElement.textContent = `📱 ${phone}`;
                  statusElement.textContent = 'Contato ativo';
                  loadFormData(phone);
                } else {
                  phoneElement.textContent = 'Nenhum contato selecionado';
                  statusElement.textContent = 'Selecione um contato para começar';
                }
              }
            } catch (error) {
              log.error(`Erro ao atualizar display: ${error}`);
            }
          };

          // Função para carregar dados do formulário de forma segura
          const loadFormData = (phone: string) => {
            try {
              const data = loadData(phone);
              const form = document.querySelector('.orcamento-form') as HTMLFormElement;
              if (!form) return;

              // Limpar formulário antes de carregar novos dados
              form.reset();
              const listaItens = form.querySelector('#lista-itens');
              if (listaItens) {
                listaItens.innerHTML = '';
                listaItens.appendChild(createItemRow());
              }

              if (!data) return;

              if (data.dadosPessoais) {
                // Preencher dados pessoais
                for (const [field, value] of Object.entries(data.dadosPessoais)) {
                  const input = form.querySelector(`#${field}`) as HTMLInputElement | HTMLTextAreaElement;
                  if (input && typeof value === 'string') {
                    input.value = value;
                  }
                }
              }

              const obsTextarea = form.querySelector('#observacoes') as HTMLTextAreaElement;
              if (obsTextarea && data.observacoes) {
                obsTextarea.value = data.observacoes;
              }

              if (listaItens && data.itens && data.itens.length > 0) {
                listaItens.innerHTML = '';
                // Carregar itens do orçamento
                for (const item of data.itens) {
                  const row = createItemRow();
                  const inputs = row.querySelectorAll('input');
                  if (inputs[0]) inputs[0].value = item.descricao;
                  if (inputs[1]) inputs[1].value = item.valor.toString();
                  listaItens.appendChild(row);
                }
              }

              // Configurar auto-save com listener único e limpeza de duplicatas
              setupFormAutoSave(form, phone);
            } catch (error) {
              log.error(`Erro ao carregar dados: ${error}`);
            }
          };

          // Configurar auto-save com listener único e limpeza de duplicatas
          const setupFormAutoSave = (form: HTMLFormElement, phone: string) => {
            try {
              // Remover listener anterior, se existir
              if (form.__autoSaveListener) {
                form.removeEventListener('input', form.__autoSaveListener);
              }

              let saveTimeout: NodeJS.Timeout;
              const listener = (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.matches('input, textarea')) {
                  clearTimeout(saveTimeout);
                  saveTimeout = setTimeout(() => saveFormData(form, phone), 500);
                }
              };

              form.__autoSaveListener = listener;
              form.addEventListener('input', listener, { passive: true });

              log.info('Auto-save configurado com sucesso');
            } catch (error) {
              log.error(`Erro ao configurar auto-save: ${error}`);
            }
          };

          // Configurar observer de forma segura
          const chatElement = document.querySelector(CONFIG.SELECTORS.CHAT);
          if (chatElement) {
            try {
              const observer = new MutationObserver(() => {
                const newPhone = extrairTelefone();
                if (newPhone !== window.currentWhatsAppPhone) {
                  log.info(`Telefone alterado: ${newPhone}`);
                  window.currentWhatsAppPhone = newPhone;
                  updatePhoneDisplay(newPhone, painel);
                }
              });

              observer.observe(chatElement, {
                childList: true,
                subtree: false
              });

              log.info('Observer configurado com sucesso');
            } catch (error) {
              log.error(`Erro ao configurar observer: ${error}`);
            }
          }

          // Adicionar ao body
          document.body.appendChild(painel);
          // Exibir telefone do cliente assim que o painel for injetado
          const initialPhone = extrairTelefone();
          updatePhoneDisplay(initialPhone, painel);

          // Adicionar botão de abrir
          const openButton = document.createElement('button');
          openButton.className = 'action-btn';
          openButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483646;
            padding: 8px 16px;
            background: #128C7E;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          `;
          openButton.textContent = '📋 Orçamentos';
          document.body.appendChild(openButton);

          // Gerenciar estado do painel
          const togglePanel = () => {
            const isMinimized = painel.classList.contains('minimized');
            if (isMinimized) {
              painel.classList.remove('minimized');
              openButton.style.display = 'none';
              // Atualizar display e carregar dados ao abrir o painel
              const phone = extrairTelefone();
              updatePhoneDisplay(phone, painel);
            } else {
              painel.classList.add('minimized');
              openButton.style.display = 'block';
            }
          };

          // Event listeners
          openButton.addEventListener('click', togglePanel);
          const closeBtn = painel.querySelector('.close-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', togglePanel);
          }

          log.success("Painel injetado com sucesso");
          observer.disconnect();
        } catch (error) {
          log.error(`Erro ao injetar painel: ${error}`);
        }
      } else if (++retries > CONFIG.RETRY_MAX) {
        log.error("Máximo de tentativas de injeção atingido");
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 6. Inicialização
  function initialize() {
    log.info("Iniciando extensão...");
    
    if (typeof window.whatsappOrcamentosLoaded !== 'undefined') {
      log.info("Extensão já inicializada anteriormente");
      return;
    }

    window.whatsappOrcamentosLoaded = true;
    window.currentWhatsAppPhone = null;
    injetarPainelLateral();
    log.success("Extensão inicializada com sucesso");
  }

  // 7. Listener de mensagens do popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extrairTelefone") {
      sendResponse({
        telefone: extrairTelefone()
      });
    }
  return true;
});

  // 8. Iniciar a extensão
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})(); 
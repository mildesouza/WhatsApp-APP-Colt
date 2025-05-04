import { firebaseApp } from '../firebaseConfig';

// Configuração do Shadow DOM
const USE_SHADOW_DOM = true;

// Estilos do painel
const styles = `
  :host {
    position: fixed;
    top: 0;
    right: -400px; /* Começa fora da tela */
    width: 400px;
    height: 100vh;
    background: white;
    border-left: 1px solid #ccc;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    z-index: 1000;
  }

  :host(.visible) {
    right: 0;
  }

  .orcamento-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .orcamento-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;
  }

  .orcamento-title {
    font-size: 18px;
    font-weight: 500;
    color: #128C7E; /* Cor do WhatsApp */
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: #666;
    font-size: 20px;
  }

  .close-button:hover {
    color: #128C7E;
  }

  #orcamento-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  /* Botão de teste temporário */
  #open-orcamento-button {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: #128C7E;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 999;
  }

  #open-orcamento-button:hover {
    background: #0a6960;
  }
`;

export class OrcamentoSidebar extends HTMLElement {
  private shadow: ShadowRoot | null = null;
  private isVisible: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    // Inicializar Shadow DOM se habilitado
    if (USE_SHADOW_DOM) {
      this.shadow = this.attachShadow({ mode: 'open' });
    }

    // Criar estrutura do painel
    this.createSidebarStructure();

    // Adicionar botão de teste
    this.addTestButton();

    // Inicializar Firebase (já configurado em firebaseConfig.ts)
    this.initializeFirebase();
  }

  private createSidebarStructure(): void {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${styles}</style>
      <div class="orcamento-sidebar-container">
        <div class="orcamento-header">
          <h2 class="orcamento-title">Orçamento WhatsApp</h2>
          <button class="close-button" aria-label="Fechar painel">×</button>
        </div>
        <div id="orcamento-content">
          <!-- Conteúdo futuro (stepper) será injetado aqui -->
        </div>
      </div>
    `;

    // Adicionar ao Shadow DOM ou ao elemento diretamente
    const target = this.shadow || this;
    target.appendChild(template.content.cloneNode(true));

    // Adicionar event listeners
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const target = this.shadow || this;
    const closeButton = target.querySelector('.close-button');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
  }

  private addTestButton(): void {
    const button = document.createElement('button');
    button.id = 'open-orcamento-button';
    button.textContent = 'Abrir Orçamento';
    button.addEventListener('click', () => this.toggle());
    document.body.appendChild(button);
  }

  private initializeFirebase(): void {
    // Firebase já está inicializado via firebaseConfig.ts
    console.log('[OrcamentoSidebar] Firebase inicializado:', firebaseApp);
  }

  // Métodos públicos para controle de visibilidade
  public show(): void {
    this.isVisible = true;
    if (this.shadow) {
      this.classList.add('visible');
    } else {
      this.style.right = '0';
    }
  }

  public hide(): void {
    this.isVisible = false;
    if (this.shadow) {
      this.classList.remove('visible');
    } else {
      this.style.right = '-400px';
    }
  }

  public toggle(): void {
    this.isVisible ? this.hide() : this.show();
  }
}

// Registrar o componente customizado
customElements.define('orcamento-sidebar', OrcamentoSidebar);

// Exportar função para injetar o painel no WhatsApp Web
export function injectOrcamentoSidebar(): void {
  const existingSidebar = document.querySelector('orcamento-sidebar');
  if (!existingSidebar) {
    const sidebar = document.createElement('orcamento-sidebar');
    document.body.appendChild(sidebar);
    console.log('[OrcamentoSidebar] Painel injetado com sucesso');
  }
} 
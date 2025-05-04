# WhatsApp Orçamentos

## Descrição
Extensão para Chrome que permite extrair telefones de contatos e gerenciar orçamentos diretamente no WhatsApp Web.

## Estrutura do Projeto
```
src/
├── modules/       # Módulos da aplicação
├── types/         # Definições de tipos TypeScript
├── utils/         # Funções utilitárias
├── css/          # Estilos da extensão
└── images/       # Ícones e imagens
```

## Requisitos
- Node.js (versão 18 ou superior)
- NPM ou Yarn
- Google Chrome (versão 88 ou superior)

## Instalação para Desenvolvimento

1. Clone o repositório:
```bash
git clone https://github.com/mildesouza/WhatsApp-APP-Colt.git
cd WhatsApp-APP-Colt
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o ambiente:
Copie um dos arquivos de exemplo e preencha as variáveis:
- `.env-dev` para desenvolvimento
- `.env-homolog` para homologação
- `.env-prod` para produção

## Scripts Disponíveis

- `npm run build` - Gera os arquivos em `dist/`
- `npm run watch` - Executa em modo watch e reconstrói ao alterar arquivos
- `npm run dev` - Inicia o ambiente de desenvolvimento

## Instalação da Extensão no Chrome

1. Abra o Chrome e navegue para `chrome://extensions/`
2. Ative o "Developer mode" no canto superior direito
3. Clique em "Load unpacked" e selecione a pasta `dist/` do projeto

## Funcionalidades

- Extração automática de telefones de contatos
- Interface para geração de orçamentos
- Integração direta com WhatsApp Web
- Armazenamento local de dados

## Desenvolvimento

### Branches
- `main` - Branch principal
- `feature/*` - Novas funcionalidades
- `fix/*` - Correções de bugs

### Commits
Seguimos o padrão Conventional Commits:
- `feat:` - Novas funcionalidades
- `fix:` - Correções
- `docs:` - Documentação
- `chore:` - Manutenção

## Contribuição
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença
Este projeto está sob a licença MIT.

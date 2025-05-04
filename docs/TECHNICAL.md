# Documentação Técnica - WhatsApp APP Colt

## Arquitetura

### Frontend
- React 18
- Vite como bundler
- React Router para navegação
- Gerenciamento de estado com Context API/Redux (a ser implementado)

### Segurança
- Autenticação baseada em token JWT
- Políticas de CORS configuráveis por ambiente
- Headers de segurança (CSP, HSTS, etc)
- Sanitização de entrada de dados
- Proteção contra XSS e CSRF

## Estrutura de Diretórios

```
src/
├── components/     # Componentes React reutilizáveis
├── pages/         # Páginas/rotas da aplicação
├── services/      # Serviços de API e integrações
├── utils/         # Funções utilitárias
├── styles/        # Estilos globais e temas
└── config/        # Configurações da aplicação
```

## Variáveis de Ambiente

### Desenvolvimento (.env-dev)
- VITE_APP_TITLE: Título da aplicação
- VITE_API_URL: URL da API backend
- VITE_WHATSAPP_API_URL: URL da API do WhatsApp
- VITE_NODE_ENV: Ambiente atual

### Homologação (.env-homolog)
- Mesmas variáveis com valores para ambiente de homologação

### Produção (.env-prod)
- Mesmas variáveis com valores para ambiente de produção

## Práticas de Segurança

### Autenticação
- Tokens JWT com expiração configurável
- Refresh tokens para renovação automática
- Armazenamento seguro em cookies httpOnly

### Políticas de Senha
- Mínimo 8 caracteres
- Requer maiúsculas e minúsculas
- Requer números
- Requer caracteres especiais

### Headers de Segurança
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict Transport Security (HSTS)

## Build e Deploy

### Desenvolvimento
```bash
npm run dev
```

### Homologação
```bash
npm run build:homolog
```

### Produção
```bash
npm run build:prod
```

## Testes

### Unitários
```bash
npm run test
```

### Cobertura
```bash
npm run test:coverage
``` 
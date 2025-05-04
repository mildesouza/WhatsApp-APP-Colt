# WhatsApp Orçamentos

Este projeto é um plugin para WhatsApp que permite gerar e enviar orçamentos diretamente pelo WhatsApp Web.

## Instalação

1. Clone este repositório:
   ```bash
   git clone https://github.com/mildesouza/WhatsApp-Orcamentos.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd WhatsApp-Orcamentos
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

## Configuração de ambiente

Copie um dos arquivos de exemplo e preencha as variáveis:

- `.env-dev`
- `.env-homolog`
- `.env-prod`

Exemplo de conteúdo:
```env
API_KEY=your_api_key
OTHER_VAR=other_value
```

## Scripts úteis

- `npm run build` — gera os arquivos em `dist/`
- `npm run watch` — executa em modo watch e reconstrói ao alterar arquivos

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE). 
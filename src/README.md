# WhatsApp Orçamentos - Extensão Chrome

Esta extensão extrai o número de telefone do contato ativo no WhatsApp Web e permite gerenciar orçamentos associados a este contato.

## Atualização Importante

A versão anterior apresentava problemas de comunicação entre o popup e o content script. Esta versão atualizada inclui:

- Adição de um background script para melhorar a comunicação
- Métodos mais robustos para extração do número de telefone
- Melhor tratamento de erros e logging para depuração
- Suporte a mais formatos de números de telefone

## Como testar

1. Abra o Google Chrome
2. Vá para `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Se já tiver carregado a extensão anteriormente, remova-a primeiro
5. Clique em "Carregar sem compactação"
6. Selecione a pasta `src` deste projeto
7. Abra o WhatsApp Web (https://web.whatsapp.com/) e faça login
8. Abra um chat com um contato
9. Clique no ícone da extensão na barra de ferramentas do Chrome
10. A extensão deve extrair automaticamente o número de telefone do contato ativo
11. Agora você pode criar e visualizar orçamentos para este contato

## Depuração

Se ainda ocorrerem problemas, verifique:

1. Abra as Ferramentas de Desenvolvedor do Chrome (F12)
2. Vá para a aba "Console" para ver mensagens de erro
3. Verifique também o console da extensão: clique com botão direito no ícone da extensão → "Inspecionar popup"
4. Certifique-se de que a página do WhatsApp Web está completamente carregada
5. Tente recarregar a página do WhatsApp Web e a extensão

## Estrutura do Projeto

- `manifest.json`: Configuração da extensão
- `popup.html`: Interface do popup
- `css/popup.css`: Estilos para o popup
- `js/background.js`: Script em segundo plano para gerenciar comunicação
- `js/content.js`: Script injetado na página do WhatsApp Web para extrair o telefone
- `js/popup.js`: Lógica do popup
- `images/`: Ícones da extensão (precisam ser adicionados manualmente)

## Funcionalidades

- Extração automática do número de telefone do contato ativo usando múltiplos métodos
- Armazenamento de orçamentos associados ao número de telefone
- Visualização do histórico de orçamentos de um contato
- Adição de novos orçamentos com descrição e valor

## Observações

Para que a extração do número de telefone funcione, é necessário que um chat esteja aberto no WhatsApp Web. A extensão clica automaticamente no cabeçalho para abrir os dados do contato, extrai o número e fecha o painel. 
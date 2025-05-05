import { logger } from './logger';

export function extrairTelefone(): string | null {
  logger.info("Iniciando extração de telefone...");
  
  try {
    // Tentar extrair do data-id
    const elementos = document.querySelectorAll("[data-id]");
    for (const el of elementos) {
      const dataId = el.getAttribute("data-id");
      if (dataId && dataId.includes("@c.us")) {
        const match = dataId.match(/([0-9]+)@c\.us/);
        if (match && match[1]) {
          logger.success(`Telefone extraído: ${match[1]}`);
          return match[1];
        }
      }
    }

    // Tentar extrair da URL
    const href = window.location.href;
    if (href.includes("/p/") || href.includes("web.whatsapp.com/send")) {
      const phone = new URLSearchParams(window.location.search).get("phone");
      if (phone) {
        logger.success(`Telefone extraído da URL: ${phone}`);
        return phone;
      }
    }

    logger.error("Falha na extração de telefone");
    return null;
  } catch (err) {
    logger.error(`Erro ao extrair telefone: ${err}`);
    return null;
  }
} 
import { ContactExtractorModule, ExtractedContact } from '../types';
import { logger } from '../utils/logger';
import { eventBus } from '../utils/eventBus';

class ContactExtractor implements ContactExtractorModule {
  private static instance: ContactExtractor;

  private constructor() {}

  static getInstance(): ContactExtractor {
    if (!ContactExtractor.instance) {
      ContactExtractor.instance = new ContactExtractor();
    }
    return ContactExtractor.instance;
  }

  async extractPhoneNumber(): Promise<string | null> {
    try {
      const headerElement = document.querySelector('[data-testid="conversation-header"]');
      if (!headerElement) {
        logger.warn('Header do contato não encontrado');
        return null;
      }

      // Lógica de extração do número
      const phoneNumber = headerElement.textContent?.match(/\+?\d+/)?.[0] || null;
      
      if (phoneNumber) {
        logger.info('Número de telefone extraído com sucesso', { phoneNumber });
      } else {
        logger.warn('Não foi possível extrair o número de telefone');
      }

      return phoneNumber;
    } catch (error) {
      logger.error('Erro ao extrair número de telefone', { error });
      return null;
    }
  }

  async extractContactName(): Promise<string | null> {
    try {
      const nameElement = document.querySelector('[data-testid="conversation-contact-name"]');
      const name = nameElement?.textContent?.trim() || null;

      if (name) {
        logger.info('Nome do contato extraído com sucesso', { name });
      } else {
        logger.warn('Não foi possível extrair o nome do contato');
      }

      return name;
    } catch (error) {
      logger.error('Erro ao extrair nome do contato', { error });
      return null;
    }
  }

  async extractLastSeen(): Promise<Date | null> {
    try {
      const lastSeenElement = document.querySelector('[data-testid="conversation-last-seen"]');
      if (!lastSeenElement) {
        logger.warn('Elemento de último acesso não encontrado');
        return null;
      }

      const lastSeenText = lastSeenElement.textContent;
      if (!lastSeenText) {
        logger.warn('Texto de último acesso não encontrado');
        return null;
      }

      // Converter texto para data
      const date = new Date(lastSeenText);
      
      if (isNaN(date.getTime())) {
        logger.warn('Data de último acesso inválida', { lastSeenText });
        return null;
      }

      logger.info('Data de último acesso extraída com sucesso', { date });
      return date;
    } catch (error) {
      logger.error('Erro ao extrair data de último acesso', { error });
      return null;
    }
  }

  async extractCurrentContact(): Promise<ExtractedContact | null> {
    try {
      const phoneNumber = await this.extractPhoneNumber();
      if (!phoneNumber) {
        return null;
      }

      const contact: ExtractedContact = {
        phoneNumber,
        name: await this.extractContactName(),
        lastSeen: await this.extractLastSeen()
      };

      // Emitir evento de contato selecionado
      eventBus.emit('CONTACT_SELECTED', contact);

      logger.info('Contato extraído com sucesso', { contact });
      return contact;
    } catch (error) {
      logger.error('Erro ao extrair informações do contato', { error });
      return null;
    }
  }
}

export const contactExtractor = ContactExtractor.getInstance(); 
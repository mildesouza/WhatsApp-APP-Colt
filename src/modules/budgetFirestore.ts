import { firebaseApp } from './firebaseConfig';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface OrcamentoSimples {
  telefone: string;
  nomeCliente: string;
  itens: Array<{
    descricao: string;
    valor: number;
  }>;
  total: number;
  criadoEm: Date;
}

class BudgetFirestore {
  private static instance: BudgetFirestore;
  private db;

  private constructor() {
    this.db = getFirestore(firebaseApp);
  }

  static getInstance(): BudgetFirestore {
    if (!BudgetFirestore.instance) {
      BudgetFirestore.instance = new BudgetFirestore();
    }
    return BudgetFirestore.instance;
  }

  async salvarOrcamento(orcamento: OrcamentoSimples): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(this.db, 'orcamentos'), {
        ...orcamento,
        criadoEm: new Date()
      });
      
      logger.info('Orçamento salvo com sucesso', { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Erro ao salvar orçamento', { error });
      return null;
    }
  }
}

export const budgetFirestore = BudgetFirestore.getInstance(); 
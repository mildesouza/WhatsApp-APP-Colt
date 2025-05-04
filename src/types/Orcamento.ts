export interface PainelData {
  dadosPessoais?: {
    nome?: string;
    email?: string;
    cpf?: string;
    dataNascimento?: string;
    endereco?: string;
  };
  observacoes?: string;
  itens: Array<{ descricao: string; valor: number }>;
  ultimaAtualizacao: number;
} 
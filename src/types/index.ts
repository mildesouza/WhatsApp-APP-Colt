// Tipos básicos da aplicação
export interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  timestamp: number;
}

export interface ExtractedContact {
  phoneNumber: string;
  name?: string;
  lastSeen?: Date;
  status?: string;
}

export type EventType = 
  | 'CONTACT_SELECTED'
  | 'MESSAGE_SENT'
  | 'BUDGET_CREATED'
  | 'BUDGET_UPDATED'
  | 'BUDGET_DELETED'
  | 'CONNECTION_STATUS'
  | 'ERROR';

export interface EventMessage<T = unknown> {
  type: EventType;
  data: T;
  timestamp?: number;
}

export interface AppState {
  currentContact?: ExtractedContact;
  isConnected: boolean;
  error?: string;
  lastUpdate: Date;
}

export interface Budget {
  id: string;
  contact: ExtractedContact;
  items: BudgetItem[];
  total: number;
  createdAt: Date;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ContactExtractorModule {
  extractPhoneNumber: () => Promise<string | null>;
  extractContactName: () => Promise<string | null>;
  extractLastSeen: () => Promise<Date | null>;
}

export interface BudgetModule {
  createBudget: (contact: ExtractedContact) => Promise<Budget>;
  updateBudget: (budget: Budget) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<boolean>;
  getBudgets: () => Promise<Budget[]>;
  getBudgetById: (id: string) => Promise<Budget | null>;
}

export interface StorageModule {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface WhatsAppModule {
  sendMessage: (phoneNumber: string, message: string) => Promise<boolean>;
  isConnected: () => Promise<boolean>;
  onConnectionChange: (callback: (isConnected: boolean) => void) => void;
} 
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
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
} 
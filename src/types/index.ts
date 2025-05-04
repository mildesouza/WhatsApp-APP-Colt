// Tipos básicos da aplicação
export interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  timestamp: number;
}

export interface ExtractedContact {
  phoneNumber: string;
  name?: string;
}

export interface EventMessage {
  type: string;
  data: any;
}

export interface AppState {
  currentContact?: ExtractedContact;
  isConnected: boolean;
  error?: string;
} 
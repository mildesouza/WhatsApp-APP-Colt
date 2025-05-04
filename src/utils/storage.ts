import { PainelData } from '../types';

const STORAGE_PREFIX = 'whatsapp_orcamentos_';

export function getKey(phone: string): string {
  return `${STORAGE_PREFIX}${phone}`;
}

export function saveData(phone: string, data: Partial<PainelData>): boolean {
  try {
    const key = getKey(phone);
    const existing = loadData(phone) || { itens: [], ultimaAtualizacao: Date.now() };
    const merged: PainelData = {
      ...existing,
      ...data,
      ultimaAtualizacao: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error('[Storage] Erro ao salvar dados:', error);
    return false;
  }
}

export function loadData(phone: string): PainelData | null {
  try {
    const key = getKey(phone);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[Storage] Erro ao carregar dados:', error);
    return null;
  }
}

export function clearData(phone?: string): void {
  if (phone) {
    localStorage.removeItem(getKey(phone));
  } else {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  }
} 
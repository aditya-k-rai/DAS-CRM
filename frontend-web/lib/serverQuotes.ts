import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const QUOTES_FILE = path.join(DATA_DIR, 'quotations.json');

export interface ServerQuoteRecord {
  id: string;
  docNo: string;
  quoteNumber?: string;
  docType: string;
  partyName: string;
  companyName: string;
  savedAt: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'GENERATED_SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  pdfUrl?: string;
  itemsCount?: number;
  sentVia?: string;
  sentToLead?: string;
  createdByName?: string;
  createdByRole?: string;
  payload?: any;
  items?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export function getLocalQuotes(): ServerQuoteRecord[] {
  try {
    if (fs.existsSync(QUOTES_FILE)) {
      const content = fs.readFileSync(QUOTES_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[serverQuotes] Failed to read quotations.json:', err);
  }
  return [];
}

export function saveLocalQuotes(quotes: ServerQuoteRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf8');
  } catch (err) {
    console.warn('[serverQuotes] Failed to write quotations.json:', err);
  }
}

export function upsertLocalQuote(quote: ServerQuoteRecord): ServerQuoteRecord[] {
  const current = getLocalQuotes();
  const id = quote.id;
  const docNo = quote.docNo || quote.quoteNumber;
  const existingIndex = current.findIndex(
    q => (id && q.id === id) || (docNo && (q.docNo === docNo || q.quoteNumber === docNo))
  );

  let next: ServerQuoteRecord[];
  if (existingIndex >= 0) {
    next = [...current];
    next[existingIndex] = { ...next[existingIndex], ...quote, updatedAt: new Date().toISOString() };
  } else {
    next = [{ ...quote, createdAt: quote.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current];
  }
  saveLocalQuotes(next);
  return next;
}

export function deleteLocalQuote(id: string): ServerQuoteRecord[] {
  const current = getLocalQuotes();
  const next = current.filter(q => q.id !== id && q.docNo !== id && q.quoteNumber !== id);
  saveLocalQuotes(next);
  return next;
}

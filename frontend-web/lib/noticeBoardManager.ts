export interface WebNoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  avatar?: string;
  createdAt: number;
  expiresAt: number; // createdAt + 7 days
  priority: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
  mentions: string[];
  acknowledgedBy: string[];
}

export const NOTICE_STORAGE_KEY = 'das_crm_notices_board_v1';
export const NOTICE_SYNC_CHANNEL = 'das_crm_notice_channel';
export const NOTICE_UPDATE_EVENT = 'das_crm_notices_updated';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const INITIAL_NOTICES: WebNoticeItem[] = [];

class NoticeBoardManager {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(NOTICE_SYNC_CHANNEL);
      } catch (_) {}
    }
  }

  public getNotices(): WebNoticeItem[] {
    if (typeof window === 'undefined') return INITIAL_NOTICES;
    try {
      const stored = localStorage.getItem(NOTICE_STORAGE_KEY);
      if (stored) {
        const parsed: WebNoticeItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Auto-purge notices older than 7 days
          const active = parsed.filter(n => n.expiresAt > Date.now());
          if (active.length !== parsed.length) {
            this.saveNotices(active, false);
          }
          return active;
        }
      }
    } catch (_) {}
    return INITIAL_NOTICES;
  }

  public saveNotices(notices: WebNoticeItem[], broadcast: boolean = true): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(notices));
    } catch (_) {}

    if (broadcast) {
      try {
        window.dispatchEvent(new CustomEvent(NOTICE_UPDATE_EVENT, { detail: notices }));
        if (this.channel) {
          this.channel.postMessage({ type: 'NOTICES_UPDATED', notices });
        }
      } catch (_) {}
    }
  }

  public async fetchServerNotices(): Promise<WebNoticeItem[]> {
    try {
      const res = await fetch('/api/notices');
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData)) {
          const active = serverData.filter(n => n.expiresAt > Date.now());
          this.saveNotices(active, true);
          return active;
        }
      }
    } catch (_) {}
    return this.getNotices();
  }

  public async postNotice(data: {
    title: string;
    content: string;
    author: string;
    authorRole: string;
    priority?: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
    mentions?: string[];
  }): Promise<WebNoticeItem> {
    const newNotice: WebNoticeItem = {
      id: `wn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      content: data.content.trim(),
      author: data.author || 'Administrator',
      authorRole: data.authorRole || 'ADMIN',
      avatar: (data.author || 'AD').substring(0, 2).toUpperCase(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SEVEN_DAYS_MS,
      priority: data.priority || 'IMPORTANT',
      mentions: data.mentions && data.mentions.length > 0 ? data.mentions : ['@All Staff'],
      acknowledgedBy: [],
    };

    const current = this.getNotices();
    const updated = [newNotice, ...current.filter(n => n.id !== newNotice.id)];
    this.saveNotices(updated, true);

    // Persist to server API
    try {
      await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice),
      }).catch(() => null);
    } catch (_) {}

    return newNotice;
  }

  public async acknowledgeNotice(id: string, userEmail: string): Promise<WebNoticeItem[]> {
    const current = this.getNotices();
    const email = userEmail || 'user';
    const updated = current.map(n => {
      if (n.id === id && !n.acknowledgedBy.includes(email)) {
        return { ...n, acknowledgedBy: [...n.acknowledgedBy, email] };
      }
      return n;
    });

    this.saveNotices(updated, true);

    try {
      await fetch(`/api/notices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acknowledgeEmail: email }),
      }).catch(() => null);
    } catch (_) {}

    return updated;
  }

  public async deleteNotice(id: string): Promise<WebNoticeItem[]> {
    const current = this.getNotices();
    const updated = current.filter(n => n.id !== id);
    this.saveNotices(updated, true);

    try {
      await fetch(`/api/notices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => null);
    } catch (_) {}

    return updated;
  }

  public subscribe(callback: (notices: WebNoticeItem[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        callback(e.detail);
      } else {
        callback(this.getNotices());
      }
    };

    window.addEventListener(NOTICE_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(NOTICE_SYNC_CHANNEL);
        bc.onmessage = (ev) => {
          if (ev.data?.notices && Array.isArray(ev.data.notices)) {
            callback(ev.data.notices);
          } else {
            callback(this.getNotices());
          }
        };
      }
    } catch (_) {}

    return () => {
      window.removeEventListener(NOTICE_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
    };
  }
}

export const noticeBoardManager = new NoticeBoardManager();

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, MoreHorizontal, Paperclip, Smile, Check, CheckCheck, Search, Filter } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface Message {
  id: string;
  from: 'rep' | 'lead';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'file' | 'quote';
}

interface Thread {
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  online: boolean;
}

// ─── Data ─────────────────────────────────────────────────
const THREADS: Thread[] = [
  { leadId: '1', leadName: 'Rajesh Kumar', company: 'TechCorp', phone: '9876543210', lastMsg: 'Can you send the pricing doc?', lastTime: '2:14 PM', unread: 2, online: true },
  { leadId: '2', leadName: 'Priya Sharma',  company: 'Sunita RE', phone: '8765432109', lastMsg: 'Yes, we are interested!', lastTime: '11:00 AM', unread: 0, online: false },
  { leadId: '3', leadName: 'Amit Patel',    company: 'Lakshmi Auto', phone: '7654321098', lastMsg: "Let me check with my team.", lastTime: 'Yesterday', unread: 0, online: false },
  { leadId: '4', leadName: 'Sunita Verma',  company: 'Construkt Inc', phone: '9988776655', lastMsg: 'Thanks, talk soon!', lastTime: 'Yesterday', unread: 1, online: true },
];

const MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', from: 'rep', text: 'Hi Rajesh! Following up on our CRM demo call yesterday. Did you have a chance to share the recording with your tech team?', time: '10:00 AM', status: 'read' },
    { id: '2', from: 'lead', text: 'Yes! They loved the automation features. One question — does it support custom field creation for our industry?', time: '10:15 AM', status: 'read' },
    { id: '3', from: 'rep', text: 'Absolutely! Admin users can create unlimited custom fields for Leads, Contacts, and Deals. I can show you this in a quick 10-min call.', time: '10:20 AM', status: 'read' },
    { id: '4', from: 'lead', text: 'Perfect. Also, can you send the enterprise pricing doc? We are considering 50+ seats.', time: '2:10 PM', status: 'read' },
    { id: '5', from: 'lead', text: 'Can you send the pricing doc?', time: '2:14 PM', status: 'read' },
    { id: '6', from: 'rep', text: 'Sure! Sending the proposal right now. You can also find it attached in your email from this morning.', time: '2:15 PM', status: 'delivered' },
  ],
};

const QUICK_REPLIES = [
  'Thanks for reaching out! I\'ll get back to you shortly.',
  'Sure, I\'ll send the pricing details right away.',
  'Let me schedule a demo call. When are you available?',
  'Our enterprise plan supports unlimited users.',
];

import { useAuth } from '@/context/AuthContext';
import { Lock } from 'lucide-react';

export function WhatsAppThread() {
  const { canAccessFeature, subscription, canEdit } = useAuth();
  const [activeThread, setActiveThread]   = useState<Thread>(THREADS[0]);
  const [messages, setMessages]           = useState<Message[]>(MESSAGES['1'] || []);
  const [input, setInput]                 = useState('');
  const [showQuickReplies, setShowQR]     = useState(false);
  const endRef                            = useRef<HTMLDivElement>(null);

  const hasWA = canAccessFeature('whatsApp');
  const isEditable = canEdit();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectThread = (t: Thread) => {
    setActiveThread(t);
    setMessages(MESSAGES[t.leadId] ?? []);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      from: 'rep', text: input, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setShowQR(false);

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'delivered' } : m));
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border relative" style={{ borderColor: 'rgb(var(--border))' }}>
      {!hasWA && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
            <Lock size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">WhatsApp Feature Locked in Free Trial</h3>
          <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">
            WhatsApp Communication Threads are excluded from the 30-Day Free Trial plan. Upgrade to a paid plan (Basic, Pro, or Pro Max) allocated by your Administrative to unlock WhatsApp messaging.
          </p>
          <div className="flex gap-2">
            <span className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
              Allocated Plan: {subscription.planType} ({subscription.trialDaysLeft}d Trial Remaining)
            </span>
          </div>
        </div>
      )}

      {/* LEFT: Thread List */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base">WhatsApp Threads</h2>
            <div className="flex gap-1">
              <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center"><Search size={14} /></button>
              <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center"><Filter size={14} /></button>
            </div>
          </div>
          <input className="crm-input text-sm h-8 w-full" placeholder="Search conversations..." />
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {THREADS.map(t => (
            <button key={t.leadId} onClick={() => selectThread(t)}
              className="w-full flex items-start gap-3 px-4 py-3 border-b text-left transition-all hover:bg-muted/20"
              style={{
                borderColor: 'rgb(var(--border))',
                background: activeThread.leadId === t.leadId ? 'rgba(99,102,241,0.08)' : 'transparent',
              }}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
                  {t.leadName.split(' ').map(n => n[0]).join('')}
                </div>
                {t.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: 'rgb(34,197,94)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t.leadName}</p>
                  <p className="text-xs text-muted">{t.lastTime}</p>
                </div>
                <p className="text-xs text-muted">{t.company}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted truncate">{t.lastMsg}</p>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ml-1" style={{ background: 'rgb(34,197,94)', color: '#000' }}>
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Chat window */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#060810' }}>
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
                {activeThread.leadName.split(' ').map(n => n[0]).join('')}
              </div>
              {activeThread.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: 'rgb(34,197,94)' }} />}
            </div>
            <div>
              <p className="font-semibold text-sm">{activeThread.leadName}</p>
              <p className="text-xs text-muted">{activeThread.company} · +91 {activeThread.phone}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[Phone, Video, MoreHorizontal].map((Icon, i) => (
              <button key={i} className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center">
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Date divider */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border))' }} />
            <span className="text-xs text-muted px-2">Today</span>
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border))' }} />
          </div>

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'rep' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-xs lg:max-w-sm px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.from === 'rep' ? 'rgba(99,102,241,0.25)' : 'rgb(var(--card))',
                  borderRadius: msg.from === 'rep' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  border: `1px solid ${msg.from === 'rep' ? 'rgba(99,102,241,0.3)' : 'rgb(var(--border))'}`,
                }}
              >
                <p>{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.from === 'rep' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-muted">{msg.time}</span>
                  {msg.from === 'rep' && (
                    msg.status === 'read' ? <CheckCheck size={12} style={{ color: 'rgb(96,165,250)' }} /> :
                    msg.status === 'delivered' ? <CheckCheck size={12} className="text-muted" /> :
                    <Check size={12} className="text-muted" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 flex-wrap">
              {QUICK_REPLIES.map(qr => (
                <button key={qr} onClick={() => { setInput(qr); setShowQR(false); }}
                  className="text-xs px-3 py-1.5 rounded-full border truncate max-w-xs"
                  style={{ borderColor: 'rgba(99,102,241,0.3)', color: 'rgb(129,140,248)', background: 'rgba(99,102,241,0.08)' }}>
                  {qr.slice(0, 45)}{qr.length > 45 ? '…' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQR(!showQuickReplies)} className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center text-muted">
              <Smile size={18} />
            </button>
            <button className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center text-muted">
              <Paperclip size={18} />
            </button>
            <input
              className="crm-input text-sm flex-1 h-10"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: input.trim() ? 'rgb(99,102,241)' : 'rgb(var(--muted))' }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

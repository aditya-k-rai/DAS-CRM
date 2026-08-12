'use client';

import { useState } from 'react';
import { PhoneCall, CheckCircle2, Clock, X, MessageSquare, Save } from 'lucide-react';

interface PostCallLoggerModalProps {
  open: boolean;
  leadName: string;
  leadPhone: string;
  onClose: () => void;
  onSave: (result: string, notes: string, nextFollowUp?: string) => void;
}

const CALL_OUTCOMES = [
  { id: 'interested', label: 'Connected & Interested', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { id: 'followup',   label: 'Follow-up Required',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'no_answer',  label: 'Call Not Answered',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'busy',       label: 'Busy / Call Cut',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { id: 'wrong_num',  label: 'Invalid / Wrong Number', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

export function PostCallLoggerModal({ open, leadName, leadPhone, onClose, onSave }: PostCallLoggerModalProps) {
  const [outcome, setOutcome]       = useState('interested');
  const [notes, setNotes]           = useState('');
  const [nextDate, setNextDate]     = useState('2026-08-14');
  const [submitted, setSubmitted]   = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSave(outcome, notes, nextDate);
      setSubmitted(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="crm-card w-full max-w-lg relative z-10 space-y-5 animate-scale-in border-emerald-500/40">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <PhoneCall size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Call Ended — Update Lead Status</h3>
              <p className="text-xs text-muted">Call completed for <strong className="text-white">{leadName}</strong> ({leadPhone})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Outcome Selector */}
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">1. Select Call Outcome</label>
          <div className="grid grid-cols-2 gap-2">
            {CALL_OUTCOMES.map(o => {
              const selected = outcome === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOutcome(o.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${selected ? 'border-emerald-500 shadow-md' : 'border-border text-muted hover:text-white'}`}
                  style={{ background: selected ? o.bg : 'rgb(var(--background))', color: selected ? o.color : undefined }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">2. Schedule Next Follow-up Date</label>
          <input
            type="date"
            className="crm-input text-sm h-10 w-full"
            value={nextDate}
            onChange={e => setNextDate(e.target.value)}
          />
        </div>

        {/* Call Notes */}
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">3. Customer Response & Call Notes</label>
          <textarea
            className="crm-input text-sm w-full h-20 resize-none"
            placeholder="Type key response details from customer during the call..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Submit button */}
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary text-sm" onClick={onClose}>Skip Logging</button>
          <button
            className="btn-primary text-sm gap-2 flex items-center font-bold px-6"
            onClick={handleSubmit}
            disabled={submitted}
          >
            {submitted ? <><CheckCircle2 size={16} style={{ color: '#22c55e' }} /> Response Saved!</> : <><Save size={16} /> Save & Log Call</>}
          </button>
        </div>
      </div>
    </div>
  );
}

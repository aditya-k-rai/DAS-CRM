'use client';

import { useState, useRef } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  FileText, Upload, Search, Download, Share2,
  Mail, MessageSquare, Eye, Trash2, Plus,
  X, FolderOpen, Star, Clock, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────
type PdfCategory = 'PRODUCT' | 'PRICING' | 'SPECIFICATION' | 'PROPOSAL';

interface PdfItem {
  id: string;
  title: string;
  size: string;
  updated: string;
  category: PdfCategory;
  downloadsCount: number;
  pages?: number;
  author?: string;
}

// ── Seed Data (mirrors Android PdfCatalogueScreen) ──────
const INITIAL_PDFS: PdfItem[] = [
  {
    id: '1',
    title: 'DAS CRM Enterprise Suite 2026 Deck.pdf',
    size: '4.2 MB',
    updated: 'Updated 2 days ago',
    category: 'PRODUCT',
    downloadsCount: 142,
    pages: 28,
    author: 'Aditya Kumar Rai',
  },
  {
    id: '2',
    title: 'AI Lead Scoring Engine Pro Specs.pdf',
    size: '2.8 MB',
    updated: 'Updated last week',
    category: 'SPECIFICATION',
    downloadsCount: 89,
    pages: 14,
    author: 'Product Team',
  },
  {
    id: '3',
    title: 'WhatsApp Cloud API Pricing Rate Card.pdf',
    size: '1.5 MB',
    updated: 'Updated 3 days ago',
    category: 'PRICING',
    downloadsCount: 215,
    pages: 6,
    author: 'Sales Team',
  },
  {
    id: '4',
    title: 'GST 18% Commercial Proposal Template.pdf',
    size: '1.9 MB',
    updated: 'Updated yesterday',
    category: 'PROPOSAL',
    downloadsCount: 64,
    pages: 10,
    author: 'Finance Team',
  },
  {
    id: '5',
    title: 'DAS CRM Mobile App Feature Guide.pdf',
    size: '3.1 MB',
    updated: 'Updated 5 days ago',
    category: 'PRODUCT',
    downloadsCount: 178,
    pages: 22,
    author: 'Aditya Kumar Rai',
  },
  {
    id: '6',
    title: 'Annual Subscription Pricing Tiers 2026.pdf',
    size: '0.9 MB',
    updated: 'Updated 1 week ago',
    category: 'PRICING',
    downloadsCount: 312,
    pages: 4,
    author: 'Sales Team',
  },
];

// ── Category badge styles ────────────────────────────────
const CATEGORY_STYLES: Record<PdfCategory, { bg: string; text: string; border: string; label: string }> = {
  PRODUCT:       { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  label: 'Product' },
  PRICING:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Pricing' },
  SPECIFICATION: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    label: 'Spec' },
  PROPOSAL:      { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   label: 'Proposal' },
};

// ── Email Modal ──────────────────────────────────────────
function EmailDispatchModal({ pdf, onClose }: { pdf: PdfItem; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email.trim() || !email.includes('@')) return;
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Mail size={18} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Email PDF Brochure</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-muted text-xs mb-4 leading-relaxed">
          Dispatching: <span className="text-white font-semibold">{pdf.title}</span>
        </p>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-emerald-400 font-bold text-sm">Brochure dispatched via AWS SES!</p>
            <p className="text-muted text-xs mt-1">{email}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Recipient email address..."
              className="crm-input w-full"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
              <button
                onClick={handleSend}
                disabled={!email.trim() || !email.includes('@')}
                className="btn-primary flex-1 text-xs py-2 gap-1.5 disabled:opacity-40"
              >
                <Mail size={13} /> Send Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WhatsApp Dispatch Modal ──────────────────────────────
function WhatsAppDispatchModal({ pdf, onClose }: { pdf: PdfItem; onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const shareUrl = `https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`;
    const text = encodeURIComponent(`Hi! Here is the corporate PDF brochure you requested:\n📄 ${pdf.title}\n📥 Download: ${shareUrl}`);
    const waUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`;
    window.open(waUrl, '_blank');
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <MessageSquare size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Dispatch via WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-muted text-xs mb-4 leading-relaxed">
          Dispatching: <span className="text-white font-semibold">{pdf.title}</span>
        </p>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-emerald-400 font-bold text-sm">WhatsApp share opened!</p>
            <p className="text-muted text-xs mt-1">Brochure link generated & ready to share</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Recipient phone with country code (e.g. +91...)"
              className="crm-input w-full"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
              <button
                onClick={handleSend}
                disabled={phone.replace(/\D/g, '').length < 7}
                className="btn-primary flex-1 text-xs py-2 gap-1.5 disabled:opacity-40"
                style={{ background: '#10b981' }}
              >
                <MessageSquare size={13} /> Send via WA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview Modal ────────────────────────────────────────
function PreviewModal({ pdf, onClose }: { pdf: PdfItem; onClose: () => void }) {
  const cat = CATEGORY_STYLES[pdf.category];
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-2xl w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{pdf.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', cat.bg, cat.text, cat.border)}>{cat.label}</span>
                <span className="text-muted text-xs">{pdf.size}</span>
                {pdf.pages && <span className="text-muted text-xs">• {pdf.pages} pages</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-6">
          <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-4" style={{ background: 'rgb(9 11 20)', borderColor: 'rgb(var(--border))' }}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 flex items-center justify-center">
              <FileText size={36} className="text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{pdf.title}</p>
              <p className="text-cyan-400 text-sm mt-1">{pdf.category} • {pdf.size}{pdf.pages ? ` • ${pdf.pages} pages` : ''}</p>
              <p className="text-muted text-xs mt-3 max-w-xs leading-relaxed">
                Official DAS CRM Document Preview Renderer. 2-way sync enabled across mobile & web portals.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Download size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{pdf.downloadsCount} downloads</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Clock size={13} />
                <span>{pdf.updated}</span>
              </div>
              {pdf.author && (
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Star size={13} className="text-amber-400" />
                  <span>{pdf.author}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 text-xs gap-1.5"
            >
              <X size={13} /> Close
            </button>
            <button
              onClick={() => {
                const link = `https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`;
                navigator.clipboard.writeText(link).catch(() => {});
              }}
              className="btn-secondary flex-1 text-xs gap-1.5"
            >
              <Share2 size={13} /> Copy Link
            </button>
            <a
              href={`https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-xs gap-1.5 inline-flex items-center justify-center"
            >
              <Download size={13} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ─────────────────────────────────────────
function UploadModal({ onClose, onPublish }: { onClose: () => void; onPublish: (pdf: PdfItem) => void }) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('');
  const [category, setCategory] = useState<PdfCategory>('PRODUCT');
  const [pages, setPages] = useState('');
  const [author, setAuthor] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) setTitle(file.name.replace('.pdf', ''));
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setSize(`${mb} MB`);
    }
  };

  const handlePublish = () => {
    if (!title.trim()) return;
    const filename = title.endsWith('.pdf') ? title.trim() : `${title.trim()}.pdf`;
    onPublish({
      id: `pdf_${Date.now()}`,
      title: filename,
      size: size.trim() || '2.0 MB',
      updated: 'Just now',
      category,
      downloadsCount: 0,
      pages: pages ? parseInt(pages) : undefined,
      author: author.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Upload size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Upload Corporate PDF Brochure</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* File Drop Zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)' }}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            <FileText size={28} className="text-indigo-400 mx-auto mb-2" />
            {fileName ? (
              <p className="text-white text-xs font-semibold">{fileName}</p>
            ) : (
              <>
                <p className="text-white text-sm font-semibold">Drop PDF here or click to browse</p>
                <p className="text-muted text-xs mt-1">Supports .pdf files up to 50 MB</p>
              </>
            )}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brochure title (e.g. Q4 Product Catalog)"
            className="crm-input w-full"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="File size (e.g. 4.5 MB)"
              className="crm-input"
            />
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="No. of pages"
              className="crm-input"
            />
          </div>

          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author / team name"
            className="crm-input w-full"
          />

          {/* Category selector */}
          <div>
            <p className="text-muted text-xs mb-2 font-medium">Category</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CATEGORY_STYLES) as PdfCategory[]).map((cat) => {
                const s = CATEGORY_STYLES[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'text-[10px] font-bold py-2 rounded-lg border transition-all',
                      category === cat ? `${s.bg} ${s.text} ${s.border}` : 'border-slate-800 text-muted hover:border-slate-600'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2.5">Cancel</button>
            <button
              onClick={handlePublish}
              disabled={!title.trim()}
              className="btn-primary flex-1 text-xs py-2.5 gap-1.5 disabled:opacity-40"
              style={{ background: '#10b981' }}
            >
              <Upload size={13} /> Publish PDF Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────
export default function PdfCataloguePage() {
  const [pdfs, setPdfs] = useState<PdfItem[]>(INITIAL_PDFS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PdfCategory | 'ALL'>('ALL');
  const [previewPdf, setPreviewPdf] = useState<PdfItem | null>(null);
  const [emailPdf, setEmailPdf] = useState<PdfItem | null>(null);
  const [waPdf, setWaPdf] = useState<PdfItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = pdfs.filter((p) => {
    const matchSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const totalDownloads = pdfs.reduce((s, p) => s + p.downloadsCount, 0);

  const handleDelete = (id: string) => {
    if (!confirm('Remove this PDF from the catalogue?')) return;
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <Topbar
        title="PDF Catalogue & Brochure Hub"
        actions={
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-xs gap-1.5 px-3 py-2"
          >
            <Plus size={14} /> Upload PDF
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">
        {/* Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Documents', value: pdfs.length, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
            { label: 'Total Downloads', value: totalDownloads, icon: Download, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'Product Brochures', value: pdfs.filter(p => p.category === 'PRODUCT').length, icon: FolderOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
            { label: 'Most Downloaded', value: Math.max(...pdfs.map(p => p.downloadsCount)), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium">{stat.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon size={15} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Page Header */}
        <div className="crm-card p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                Corporate PDF Catalogues & Decks
              </h2>
              <p className="text-muted text-xs mt-1">
                Download, preview, share or dispatch PDF brochures directly to leads via WhatsApp & Email.
              </p>
            </div>
          </div>

          {/* Search & Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalogues by title or keyword..."
                className="crm-input pl-9 w-full"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', ...Object.keys(CATEGORY_STYLES)] as (PdfCategory | 'ALL')[]).map((cat) => {
                const isActive = activeCategory === cat;
                const s = cat !== 'ALL' ? CATEGORY_STYLES[cat as PdfCategory] : null;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      isActive && cat !== 'ALL' && s ? `${s.bg} ${s.text} ${s.border}` :
                      isActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' :
                      'border-slate-800 text-muted hover:text-white hover:border-slate-600'
                    )}
                  >
                    {cat === 'ALL' ? 'All' : CATEGORY_STYLES[cat as PdfCategory].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PDF Grid / List */}
        {filtered.length === 0 ? (
          <div className="crm-card p-12 text-center">
            <FileText size={40} className="text-muted mx-auto mb-3" />
            <p className="text-white font-semibold">No PDFs found</p>
            <p className="text-muted text-sm mt-1">Try adjusting your search or upload a new brochure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((pdf, idx) => {
              const cat = CATEGORY_STYLES[pdf.category];
              return (
                <div
                  key={pdf.id}
                  className="crm-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-indigo-500/30 transition-all"
                >
                  {/* PDF icon + meta */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <FileText size={22} className="text-indigo-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm truncate">{pdf.title}</p>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', cat.bg, cat.text, cat.border)}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-muted text-xs flex items-center gap-1">
                          <FileText size={11} /> {pdf.size}
                        </span>
                        {pdf.pages && (
                          <span className="text-muted text-xs">{pdf.pages} pages</span>
                        )}
                        <span className="text-muted text-xs flex items-center gap-1">
                          <Clock size={11} /> {pdf.updated}
                        </span>
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <Download size={11} /> {pdf.downloadsCount} downloads
                        </span>
                        {pdf.author && (
                          <span className="text-muted text-xs flex items-center gap-1">
                            <Star size={11} className="text-amber-400" /> {pdf.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setPreviewPdf(pdf)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all"
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button
                      onClick={() => setWaPdf(pdf)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                    >
                      <MessageSquare size={12} /> WA
                    </button>
                    <button
                      onClick={() => setEmailPdf(pdf)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
                    >
                      <Mail size={12} /> Email
                    </button>
                    <a
                      href={`https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-muted border border-slate-700 text-xs font-semibold hover:text-white hover:border-slate-600 transition-all"
                    >
                      <Download size={12} /> Download
                    </a>
                    <button
                      onClick={() => handleDelete(pdf.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                      title="Remove from catalogue"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {previewPdf && <PreviewModal pdf={previewPdf} onClose={() => setPreviewPdf(null)} />}
      {emailPdf   && <EmailDispatchModal pdf={emailPdf} onClose={() => setEmailPdf(null)} />}
      {waPdf      && <WhatsAppDispatchModal pdf={waPdf} onClose={() => setWaPdf(null)} />}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onPublish={(pdf) => setPdfs((prev) => [pdf, ...prev])}
        />
      )}
    </>
  );
}

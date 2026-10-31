'use client';

/**
 * QuotationViewerModal.tsx
 * Dual-Mode Quotation Generator:
 * 1. Customer Quotation (Branded, Scope, Itemized Specs, Payment Terms, Warranty, Sign-off)
 * 2. Internal Costing Sheet (Confidential Purchase Rates, Labor, Wastage, Net Cost, Profit & Margin)
 *
 * Supports PDF Generation via jsPDF, Revision History, and Status Tracking.
 */

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { InteriorQuotation } from '@/types/interiorStudio';
import { InteriorProjectsStore } from '@/lib/interiorProjectsStore';
import {
  Download,
  Share2,
  Printer,
  ShieldAlert,
  CheckCircle,
  Clock,
  Send,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  X,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  quotation: InteriorQuotation;
  onClose: () => void;
  onStatusChange?: (newStatus: InteriorQuotation['status']) => void;
  onRevisionCreated?: (newQuote: InteriorQuotation) => void;
}

export function QuotationViewerModal({
  quotation,
  onClose,
  onStatusChange,
  onRevisionCreated,
}: Props) {
  const [activeSheet, setActiveSheet] = useState<'customer' | 'internal'>('customer');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Group BOQ items by room
  const roomGroups = React.useMemo(() => {
    const map: Record<string, typeof quotation.boqItems> = {};
    quotation.boqItems.forEach(item => {
      const r = item.roomName || 'General';
      if (!map[r]) map[r] = [];
      map[r].push(item);
    });
    return map;
  }, [quotation.boqItems]);

  // ── PDF Export Function ──────────────────────────────────────────
  const handleExportPDF = () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Brand Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('DAS CRM PLATFORM', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Interior Solutions & Architecture Studio • GSTIN: 27AADCB2234Q1Z8', 14, 22);

      // Quote & Lead Meta Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 38, pageWidth - 28, 28, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 38, pageWidth - 28, 28, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`QUOTATION #${quotation.quoteNumber} (Rev ${quotation.revision})`, 18, 46);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Client: ${quotation.leadName}`, 18, 53);
      doc.text(`Email: ${quotation.leadEmail} • Phone: ${quotation.leadPhone}`, 18, 59);

      doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, pageWidth - 70, 46);
      doc.text(`Project: ${quotation.projectName}`, pageWidth - 70, 53);
      doc.text(`Level: ${quotation.floorLevel}`, pageWidth - 70, 59);

      // Table Header
      let curY = 74;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, curY, pageWidth - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Item & Specification', 18, curY + 5.5);
      doc.text('Qty', 115, curY + 5.5);
      doc.text('Unit', 130, curY + 5.5);
      doc.text('Rate (INR)', 148, curY + 5.5);
      doc.text('Amount (INR)', pageWidth - 42, curY + 5.5);

      curY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      quotation.boqItems.slice(0, 16).forEach(item => {
        if (curY > 260) {
          doc.addPage();
          curY = 20;
        }
        const nameLines = doc.splitTextToSize(item.itemName, 90);
        doc.text(nameLines[0], 18, curY);
        doc.text(String(item.quantity), 115, curY);
        doc.text(item.unit, 130, curY);
        doc.text(`₹${item.sellingRate.toLocaleString('en-IN')}`, 148, curY);
        doc.text(`₹${item.totalSellingAmount.toLocaleString('en-IN')}`, pageWidth - 42, curY);
        curY += 7;
      });

      // Total Box
      curY = Math.max(curY + 6, 210);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, curY, pageWidth - 14, curY);
      curY += 6;

      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal Selling Amount:', pageWidth - 80, curY);
      doc.text(`₹${quotation.subtotalSelling.toLocaleString('en-IN')}`, pageWidth - 35, curY);
      curY += 6;

      doc.text(`GST (${quotation.gstPercentage}%):`, pageWidth - 80, curY);
      doc.text(`₹${quotation.gstAmount.toLocaleString('en-IN')}`, pageWidth - 35, curY);
      curY += 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Grand Total Payable:', pageWidth - 80, curY);
      doc.text(`₹${quotation.grandTotalINR.toLocaleString('en-IN')}`, pageWidth - 35, curY);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated via DAS CRM Multi-Tenant Platform • All Rights Reserved', 14, 285);

      doc.save(`${quotation.quoteNumber}-Rev${quotation.revision}.pdf`);
    } catch (err) {
      alert('Error generating PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCreateRevision = () => {
    if (confirm(`Create Revision ${quotation.revision + 1} for this quotation?`)) {
      const rev = InteriorProjectsStore.createRevision(quotation.id);
      if (rev && onRevisionCreated) {
        onRevisionCreated(rev);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ── Top Modal Header Bar ──────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              INT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">
                  Quotation #{quotation.quoteNumber}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Rev {quotation.revision}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    quotation.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : quotation.status === 'SENT'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {quotation.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client: {quotation.leadName} • {quotation.projectName} ({quotation.floorLevel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sheet Toggle Pills */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSheet('customer')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSheet === 'customer'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Customer Quote
              </button>
              <button
                type="button"
                onClick={() => setActiveSheet('internal')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  activeSheet === 'internal'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <Lock size={12} /> Internal Cost Sheet
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={downloadingPdf}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download size={13} /> {downloadingPdf ? 'Exporting...' : 'PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Document Body Container ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Internal Warning Banner if active */}
          {activeSheet === 'internal' && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
              <ShieldAlert size={18} className="text-rose-400 shrink-0" />
              <div>
                <span className="font-extrabold uppercase tracking-wider">Confidential Costing Document:</span>
                <p className="text-[11px] text-rose-200/80 mt-0.5">
                  Contains raw purchase prices, direct contractor labor payouts, wastage margins and internal contractor profits. Never share with clients.
                </p>
              </div>
            </div>
          )}

          {/* Quotation Header Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                {activeSheet === 'customer' ? 'Official Proposal' : 'Contractor Costing Matrix'}
              </span>
              <h2 className="text-xl font-bold text-foreground mt-2">
                {activeSheet === 'customer' ? 'Interior Turnkey Proposal' : 'Internal Cost & Profit Analysis'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Project Carpet Area: <span className="font-bold text-foreground">{quotation.roomsSummary.totalAreaSqFt} sq.ft</span> across {quotation.roomsSummary.roomCount} rooms
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <p className="text-muted-foreground">Valid Until: <span className="font-mono font-bold text-slate-200">{quotation.validUntil}</span></p>
              <p className="text-muted-foreground">Generated By: <span className="font-bold text-slate-200">DAS CRM Architecture Engine</span></p>
              <p className="text-muted-foreground">Payment Currency: <span className="font-bold text-emerald-400">INR (₹)</span></p>
            </div>
          </div>

          {/* ── ROOM-WISE ITEM BREAKDOWN ─────────────────────────────── */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers size={15} className="text-indigo-400" />
              Room-Wise Scope &amp; Specifications ({quotation.boqItems.length} Items)
            </h4>

            {Object.entries(roomGroups).map(([roomName, items]) => (
              <div key={roomName} className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200">{roomName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{items.length} work items</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="crm-table text-xs">
                    <thead>
                      <tr>
                        <th>Item &amp; Specifications</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        {activeSheet === 'internal' && <th>Material Cost</th>}
                        {activeSheet === 'internal' && <th>Labor Cost</th>}
                        {activeSheet === 'internal' && <th>Total Cost (₹)</th>}
                        <th>Rate (₹)</th>
                        <th className="text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(b => (
                        <tr key={b.id}>
                          <td>
                            <p className="font-bold text-foreground">{b.itemName}</p>
                            <p className="text-[10px] text-muted-foreground max-w-sm">{b.specification}</p>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                              {b.category}
                            </span>
                          </td>
                          <td className="font-mono">{b.quantity}</td>
                          <td className="font-mono text-muted-foreground">{b.unit}</td>
                          {activeSheet === 'internal' && <td className="font-mono text-slate-400">₹{b.materialCostRate}</td>}
                          {activeSheet === 'internal' && <td className="font-mono text-slate-400">₹{b.laborCostRate}</td>}
                          {activeSheet === 'internal' && <td className="font-mono font-bold text-amber-400">₹{b.totalCostAmount.toLocaleString('en-IN')}</td>}
                          <td className="font-mono font-semibold">₹{b.sellingRate.toLocaleString('en-IN')}</td>
                          <td className="font-mono font-bold text-emerald-400 text-right">₹{b.totalSellingAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* ── FINANCIAL SUMMARY CARD ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Milestones (Customer View) or Cost Breakdown (Internal) */}
            {activeSheet === 'customer' ? (
              <div className="crm-card space-y-3">
                <h5 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Payment Milestones &amp; Handover Schedule
                </h5>
                <div className="space-y-2 text-xs">
                  {quotation.paymentMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-200">{m.stage}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.percentage}% of project cost</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">₹{m.amountINR.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="crm-card space-y-2 text-xs">
                <h5 className="font-bold text-xs text-rose-400 uppercase tracking-wider">
                  Confidential Direct Cost Summary
                </h5>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Direct Material Cost:</span>
                  <span className="font-mono font-bold">₹{quotation.totalMaterialCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Direct Contractor Labor:</span>
                  <span className="font-mono font-bold">₹{quotation.totalLaborCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Hardware &amp; Fittings:</span>
                  <span className="font-mono font-bold">₹{quotation.totalHardwareCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Material Wastage Allowance:</span>
                  <span className="font-mono font-bold">₹{quotation.wastageAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Transport &amp; Site Crane Freight:</span>
                  <span className="font-mono font-bold">₹{quotation.transportAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-rose-300 font-bold bg-rose-500/10 px-2 rounded-lg mt-2">
                  <span>Total Internal Net Cost:</span>
                  <span className="font-mono">₹{quotation.internalNetCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Total Payable Summary Box */}
            <div className="crm-card bg-slate-950/80 border-indigo-500/30 flex flex-col justify-between p-5 space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Scope Amount:</span>
                  <span className="font-mono font-bold">₹{quotation.subtotalSelling.toLocaleString('en-IN')}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Special Volume Discount:</span>
                    <span className="font-mono">- ₹{quotation.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>GST ({quotation.gstPercentage}% Composite):</span>
                  <span className="font-mono font-bold">₹{quotation.gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {activeSheet === 'internal' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Gross Profit (₹):</span>
                      <span className="font-mono">+ ₹{quotation.profitAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-indigo-400 font-bold">
                      <span>Profit Margin (%):</span>
                      <span className="font-mono">{quotation.profitMarginPercent}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
                    Total Estimated Investment
                  </span>
                  <p className="text-[9px] text-muted-foreground">Inclusive of GST, freight, fittings &amp; 10-Yr warranty</p>
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  ₹{quotation.grandTotalINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Warranty Note */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
            <span className="font-bold text-slate-300 block mb-1">Terms &amp; Scope Notes:</span>
            {quotation.termsAndConditions.map((term, i) => (
              <p key={i}>• {term}</p>
            ))}
          </div>
        </div>

        {/* ── Modal Bottom Actions Bar ──────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateRevision}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw size={13} className="text-indigo-400" /> Create Revision (Rev {quotation.revision + 1})
            </button>
            <button
              type="button"
              onClick={() => {
                if (onStatusChange) onStatusChange('APPROVED');
                InteriorProjectsStore.updateQuotationStatus(quotation.id, 'APPROVED');
                alert(`Quotation #${quotation.quoteNumber} marked as APPROVED!`);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <CheckCircle size={13} /> Mark Approved
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


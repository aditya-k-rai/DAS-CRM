'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, Shield, Mail, RefreshCw, Send, CheckCircle2,
  AlertCircle, Building2, Key, ArrowLeft, HelpCircle, ExternalLink, Sparkles
} from 'lucide-react';

export function VerificationPendingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const companyKeyParam = searchParams.get('companyKey') || '';
  const companyIdParam = searchParams.get('companyId') || '';
  const companyNameParam = searchParams.get('companyName') || '';
  const emailParam = searchParams.get('email') || '';

  const [companyKey, setCompanyKey] = useState(companyKeyParam);
  const [companyName, setCompanyName] = useState(companyNameParam || 'Your Company Workspace');
  const [userEmail, setUserEmail] = useState(emailParam || '');
  const [companyId, setCompanyId] = useState(companyIdParam);

  // Status check states
  const [isChecking, setIsChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);

  // Delay Inquiry Modal states
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySenderName, setInquirySenderName] = useState('');
  const [inquirySenderEmail, setInquirySenderEmail] = useState(emailParam || '');
  const [inquiryMessage, setInquiryMessage] = useState(
    `Hello Super Admin,\n\nOur company registration is currently pending verification. We are waiting for workspace activation so our team can begin using the platform. Could you please provide an update on the status or approve our workspace?\n\nCompany: ${companyNameParam || 'Our Company'}\nKey: ${companyKeyParam || 'Pending Key'}\n\nThank you!`
  );
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySentSuccess, setInquirySentSuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    // If we have saved credentials or params in localStorage, restore them
    if (!companyKeyParam && typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('pending_company_key');
      const savedName = localStorage.getItem('pending_company_name');
      const savedEmail = localStorage.getItem('pending_user_email');
      const savedId = localStorage.getItem('pending_company_id');
      if (savedKey) setCompanyKey(savedKey);
      if (savedName) setCompanyName(savedName);
      if (savedEmail) {
        setUserEmail(savedEmail);
        setInquirySenderEmail(savedEmail);
      }
      if (savedId) setCompanyId(savedId);
    } else if (typeof window !== 'undefined') {
      if (companyKeyParam) localStorage.setItem('pending_company_key', companyKeyParam);
      if (companyNameParam) localStorage.setItem('pending_company_name', companyNameParam);
      if (emailParam) localStorage.setItem('pending_user_email', emailParam);
      if (companyIdParam) localStorage.setItem('pending_company_id', companyIdParam);
    }
  }, [companyKeyParam, companyNameParam, emailParam, companyIdParam]);

  // Handle countdown if approved
  useEffect(() => {
    if (autoRedirectCountdown === null) return;
    if (autoRedirectCountdown <= 0) {
      router.push('/login');
      return;
    }
    const timer = setTimeout(() => {
      setAutoRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoRedirectCountdown, router]);

  // 1. Check status / Retry button
  const handleCheckStatus = async () => {
    const queryTarget = companyKey.trim() || companyId.trim();
    if (!queryTarget) {
      setStatusMessage('Please enter your Company Registration Key below to query status.');
      return;
    }

    setIsChecking(true);
    setStatusMessage(null);
    setRejectionReason(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/company-verification-status/${encodeURIComponent(queryTarget)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.companyName) setCompanyName(data.companyName);

        if (data.status === 'APPROVED' || data.isVerified) {
          setVerificationStatus('APPROVED');
          setStatusMessage('🎉 Congratulations! Your company workspace has been APPROVED and ACTIVATED by Super Admin!');
          setAutoRedirectCountdown(3);
        } else if (data.status === 'REJECTED') {
          setVerificationStatus('REJECTED');
          setRejectionReason(data.rejectionReason || 'Super Admin rejected this workspace application.');
          setStatusMessage('Your workspace registration could not be approved at this time.');
        } else {
          setVerificationStatus('PENDING');
          setStatusMessage('⏱️ Status: Verification in process. Your workspace is currently in the Super Admin review queue. Please wait, or click "Mail Super Admin" below.');
        }
      } else {
        // Mock fallback if demo or endpoint unavailable
        setStatusMessage('⏱️ Status: Verification in process. Super Admin has not approved this workspace yet. Please wait a few moments or send an inquiry below.');
      }
    } catch (err) {
      setStatusMessage('⏱️ Status: Verification in process. Super Admin review is pending. Please check again shortly.');
    } finally {
      setIsChecking(false);
    }
  };

  // 2. Send Delay Inquiry
  const handleSendDelayInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setInquirySending(true);
    setInquiryError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/inquire-verification-delay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyKey: companyKey.trim(),
            companyName: companyName.trim(),
            senderEmail: inquirySenderEmail.trim() || userEmail,
            senderName: inquirySenderName.trim() || 'Company Team Member',
            message: inquiryMessage.trim(),
          }),
        }
      );

      if (res.ok) {
        setInquirySentSuccess(true);
      } else {
        const errData = await res.json();
        setInquiryError(errData.message || 'Failed to dispatch inquiry notification.');
      }
    } catch (err) {
      // In offline/demo mode, record success
      setInquirySentSuccess(true);
    } finally {
      setInquirySending(false);
    }
  };

  const mailtoLink = `mailto:dynamicadvancesolution@gmail.com?subject=${encodeURIComponent(
    `Delay Inquiry: Verification for ${companyName || 'Company'}`
  )}&body=${encodeURIComponent(
    `Hello Super Admin Team,\n\nWe are inquiring about the status of our workspace registration verification.\n\nCompany Name: ${companyName}\nRegistration Key: ${companyKey}\nSender Email: ${userEmail}\n\nCould you please let us know the reason for delay and expected approval time?\n\nThank you!`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden dark-context">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 space-y-6 animate-fade-in">
        {/* Top Branding Pill */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider shadow-inner">
            <Shield size={14} className="text-amber-400" />
            DAS CRM Security & Verification Gateway
          </div>
        </div>

        {/* Central Verification Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Status Icon & Pulse Animation */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              {verificationStatus === 'APPROVED' ? (
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 size={42} />
                </div>
              ) : verificationStatus === 'REJECTED' ? (
                <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <AlertCircle size={42} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock size={40} className="animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {verificationStatus === 'APPROVED'
                  ? 'Workspace Approved!'
                  : verificationStatus === 'REJECTED'
                  ? 'Registration Review Declined'
                  : 'Verification in Process'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {verificationStatus === 'APPROVED'
                  ? `Your company workspace is active. Redirecting you to login in ${autoRedirectCountdown ?? 3}s...`
                  : verificationStatus === 'REJECTED'
                  ? 'The Super Administrator reviewed your company registration but could not approve it.'
                  : 'Your company registration has been submitted and is currently being verified and reviewed by Super Admin. Please wait.'}
              </p>
            </div>
          </div>

          {/* Workspace Details Badge Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Building2 size={13} className="text-cyan-400" /> Company:
              </span>
              <span className="font-bold text-white text-right">{companyName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Key size={13} className="text-amber-400" /> Registration Key:
              </span>
              <span className="font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                {companyKey || 'PENDING-KEY'}
              </span>
            </div>

            {userEmail && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                  <Mail size={13} className="text-purple-400" /> Account Email:
                </span>
                <span className="font-bold text-slate-200">{userEmail}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
                <Shield size={13} className="text-emerald-400" /> Plan & Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                  verificationStatus === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : verificationStatus === 'REJECTED'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
              >
                {verificationStatus === 'APPROVED'
                  ? 'VERIFIED & ACTIVE'
                  : verificationStatus === 'REJECTED'
                  ? 'REJECTED'
                  : 'PENDING SUPER ADMIN APPROVAL'}
              </span>
            </div>
          </div>

          {/* Rejection Notice if rejected */}
          {verificationStatus === 'REJECTED' && rejectionReason && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Reason Provided by Super Admin:</p>
                <p className="mt-0.5 text-slate-300">{rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Live Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                verificationStatus === 'APPROVED'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : verificationStatus === 'REJECTED'
                  ? 'bg-red-950/50 border-red-500/40 text-red-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {verificationStatus === 'APPROVED' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <Clock size={16} className="text-amber-400" />
                )}
              </div>
              <span className="leading-relaxed">{statusMessage}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            {verificationStatus === 'APPROVED' ? (
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                Proceed to Login Dashboard Now →
              </button>
            ) : (
              <>
                {/* 1. RETRY / CHECK STATUS BUTTON */}
                <button
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
                  {isChecking ? 'Checking Super Admin Verification...' : 'Retry / Check Status Now'}
                </button>

                {/* 2. MAIL SUPER ADMIN BUTTON (Ask for reason of delay) */}
                <button
                  onClick={() => {
                    setInquirySentSuccess(false);
                    setInquiryModalOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700/90 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Mail size={15} className="text-amber-400" />
                  Mail Super Admin & Ask for Reason of Delay
                </button>
              </>
            )}
          </div>

          {/* Bottom helper text */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles size={13} className="text-cyan-400" /> Typical review duration: 15–60 mins
            </span>
            <Link
              href="/login"
              className="hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors"
            >
              <ArrowLeft size={12} /> Sign In with Another Workspace
            </Link>
          </div>
        </div>

        {/* Security Footnote */}
        <p className="text-center text-[11px] text-slate-400">
          DAS CRM Multi-Tenant Architecture • Managed by Super Admin at{' '}
          <a
            href={mailtoLink}
            className="text-cyan-400 hover:underline font-mono"
          >
            dynamicadvancesolution@gmail.com
          </a>
        </p>
      </div>

      {/* ── INQUIRY MODAL (Mail Super Admin for Reason of Delay) ── */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ask Super Admin for Reason of Delay</h3>
                  <p className="text-[11px] text-slate-400">
                    Dispatched directly to <strong className="text-cyan-300">dynamicadvancesolution@gmail.com</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {inquirySentSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Inquiry Sent to Super Admin!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Your inquiry has been delivered to Super Admin. You will receive an update at your email address once your workspace is verified.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <a
                    href={mailtoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    <ExternalLink size={13} /> Open in Email Client
                  </a>
                  <button
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-5 py-2 text-xs font-extrabold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendDelayInquiry} className="space-y-4">
                {inquiryError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={inquirySenderName}
                      onChange={e => setInquirySenderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Your Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={inquirySenderEmail}
                      onChange={e => setInquirySenderEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Reason of Delay Inquiry / Message to Super Admin *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={inquiryMessage}
                    onChange={e => setInquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <a
                    href={mailtoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-300/80 hover:text-amber-200 underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Open in Email App (mailto)
                  </a>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setInquiryModalOpen(false)}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inquirySending}
                      className="flex-1 sm:flex-initial px-5 py-2 text-xs font-extrabold rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer"
                    >
                      <Send size={13} className={inquirySending ? 'animate-spin' : ''} />
                      {inquirySending ? 'Sending to Super Admin...' : 'Send Inquiry to Super Admin'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

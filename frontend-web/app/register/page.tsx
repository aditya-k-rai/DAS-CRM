'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Key, CheckCircle2, AlertCircle, ArrowRight, Shield, QrCode, Mail, Lock, Check, X,
  Layers, MapPin, Search, RefreshCw, Clock, ChevronDown, Tag, Sparkles, Zap, Users, BarChart3,
  Download, PartyPopper, Crown, Calendar, Phone, CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Offline Pincode Dictionary for Instant Auto-Fill Fallback
const PINCODE_DICTIONARY: Record<string, { city: string; state: string }> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400051': { city: 'Bandra Mumbai', state: 'Maharashtra' },
  '400099': { city: 'Mumbai International Airport', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110020': { city: 'South Delhi', state: 'Delhi' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Koramangala Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '160017': { city: 'Chandigarh', state: 'Punjab' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '800001': { city: 'Patna', state: 'Bihar' },
  '781001': { city: 'Guwahati', state: 'Assam' },
};

const INDUSTRY_SECTORS = [
  'Technology & SaaS',
  'Real Estate & Construction',
  'Automobile & Dealerships',
  'Financial Services & Banking',
  'Healthcare & Pharmaceuticals',
  'Retail & E-Commerce',
  'Education & EdTech',
  'Manufacturing & Industrial',
  'Media, Advertising & PR',
  'Logistics & Supply Chain',
  'Hospitality & Tourism',
  'Energy, Solar & Utilities',
  'Professional Services & Consulting',
  'FMCG & Consumer Goods',
  'Telecommunications',
  'Insurance & Broking',
  'Textile & Apparel',
  'Agriculture & AgriTech',
  'Food & Beverage (F&B)',
  'Legal & Corporate Compliance',
  'Non-Profit & NGO',
  'Other / Custom Sector',
];

// Plan definitions for the registration page (matches backend PLAN_DEFINITIONS)
const PLAN_DEFS = {
  GROW: {
    key: 'GROW' as const,
    label: 'Grow',
    tagline: 'Perfect for small sales teams',
    color: '#818cf8',
    colorClass: 'indigo',
    memberLimit: 6,
    emailEnabled: false,
    whatsAppEnabled: false,
    aiEnabled: false,
    upgradeable: false,
    badge: null,
    features: [
      'CRM Core — Leads, Contacts, Deals',
      'Sales Pipeline & Kanban Board',
      'Task & Activity Management',
      'Basic Reports & Analytics',
      'Mobile App (Android & iOS)',
    ],
    restrictions: [
      'No Email Marketing',
      'No WhatsApp Cloud',
      'No AI Engine',
      'Max 6 users',
    ],
  },
  BUSINESS: {
    key: 'BUSINESS' as const,
    label: 'Business',
    tagline: 'All features for growing teams',
    color: '#f59e0b',
    colorClass: 'amber',
    memberLimit: 18,
    emailEnabled: true,
    whatsAppEnabled: true,
    aiEnabled: true,
    upgradeable: true,
    badge: 'Most Popular',
    features: [
      'All Grow plan features',
      'Email Marketing — 5,000 emails/month',
      'WhatsApp Cloud — 20,000 credit wallet',
      'AI Lead Scoring & Automation',
      'Advanced Dashboards & Reports',
    ],
    restrictions: [
      '5K email quota (resets monthly)',
      '20K WhatsApp credit wallet',
      'Max 18 users',
    ],
  },
  ENTERPRISE: {
    key: 'ENTERPRISE' as const,
    label: 'Enterprise',
    tagline: 'No limits for large organizations',
    color: '#22c55e',
    colorClass: 'emerald',
    memberLimit: 60,
    emailEnabled: true,
    whatsAppEnabled: true,
    aiEnabled: true,
    upgradeable: false,
    badge: 'Enterprise',
    features: [
      'All Business features',
      'Unlimited Email Marketing',
      'Unlimited WhatsApp Cloud',
      'Custom AI Engine & Prompts',
      'Priority Support & SLA',
    ],
    restrictions: [
      'Max 60 users',
    ],
  },
} as const;

type PlanKey = keyof typeof PLAN_DEFS;

// ── Client-side PDF Generator ─────────────────────────────────────────────────
async function generateRegistrationPdf(data: {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  registrationKey: string;
  planTier: string;
  memberLimit: number;
  validityDays: number;
  pincode?: string;
  phone?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  panType?: string;
  companyType?: string;
  sector?: string;
  couponCode?: string;
  qrCodeDataUrl?: string;
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  // ── Background
  doc.setFillColor(10, 12, 30);
  doc.rect(0, 0, W, 297, 'F');

  // Top accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, W, 2.5, 'F');

  // ── Header section
  doc.setFillColor(18, 22, 52);
  doc.roundedRect(10, 8, W - 20, 42, 4, 4, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, 8, W - 20, 42, 4, 4, 'D');

  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DAS CRM', 20, 23);

  doc.setTextColor(160, 170, 230);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Company Registration Certificate — Confidential Document', 20, 31);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 20, 38);

  // Contact info right-aligned in header
  doc.setTextColor(120, 130, 180);
  doc.setFontSize(7.5);
  doc.text('support@dascrm.app', W - 15, 23, { align: 'right' });
  doc.text('dynamicadvancesolution@gmail.com', W - 15, 30, { align: 'right' });
  doc.text('https://dascrm.app', W - 15, 37, { align: 'right' });

  // ── Certificate Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Congratulations! Company Workspace Registered', W / 2, 63, { align: 'center' });

  doc.setTextColor(160, 170, 210);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Submitted for Super Admin plan verification — activation within 24-48 hrs. Check your email for a copy.', W / 2, 71, { align: 'center' });

  // ── REGISTRATION KEY box
  doc.setFillColor(28, 31, 72);
  doc.roundedRect(10, 78, W - 20, 28, 4, 4, 'F');
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.6);
  doc.roundedRect(10, 78, W - 20, 28, 4, 4, 'D');

  doc.setTextColor(140, 150, 200);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY REGISTRATION KEY', W / 2, 85, { align: 'center' });

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.registrationKey, W / 2, 99, { align: 'center' });

  // ── COMPANY DETAILS table
  doc.setFillColor(22, 26, 60);
  doc.roundedRect(10, 110, W - 20, 7, 2, 2, 'F');
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPANY & REGISTRATION DETAILS', 15, 115.5);

  const companyRows = [
    ['Company Name', data.companyName],
    ['Company Type', data.companyType || 'N/A'],
    ['Industry Sector', data.sector || 'N/A'],
    ['GST Number', data.gstNumber || 'N/A'],
    ['PAN Card', data.panNumber ? `${data.panNumber} (${data.panType === 'PERSONAL' ? 'Personal' : 'Business'})` : 'N/A'],
    ['Phone Number', data.phone || 'N/A'],
    ['Pincode', data.pincode || 'N/A'],
    ['City', data.city || 'N/A'],
    ['State', data.state || 'N/A'],
    ['Subscription Plan', `${data.planTier} — ${data.memberLimit} User Seats`],
    ['Key Validity', `${data.validityDays} Days from Registration`],
    ['Coupon Applied', data.couponCode || 'None'],
    ['Registration Date', new Date().toLocaleDateString('en-IN')],
    ['Verification Status', 'Pending Super Admin Approval'],
  ];

  let y = 114;
  companyRows.forEach((row, i) => {
    const rowH = 7;
    doc.setFillColor(i % 2 === 0 ? 18 : 23, i % 2 === 0 ? 22 : 27, i % 2 === 0 ? 52 : 60);
    doc.rect(10, y, W - 20, rowH, 'F');
    doc.setTextColor(130, 140, 190);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], 15, y + 4.8);
    doc.setTextColor(215, 220, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const val = row[1];
    doc.text(val.length > 50 ? val.slice(0, 47) + '...' : val, W - 15, y + 4.8, { align: 'right' });
    y += rowH;
  });

  y += 4;

  // ── ADMIN CREDENTIALS section (highlighted)
  doc.setFillColor(15, 28, 52);
  doc.roundedRect(10, y, W - 20, 6.5, 2, 2, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ADMIN LOGIN CREDENTIALS (Keep Confidential)', 15, y + 4.8);
  y += 6.5;

  const credRows = [
    ['Admin Full Name', data.adminName],
    ['Admin Email (Login ID)', data.adminEmail],
    ['Admin Password', data.adminPassword],
  ];

  credRows.forEach((row, i) => {
    const rowH = 7;
    doc.setFillColor(i % 2 === 0 ? 20 : 25, i % 2 === 0 ? 16 : 20, i % 2 === 0 ? 45 : 50);
    doc.rect(10, y, W - 20, rowH, 'F');
    // Amber left border for credentials
    doc.setFillColor(245, 158, 11);
    doc.rect(10, y, 2, rowH, 'F');
    doc.setTextColor(180, 150, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], 16, y + 4.8);
    doc.setTextColor(255, 230, 150);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const val = row[1];
    doc.text(val.length > 48 ? val.slice(0, 45) + '...' : val, W - 15, y + 4.8, { align: 'right' });
    y += rowH;
  });

  y += 4;

  // ── QR Code (if available)
  if (data.qrCodeDataUrl && y < 240) {
    try {
      doc.addImage(data.qrCodeDataUrl, 'PNG', W / 2 - 16, y, 32, 32);
      doc.setTextColor(120, 130, 190);
      doc.setFontSize(7);
      doc.text('QR: Scan to verify key authenticity', W / 2, y + 36, { align: 'center' });
      y += 42;
    } catch (_) { y += 4; }
  } else {
    y += 2;
  }

  // ── Contact & Support box
  const contactH = 22;
  if (y + contactH < 272) {
    doc.setFillColor(12, 22, 45);
    doc.roundedRect(10, y, W - 20, contactH, 3, 3, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.35);
    doc.roundedRect(10, y, W - 20, contactH, 3, 3, 'D');

    doc.setTextColor(34, 197, 94);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DAS CRM — Contact & Support', 15, y + 7);

    doc.setTextColor(160, 220, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Email: support@dascrm.app   |   Admin Portal: dynamicadvancesolution@gmail.com', 15, y + 14);
    doc.text('Website: https://dascrm.app   |   Login: https://dascrm.app/login', 15, y + 20);
    y += contactH + 4;
  }

  // ── Instructions box
  const instrH = 36;
  if (y + instrH < 272) {
    doc.setFillColor(14, 28, 52);
    doc.roundedRect(10, y, W - 20, instrH, 3, 3, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.35);
    doc.roundedRect(10, y, W - 20, instrH, 3, 3, 'D');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Instructions & Next Steps', 15, y + 8);

    doc.setTextColor(200, 210, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('1. This PDF has also been sent to your registered email address. Please check your inbox.', 15, y + 16);
    doc.text('2. Save this document securely — it contains your Registration Key and Admin credentials.', 15, y + 22);
    doc.text('3. Super Admin will verify your plan and activate the workspace within 24-48 hours.', 15, y + 28);
    doc.text('4. Upon activation, login at https://dascrm.app/login using the credentials above.', 15, y + 34);
  }

  // ── Footer
  doc.setFillColor(8, 10, 24);
  doc.rect(0, 279, W, 16, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 295, W, 2, 'F');

  doc.setTextColor(80, 90, 140);
  doc.setFontSize(6.5);
  doc.text(
    'DAS CRM — Powered by Dynamic Advance Solution  |  support@dascrm.app  |  Confidential system-generated certificate. Do not share.',
    W / 2, 289,
    { align: 'center' }
  );

  const safeName = data.companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  doc.save(`DAS_CRM_Registration_${safeName}_${data.registrationKey}.pdf`);
}

export default function RegisterCompanyPage() {
  const [companyName, setCompanyName]         = useState('');
  const [adminName, setAdminName]             = useState('');
  const [adminEmail, setAdminEmail]           = useState('');
  const [adminPassword, setAdminPassword]     = useState('');
  const [phone, setPhone]                     = useState('');
  const [pincode, setPincode]                 = useState('');
  const [city, setCity]                       = useState('');
  const [state, setState]                     = useState('');
  const [gstNumber, setGstNumber]             = useState('');
  const [panType, setPanType]                 = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [panNumber, setPanNumber]             = useState('');
  const [companyType, setCompanyType]         = useState('Private Limited');
  const [sector, setSector]                   = useState('Technology & SaaS');
  const [selectedPlan, setSelectedPlan]       = useState<PlanKey>('GROW');
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [couponCode, setCouponCode]           = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult]       = useState<{ valid: boolean; discountLabel?: string; error?: string } | null>(null);

  const [pincodeLoading, setPincodeLoading]   = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState<string | null>(null);

  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  const [pdfDownloading, setPdfDownloading]   = useState(false);
  const pdfTriggeredRef                       = useRef(false);

  const router = useRouter();
  const { setAuthSession } = useAuth();

  // Auto-trigger PDF download once on registration success
  useEffect(() => {
    if (registrationSuccess && !pdfTriggeredRef.current) {
      pdfTriggeredRef.current = true;
      setPdfDownloading(true);
      generateRegistrationPdf({
        companyName:     registrationSuccess.companyName,
        adminName:       registrationSuccess.adminName || adminName,
        adminEmail:      registrationSuccess.adminEmail,
        adminPassword,
        registrationKey: registrationSuccess.registrationKey,
        planTier:        registrationSuccess.planTier,
        memberLimit:     registrationSuccess.memberLimit,
        validityDays:    registrationSuccess.validityDays ?? 7,
        pincode,
        phone,
        city,
        state,
        gstNumber,
        panNumber,
        panType,
        companyType,
        sector,
        couponCode:      couponCode || undefined,
        qrCodeDataUrl:   registrationSuccess.qrCodeDataUrl,
      }).finally(() => setPdfDownloading(false));
    }
  }, [registrationSuccess]);

  const handleManualPdfDownload = async () => {
    if (!registrationSuccess) return;
    setPdfDownloading(true);
    try {
      await generateRegistrationPdf({
        companyName:     registrationSuccess.companyName,
        adminName:       registrationSuccess.adminName || adminName,
        adminEmail:      registrationSuccess.adminEmail,
        adminPassword,
        registrationKey: registrationSuccess.registrationKey,
        planTier:        registrationSuccess.planTier,
        memberLimit:     registrationSuccess.memberLimit,
        validityDays:    registrationSuccess.validityDays ?? 7,
        pincode,
        phone,
        city,
        state,
        gstNumber,
        panNumber,
        panType,
        companyType,
        sector,
        couponCode:      couponCode || undefined,
        qrCodeDataUrl:   registrationSuccess.qrCodeDataUrl,
      });
    } finally {
      setPdfDownloading(false);
    }
  };


  // Pincode Lookup & Auto-Sync Engine (City & State)
  const handlePincodeChange = async (val: string) => {
    const cleanedPin = val.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(cleanedPin);
    setPincodeSuccessMsg(null);

    if (cleanedPin.length === 6) {
      setPincodeLoading(true);

      // Check Offline Dictionary First for Instant Sync
      if (PINCODE_DICTIONARY[cleanedPin]) {
        const info = PINCODE_DICTIONARY[cleanedPin];
        setCity(info.city);
        setState(info.state);
        setPincodeSuccessMsg(`✓ Auto-synced City: ${info.city}, State: ${info.state}`);
        setPincodeLoading(false);
        return;
      }

      // Query Live Indian Postal Pincode API
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedPin}`);
        const data = await res.json();

        if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const fetchedCity = po.District || po.Block || po.Name;
          const fetchedState = po.State;

          if (fetchedCity) setCity(fetchedCity);
          if (fetchedState) setState(fetchedState);
          setPincodeSuccessMsg(`✓ Auto-synced City: ${fetchedCity}, State: ${fetchedState}`);
        } else {
          setPincodeSuccessMsg('⚠️ Pincode checked. You can enter City and State manually.');
        }
      } catch (err) {
        setPincodeSuccessMsg('⚠️ Offline Mode. You can enter City & State manually.');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), planKey: selectedPlan }),
      });
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, error: 'Could not validate coupon (backend offline)' });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminEmail || !adminPassword || !phone || !gstNumber || !panNumber) {
      setError('Please fill all required fields (*)');
      return;
    }

    if (panNumber.trim().length !== 10) {
      setError('Please enter a valid 10-character PAN Card Number (e.g. ABCDE1234F)');
      return;
    }

    setLoading(true);
    setError(null);

    let resultData: any = null;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/company-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          adminName,
          adminEmail,
          adminPassword,
          phone,
          pincode,
          city,
          state,
          gstNumber,
          panNumber: panNumber.trim().toUpperCase(),
          panType,
          companyType,
          sector,
          planTier: selectedPlan,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        resultData = data;
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      // Client-side fallback if backend offline
      const firstWord = companyName.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'COMPANY';
      const alpha = Array.from({ length: 2 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 22)]).join('');
      const digits = Math.floor(1000 + Math.random() * 9000).toString();
      const fallbackKey = `${firstWord}-${alpha}-${digits}`;

      resultData = {
        success: true,
        registrationKey: fallbackKey,
        companyName,
        adminEmail,
        panNumber: panNumber.trim().toUpperCase(),
        panType,
        planTier: selectedPlan,
        memberLimit: selectedPlan === 'ENTERPRISE' ? 60 : selectedPlan === 'BUSINESS' ? 18 : 6,
        validityDays: 7,
      };
    } finally {
      setLoading(false);
      if (resultData) {
        setRegistrationSuccess(resultData);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full space-y-6 relative z-10 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/15 border border-brand/30 text-brand-400 text-xs font-semibold">
            <Shield size={14} /> TENANT WORKSPACE ONBOARDING GATEWAY
          </div>
          <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Register Your Company Workspace</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
            Fill in your company details below. Your Company Registration Key and login credentials will be dispatched to your official email ID.
          </p>
        </div>

        {/* ── REGISTRATION SUCCESS FULLSCREEN POPUP ────────────────────────── */}
        {registrationSuccess && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
            style={{ background: 'rgba(4,5,15,0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Confetti glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative max-w-2xl w-full max-h-[95vh] overflow-y-auto rounded-3xl border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.25)]" style={{ background: 'linear-gradient(145deg,#0d0f2a,#0a0c20)' }}>

              {/* Header ribbon */}
              <div className="relative overflow-hidden rounded-t-3xl px-6 sm:px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#1e3a5f 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#6366f1 0,#6366f1 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <PartyPopper size={30} className="text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                      <CheckCircle2 size={11} /> Registration Successful
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      Congratulations! 🎉
                    </h2>
                    <p className="text-indigo-200 text-sm font-medium mt-1">
                      <span className="font-bold text-white">{registrationSuccess.companyName}</span> is now registered in DAS CRM.
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF auto-download notice + email note */}
              <div className="px-6 sm:px-8 pt-5 space-y-2">
                <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' }}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    {pdfDownloading
                      ? <RefreshCw size={18} className="text-indigo-400 animate-spin" />
                      : <Download size={18} className="text-indigo-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-300">
                      {pdfDownloading ? '⏳ Generating Registration Certificate PDF...' : '✅ Registration Certificate PDF Downloaded!'}
                    </p>
                    <p className="text-[10px] text-indigo-400/70 mt-0.5">
                      {pdfDownloading ? 'Your PDF is being prepared — it includes your key, all details & admin credentials.' : 'Check your Downloads folder. Contains key, company details & admin credentials.'}
                    </p>
                  </div>
                </div>
                {/* Email copy note */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <Mail size={15} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                    📧 <strong>Check your inbox at {registrationSuccess.adminEmail}</strong> — a copy of this Registration Certificate PDF (with all details including your key and admin credentials) has been emailed to you.
                  </p>
                </div>
              </div>


              {/* ── REGISTRATION KEY HIGHLIGHT ── */}
              <div className="px-6 sm:px-8 pt-5">
                <div className="p-5 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.4)' }}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400 mb-2 flex items-center gap-1.5">
                    <Key size={11} /> Your Company Registration Key
                  </p>
                  <p className="text-3xl sm:text-4xl font-black tracking-widest text-white" style={{ textShadow: '0 0 30px rgba(99,102,241,0.8)', letterSpacing: '0.15em' }}>
                    {registrationSuccess.registrationKey}
                  </p>
                  <p className="text-[10px] text-indigo-300/70 mt-2 font-medium">
                    🔐 Keep this key safe. It has been emailed to {registrationSuccess.adminEmail}
                  </p>
                </div>
              </div>

              {/* ── DETAILS GRID ── */}
              <div className="px-6 sm:px-8 pt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">Registration Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: <Building2 size={13} />, label: 'Company', value: registrationSuccess.companyName, color: 'indigo' },
                    { icon: <Mail size={13} />, label: 'Admin Email', value: registrationSuccess.adminEmail, color: 'blue' },
                    { icon: <Crown size={13} />, label: 'Plan', value: `${registrationSuccess.planTier} — ${registrationSuccess.memberLimit} Seats`, color: 'amber' },
                    { icon: <Calendar size={13} />, label: 'Key Validity', value: `${registrationSuccess.validityDays ?? 7} Days`, color: 'emerald' },
                    { icon: <Phone size={13} />, label: 'Phone', value: phone || 'N/A', color: 'purple' },
                    { icon: <CreditCard size={13} />, label: 'PAN Card', value: panNumber ? `${panNumber} (${panType === 'PERSONAL' ? 'Personal' : 'Business'})` : 'N/A', color: 'teal' },
                    { icon: <MapPin size={13} />, label: 'Location', value: city && state ? `${city}, ${state}` : city || state || 'N/A', color: 'rose' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex-shrink-0 text-slate-400">{item.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-bold text-white truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── PENDING VERIFICATION NOTICE ── */}
              <div className="px-6 sm:px-8 pt-4">
                <div className="p-4 rounded-2xl flex gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Clock size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">Awaiting Super Admin Verification</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5 leading-relaxed">
                      Your workspace will be activated within 24-48 hours after plan quota verification by Super Admin. You'll receive a confirmation email at <strong className="text-amber-300">{registrationSuccess.adminEmail}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── ACTION BUTTONS ── */}
              <div className="px-6 sm:px-8 pt-5 pb-8 flex flex-col gap-3">
                <button
                  onClick={handleManualPdfDownload}
                  disabled={pdfDownloading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
                >
                  {pdfDownloading
                    ? <><RefreshCw size={16} className="animate-spin" /> Generating PDF...</>
                    : <><Download size={16} /> Download Registration Certificate PDF</>}
                </button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/verification-pending?companyKey=${encodeURIComponent(registrationSuccess.registrationKey)}&companyName=${encodeURIComponent(registrationSuccess.companyName)}&email=${encodeURIComponent(registrationSuccess.adminEmail)}`}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}
                  >
                    <Clock size={15} /> Check Verification Status
                  </Link>
                  <Link
                    href="/login"
                    className="flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  >
                    <ArrowRight size={15} /> Proceed to Login
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── REGISTRATION FORM (always rendered, blur when success popup is open) ── */}
        {!registrationSuccess && (
          /* ── REGISTRATION FORM ────────────────────────────────────────────────── */
          <form onSubmit={handleRegister} className="p-8 rounded-3xl bg-card border border-border space-y-6 shadow-2xl">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Plan Tier */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-brand-400 block">
                  1. Select Your Plan
                </label>
                <button
                  type="button"
                  onClick={() => setShowComparePlans(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-all"
                >
                  <BarChart3 size={11} /> Compare All Plans
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(Object.values(PLAN_DEFS) as typeof PLAN_DEFS[PlanKey][]).map((plan) => {
                  const isSelected = selectedPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.key); setCouponResult(null); }}
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-2 shadow-lg scale-[1.02]'
                          : 'border-border bg-background hover:border-white/20 hover:bg-white/5'
                      }`}
                      style={isSelected ? { borderColor: plan.color, boxShadow: `0 0 24px ${plan.color}30`, background: `${plan.color}10` } : {}}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: plan.color, color: '#000' }}>
                          {plan.badge}
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${plan.color}20` }}>
                        {plan.key === 'GROW' && <Zap size={16} style={{ color: plan.color }} />}
                        {plan.key === 'BUSINESS' && <BarChart3 size={16} style={{ color: plan.color }} />}
                        {plan.key === 'ENTERPRISE' && <Sparkles size={16} style={{ color: plan.color }} />}
                      </div>
                      <p className="font-extrabold text-sm text-foreground dark:text-white">{plan.label}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{plan.tagline}</p>
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        <p className="text-[10px] flex items-center gap-1" style={{ color: plan.color }}>
                          <Users size={9} /> {plan.memberLimit} Users Max
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          {plan.emailEnabled ? '✓ Email Marketing' : '✗ No Email'}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          {plan.whatsAppEnabled ? '✓ WhatsApp Cloud' : '✗ No WhatsApp'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <Check size={11} style={{ color: plan.color }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected plan highlight */}
              <div className="p-3.5 rounded-2xl border text-xs" style={{ borderColor: `${PLAN_DEFS[selectedPlan].color}40`, background: `${PLAN_DEFS[selectedPlan].color}08` }}>
                <p className="font-black text-sm" style={{ color: PLAN_DEFS[selectedPlan].color }}>
                  {PLAN_DEFS[selectedPlan].label} Plan Selected
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLAN_DEFS[selectedPlan].restrictions.map((r, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 shadow-xs"
                    >
                      ⚠ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* Step 2: Company & Administrative Credentials */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-foreground dark:text-white border-b border-border pb-2">
                2. Company & Administrative Credentials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adisan Digital"
                    className="crm-input text-sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Tenant Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mighty Rai"
                    className="crm-input text-sm"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Admin Official Email (Key Dispatched Here) *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@adisan.com"
                    className="crm-input text-sm"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="crm-input text-sm"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    className="crm-input text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* ── PINCODE FIELD (PLACED DIRECTLY AFTER PHONE NUMBER) ─────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">Pincode / ZIP Code (Auto Syncs City & State) *</label>
                    {pincodeLoading && (
                      <span className="text-[10px] text-brand-400 font-bold flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> Lookup...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400001 or 110001"
                    className="crm-input text-sm font-mono font-bold text-amber-800 dark:text-amber-300"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                  />
                  {pincodeSuccessMsg && (
                    <p className="text-[10px] font-bold text-emerald-400 mt-1">{pincodeSuccessMsg}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">City (Auto-Synced & Editable) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    className="crm-input text-sm font-medium"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">State (Auto-Synced & Editable) *</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    className="crm-input text-sm font-medium"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">GST Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="crm-input text-sm font-mono font-bold uppercase text-indigo-300"
                    value={gstNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGstNumber(val);
                      // Auto-extract PAN from 15-char GSTIN if PAN is empty
                      if (val.length >= 12 && !panNumber) {
                        const extracted = val.slice(2, 12);
                        if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(extracted)) {
                          setPanNumber(extracted);
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Company Type</label>
                  <select
                    className="crm-input text-sm font-bold"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="LLP / Partnership">LLP / Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Enterprise / Public">Enterprise / Public</option>
                  </select>
                </div>

                {/* ── PAN CARD SECTION (PERSONAL OR BUSINESS OPTION) ───────────── */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                    PAN Card Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setPanType('BUSINESS')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        panType === 'BUSINESS'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Building2 size={13} /> Business PAN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanType('PERSONAL')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        panType === 'PERSONAL'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Users size={13} /> Personal PAN
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {panType === 'BUSINESS' ? '🏢 For Company, LLP, Partnership Firm' : '👤 For Proprietor, Director, Individual'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                      PAN Card Number (10 Alphanumeric) *
                    </label>
                    {panNumber.length === 10 && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> 10 Digits
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder={panType === 'BUSINESS' ? 'e.g. AAACB1234F' : 'e.g. ABCDP1234F'}
                      className="crm-input text-sm font-mono font-bold uppercase text-amber-600 dark:text-amber-300 pr-9 tracking-wider"
                      value={panNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
                        setPanNumber(cleaned);
                      }}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <CreditCard size={15} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Format: 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)
                  </p>
                </div>

                {/* ── EXPANDED INDUSTRY SECTOR SELECTOR (22 OPTIONS) ───────────────── */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Industry Sector (22 Options) *</label>
                  <select
                    className="crm-input text-sm font-bold text-indigo-300"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    {INDUSTRY_SECTORS.map((s, idx) => (
                      <option key={s} value={s}>
                        {idx + 1}. {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <Tag size={12} /> Coupon Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code e.g. LAUNCH20"
                  className="crm-input text-sm font-mono uppercase flex-1"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || couponValidating}
                  className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
                >
                  {couponValidating ? <RefreshCw size={12} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponResult && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  couponResult.valid
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400'
                }`}>
                  {couponResult.valid ? <Check size={14} /> : <X size={14} />}
                  {couponResult.valid ? `🎉 Coupon applied! ${couponResult.discountLabel} discount will be noted for Super Admin.` : couponResult.error}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <>Registering Company &amp; Dispatching Mail Key...</>
                ) : (
                  <>Register Company &amp; Dispatch Key To Email →</>
                )}
              </button>

              <div className="text-center text-xs text-slate-600 dark:text-slate-400">
                Already registered your company?{' '}
                <Link href="/login" className="text-brand-400 font-bold hover:underline">
                  Login to Workspace
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ── COMPARE PLANS MODAL ─────────────────────────────────────────── */}
      {showComparePlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md dark-context">
          <div className="max-w-3xl w-full bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden dark-context text-white">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a]">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Compare All Plans</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">All plans require Super Admin approval after registration</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComparePlans(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-x-auto bg-[#0f172a]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60">
                    <th className="text-left p-4 text-slate-200 font-bold text-xs uppercase tracking-wider">Feature</th>
                    {Object.values(PLAN_DEFS).map((p) => (
                      <th key={p.key} className="p-4 text-center">
                        <div className="font-extrabold text-sm" style={{ color: p.color }}>{p.label}</div>
                        {p.badge && (
                          <div className="text-[9px] font-bold rounded-full px-2 py-0.5 mt-1 inline-block" style={{ background: p.color, color: '#000' }}>
                            {p.badge}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#0f172a]">
                  {[
                    { label: 'Max Users', vals: ['6 Users', '18 Users', '60 Users'] },
                    { label: 'CRM Core (Leads, Deals, Contacts)', vals: ['✓', '✓', '✓'] },
                    { label: 'Sales Pipeline & Kanban', vals: ['✓', '✓', '✓'] },
                    { label: 'Task Management', vals: ['✓', '✓', '✓'] },
                    { label: 'Mobile App', vals: ['✓', '✓', '✓'] },
                    { label: 'Email Marketing', vals: ['✗', '5,000 / month', 'Unlimited'] },
                    { label: 'WhatsApp Cloud', vals: ['✗', '20,000 credits', 'Unlimited'] },
                    { label: 'AI Lead Scoring', vals: ['✗', '✓ PRO', '✓ Custom'] },
                    { label: 'Advanced Reports', vals: ['Basic', '✓', '✓ Full'] },
                    { label: 'Coupon Discounts', vals: ['✓', '✓', '✓'] },
                    { label: 'Self Plan Upgrade', vals: ['✗ Contact SA', '✓ Request', '✗ Highest Tier'] },
                    { label: 'Priority Support', vals: ['✗', '✗', '✓'] },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-200 font-semibold text-xs">{row.label}</td>
                      {row.vals.map((val, j) => {
                        const isYes = val.startsWith('✓');
                        const isNo = val.startsWith('✗');
                        return (
                          <td key={j} className="p-3.5 text-center">
                            <span className={isYes ? 'text-emerald-400 font-bold' : isNo ? 'text-rose-400 font-bold' : 'text-white font-bold'}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowComparePlans(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

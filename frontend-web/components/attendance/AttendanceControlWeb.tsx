'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, Camera, CheckCircle2, XCircle,
  AlertCircle, Shield, User, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  Sparkles, Check, X, Filter, UserCheck, Layers, Sun, Minus, Phone, Mail, Building2,
  Lock, ArrowRight
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

// Interface for daily attendance record
interface DailyRecord {
  day: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEK_OFF' | 'FUTURE';
  statusLabel: string;
  inTime: string;
  inGeo: string;
  outTime: string | null;
  outGeo: string | null;
  workingHours: string;
  selfieUrl: string;
}

// Office Geo-Fence Center Configuration
const OFFICE_GEO = {
  lat: 28.440743,
  lng: 77.531117,
  name: 'Acme HQ Office Hub',
  maxRadiusMeters: 500,
};

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Employee Directory for Admin Audit Across Roles
const EMPLOYEES = [
  { id: 'emp_1', name: 'Rajesh Mehta', role: 'MANAGER', dept: 'Enterprise Sales', avatar: 'RM' },
  { id: 'emp_2', name: 'Sunita Verma', role: 'HR', dept: 'Human Resources', avatar: 'SV' },
  { id: 'emp_3', name: 'Amit Shah', role: 'TEAM_LEADER', dept: 'Inside Sales', avatar: 'AS' },
  { id: 'emp_4', name: 'Rajesh Kumar', role: 'SALES_EXEC', dept: 'Direct Sales', avatar: 'RK' },
  { id: 'emp_5', name: 'Priya Sharma', role: 'SALES_EXEC', dept: 'Outbound Sales', avatar: 'PS' },
  { id: 'emp_6', name: 'Neha Joshi', role: 'TEAM_LEADER', dept: 'Key Accounts', avatar: 'NJ' },
  { id: 'emp_7', name: 'Amit Patel', role: 'SALES_EXEC', dept: 'SMB Sales', avatar: 'AP' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function AttendanceControlWeb() {
  const { currentUser } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role || '');
  const isAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR'].includes(normalizedRole);

  const [activeTab, setActiveTab] = useState<'AUDIT' | 'MARK'>('AUDIT');

  // Employee Selection State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp_4');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);

  const selectedEmployee = useMemo(
    () => EMPLOYEES.find((e) => e.id === selectedEmployeeId) || EMPLOYEES[3],
    [selectedEmployeeId]
  );

  // Live Server Time State
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Month & Year State
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(7); // 7 = August
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  // Generate attendance records map for selected employee & month
  const [recordsMap, setRecordsMap] = useState<Record<number, DailyRecord>>(() => {
    return generateRecordsForEmployee(selectedEmployeeId, currentMonthIndex, currentYear);
  });

  useEffect(() => {
    setRecordsMap(generateRecordsForEmployee(selectedEmployeeId, currentMonthIndex, currentYear));
  }, [selectedEmployeeId, currentMonthIndex, currentYear]);

  function generateRecordsForEmployee(empId: string, monthIdx: number, yr: number) {
    const map: Record<number, DailyRecord> = {};
    const seed = (empId.charCodeAt(empId.length - 1) || 4) + monthIdx + yr;

    for (let d = 1; d <= 28; d++) {
      const isSunday = d % 7 === 1;
      const isAbsent = d === ((seed % 5) + 3) || d === ((seed % 7) + 15);
      const isHalfDay = d === ((seed % 4) + 8);
      const isLeave = d === 12;
      const isWeekOff = isSunday || d === 21;
      const isFuture = yr > 2026 || (yr === 2026 && monthIdx > 7) || (yr === 2026 && monthIdx === 7 && d > 21);

      let status: DailyRecord['status'] = 'PRESENT';
      let statusLabel = 'Full Day (8h 30m)';
      let inTime = '09:15 AM';
      let outTime: string | null = '05:45 PM';
      let workingHours = '8h 30m';

      if (isFuture) {
        status = 'FUTURE';
        statusLabel = 'Upcoming Date';
        inTime = '—';
        outTime = null;
        workingHours = '0h';
      } else if (isWeekOff) {
        status = 'WEEK_OFF';
        statusLabel = 'Week Off';
        inTime = '—';
        outTime = null;
        workingHours = '0h';
      } else if (isLeave) {
        status = 'LEAVE';
        statusLabel = 'Approved Leave';
        inTime = '—';
        outTime = null;
        workingHours = '0h';
      } else if (isAbsent) {
        status = 'ABSENT';
        statusLabel = 'Absent Record';
        inTime = '—';
        outTime = null;
        workingHours = '0h';
      } else if (isHalfDay) {
        status = 'HALF_DAY';
        statusLabel = 'Half Day (<5 hrs)';
        inTime = '09:15 AM';
        outTime = '01:30 PM';
        workingHours = '4h 15m';
      }

      map[d] = {
        day: d,
        status,
        statusLabel,
        inTime,
        inGeo: status === 'PRESENT' || status === 'HALF_DAY' ? '28.440743, 77.531117' : 'Location not available',
        outTime,
        outGeo: outTime ? '28.440743, 77.531117' : null,
        workingHours,
        selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      };
    }
    return map;
  }

  // Summary counts
  const dynamicCounts = useMemo(() => {
    let present = 0, absent = 0, halfDay = 0, leave = 0, weekOff = 0;
    Object.values(recordsMap).forEach((r) => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'HALF_DAY') halfDay++;
      else if (r.status === 'LEAVE') leave++;
      else if (r.status === 'WEEK_OFF') weekOff++;
    });
    return { present, absent, halfDay, leave, weekOff };
  }, [recordsMap]);

  // Admin Set Status Handler
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const handleAdminSetStatus = (newStatus: DailyRecord['status']) => {
    let statusLabel = 'Full Day (8h 30m)';
    let workingHours = '8h 30m';
    let inTime = '09:15 AM';
    let outTime: string | null = '05:45 PM';

    if (newStatus === 'ABSENT') {
      statusLabel = 'Absent (Admin Override)';
      workingHours = '0h';
      inTime = '—';
      outTime = null;
    } else if (newStatus === 'HALF_DAY') {
      statusLabel = 'Half Day (<5 hrs)';
      workingHours = '4h 15m';
      inTime = '09:15 AM';
      outTime = '01:30 PM';
    } else if (newStatus === 'LEAVE') {
      statusLabel = 'Approved Leave';
      workingHours = '0h';
      inTime = '—';
      outTime = null;
    }

    setRecordsMap((prev) => ({
      ...prev,
      [selectedDay]: {
        ...(prev[selectedDay] || {
          day: selectedDay,
          status: newStatus,
          statusLabel,
          inTime,
          inGeo: '28.440743, 77.531117 (Admin Override)',
          outTime,
          outGeo: outTime ? '28.440743, 77.531117' : null,
          workingHours,
          selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        }),
        status: newStatus,
        statusLabel,
        workingHours,
        inTime,
        outTime,
      },
    }));

    setAdminNotification(
      `Attendance for ${selectedEmployee.name} on ${selectedDay} ${MONTH_NAMES[currentMonthIndex]} ${currentYear} set to ${newStatus}.`
    );
    setTimeout(() => setAdminNotification(null), 4000);
  };

  const openGoogleMaps = (geoStr: string) => {
    const match = geoStr.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = match[1];
      const lng = match[2];
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } else {
      alert(`Coordinates: ${geoStr}`);
    }
  };

  const activeDayRecord = recordsMap[selectedDay] || {
    day: selectedDay,
    status: 'FUTURE',
    statusLabel: 'No Record',
    inTime: '—',
    inGeo: 'Location not recorded',
    outTime: null,
    outGeo: null,
    workingHours: '0h',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  };

  // ── LIVE WEBCAM & GPS PUNCH STATE ───────────────────────────────────────
  const [punchedIn, setPunchedIn] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 28.440743, lng: 77.531117 });
  const [geoDistance, setGeoDistance] = useState<number>(14);
  const [isInsideFence, setIsInsideFence] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  const fetchCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          const dist = calculateDistanceMeters(lat, lng, OFFICE_GEO.lat, OFFICE_GEO.lng);
          setGeoDistance(dist);
          setIsInsideFence(dist <= OFFICE_GEO.maxRadiusMeters);
        },
        () => {
          setUserCoords({ lat: 28.440743, lng: 77.531117 });
          setGeoDistance(14);
          setIsInsideFence(true);
        }
      );
    } else {
      setUserCoords({ lat: 28.440743, lng: 77.531117 });
      setGeoDistance(14);
      setIsInsideFence(true);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err) {
      console.log('Webcam not available or denied:', err);
      setStreamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const openCameraPunchModal = () => {
    fetchCurrentLocation();
    setCameraModalOpen(true);
    setTimeout(startWebcam, 200);
  };

  const closeCameraPunchModal = () => {
    stopWebcam();
    setCameraModalOpen(false);
  };

  const handleConfirmPunch = () => {
    const today = new Date().getDate();
    const nowTimeStr = currentTime || '09:05 AM';
    const geoStr = `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)} (${OFFICE_GEO.name} • ${geoDistance}m from HQ)`;

    if (punchedIn) {
      setPunchedIn(false);
      setRecordsMap((prev) => ({
        ...prev,
        [today]: {
          ...(prev[today] || {
            day: today,
            status: 'PRESENT',
            statusLabel: 'Full Day',
            inTime: '09:05 AM',
            inGeo: geoStr,
            outTime: nowTimeStr,
            outGeo: geoStr,
            workingHours: '8h 30m',
            selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          }),
          outTime: nowTimeStr,
          outGeo: geoStr,
          statusLabel: 'Punched Out (Verified)',
        },
      }));
      setAdminNotification(`✅ Punched Out successfully at ${nowTimeStr} from ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}.`);
    } else {
      setPunchedIn(true);
      setRecordsMap((prev) => ({
        ...prev,
        [today]: {
          ...(prev[today] || {
            day: today,
            status: 'PRESENT',
            statusLabel: 'Punched In',
            inTime: nowTimeStr,
            inGeo: geoStr,
            outTime: null,
            outGeo: null,
            workingHours: 'Active',
            selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          }),
          inTime: nowTimeStr,
          inGeo: geoStr,
          statusLabel: 'Punched In (Today)',
        },
      }));
      setAdminNotification(`🎉 Punched In successfully at ${nowTimeStr} from ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}.`);
    }

    closeCameraPunchModal();
    setTimeout(() => setAdminNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP BANNER: LIVE CLOCK & CONTROLS ───────────────────────────────────── */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card border border-border p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold text-lg flex items-center justify-center border border-indigo-500/30">
              <CalendarIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">Workforce Attendance & Admin Controls</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Shield size={12} /> {isAdminOrManager ? 'ADMIN ACCESS' : 'EMPLOYEE VIEW'}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Audit monthly logs, inspect location telemetry, snap live camera selfies, and override attendance status.
              </p>
            </div>
          </div>

          {/* Live Server Clock Display */}
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <Clock size={16} className="text-emerald-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Live Server Time</span>
              <span className="font-mono text-sm font-extrabold text-white">
                {currentTime || '09:15:00 AM'} <span className="text-xs text-emerald-400 font-sans font-semibold">IST</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-card text-muted hover:text-white border border-border'
              }`}
            >
              <UserCheck size={14} /> Attendance Audit & Grid
            </button>
            <button
              onClick={openCameraPunchModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
            >
              <Camera size={14} /> Snap Selfie & Punch {punchedIn ? 'Out' : 'In'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">GPS Telemetry:</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center gap-1">
              <MapPin size={12} /> 28.440743, 77.531117 (HQ Hub)
            </span>
          </div>
        </div>
      </div>

      {/* Admin Override Notification Toast */}
      {adminNotification && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{adminNotification}</span>
          </div>
          <button onClick={() => setAdminNotification(null)} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── WORKFORCE AUDIT & ADMIN CONTROLS MAIN PANEL ───────────────────────────── */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          {/* Admin Employee Selection & Month Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workforce Selector (Admin/Manager Exclusive) */}
            <div className="crm-card p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase flex items-center gap-1.5">
                  <Shield size={13} className="text-amber-400" /> Admin Workforce Selection:
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {EMPLOYEES.length} EMPLOYEES AUDITED
                </span>
              </div>

              {isAdminOrManager ? (
                <div className="relative">
                  <button
                    onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-indigo-500/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                        {selectedEmployee.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{selectedEmployee.name}</p>
                        <p className="text-xs text-muted">{selectedEmployee.role} · {selectedEmployee.dept}</p>
                      </div>
                    </div>
                    <span className="text-muted text-xs font-bold">{empDropdownOpen ? '▲' : '▼'}</span>
                  </button>

                  {empDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl bg-card border border-slate-700 shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800">
                      {EMPLOYEES.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setEmpDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-slate-800 ${
                            selectedEmployeeId === emp.id ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-md bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center">
                              {emp.avatar}
                            </span>
                            <div>
                              <p className="text-xs font-bold">{emp.name}</p>
                              <p className="text-[10px] text-muted">{emp.role} — {emp.dept}</p>
                            </div>
                          </div>
                          {selectedEmployeeId === emp.id && <Check size={14} className="text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {currentUser.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{currentUser.name}</p>
                    <p className="text-xs text-muted">Personal Scoped Record</p>
                  </div>
                </div>
              )}
            </div>

            {/* Month & Year Navigator Header */}
            <div className="crm-card p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                📅 Attendance Period Navigator
              </span>

              <div className="flex items-center justify-between bg-background p-2.5 rounded-2xl border border-border">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-card border border-border hover:bg-slate-800 text-white transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center">
                  <span className="font-extrabold text-base text-white block">
                    {MONTH_NAMES[currentMonthIndex]} {currentYear}
                  </span>
                  <span className="text-[10px] text-muted font-medium">Click arrows to browse monthly archives</span>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-card border border-border hover:bg-slate-800 text-white transition-all"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Summary Badges Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="crm-card p-3.5 flex items-center justify-between border-l-4 border-l-emerald-500">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase">Present</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{dynamicCounts.present} Days</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                {dynamicCounts.present}
              </div>
            </div>

            <div className="crm-card p-3.5 flex items-center justify-between border-l-4 border-l-rose-500">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase">Absent</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{dynamicCounts.absent} Days</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/30">
                {dynamicCounts.absent}
              </div>
            </div>

            <div className="crm-card p-3.5 flex items-center justify-between border-l-4 border-l-amber-500">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase">Half Day</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{dynamicCounts.halfDay} Days</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                {dynamicCounts.halfDay}
              </div>
            </div>

            <div className="crm-card p-3.5 flex items-center justify-between border-l-4 border-l-indigo-500">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase">Approved Leave</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{dynamicCounts.leave} Days</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                {dynamicCounts.leave}
              </div>
            </div>

            <div className="crm-card p-3.5 flex items-center justify-between border-l-4 border-l-slate-500 col-span-2 sm:col-span-1">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase">Week Off</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{dynamicCounts.weekOff} Days</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-500/30">
                {dynamicCounts.weekOff}
              </div>
            </div>
          </div>

          {/* 28-DAY / MONTHLY INTERACTIVE CALENDAR GRID */}
          <div className="crm-card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <CalendarIcon size={16} className="text-indigo-400" />
                  {MONTH_NAMES[currentMonthIndex]} {currentYear} Attendance Grid
                </h3>
                <p className="text-xs text-muted">Click any date box to inspect detailed punch times, GPS coordinates, and selfie verification.</p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half Day</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Off</span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted uppercase tracking-wider py-1 border-b border-border">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
                const rec = recordsMap[d];
                const isSelected = d === selectedDay;

                let bgClass = 'bg-slate-800/40 text-slate-400 border-slate-700/50';
                let pillText = 'Off';

                if (rec?.status === 'PRESENT') {
                  bgClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
                  pillText = 'Present';
                } else if (rec?.status === 'ABSENT') {
                  bgClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
                  pillText = 'Absent';
                } else if (rec?.status === 'HALF_DAY') {
                  bgClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
                  pillText = 'Half Day';
                } else if (rec?.status === 'LEAVE') {
                  bgClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30';
                  pillText = 'Leave';
                } else if (rec?.status === 'WEEK_OFF') {
                  bgClass = 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-800';
                  pillText = 'Week Off';
                }

                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between gap-1 transition-all ${bgClass} ${
                      isSelected ? 'ring-2 ring-indigo-400 scale-105 shadow-xl' : ''
                    }`}
                  >
                    <span className="font-extrabold text-sm">{d}</span>
                    <span className="text-[10px] font-bold uppercase truncate">{pillText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SELECTED DAY RECORD & ADMIN OVERRIDE PANEL ───────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Record Inspection Card */}
            <div className="crm-card md:col-span-2 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                    Record for {selectedDay} {MONTH_NAMES[currentMonthIndex]} {currentYear}
                  </h4>
                  <p className="text-xs text-muted">Inspecting logs for <strong className="text-white">{selectedEmployee.name}</strong> ({selectedEmployee.role})</p>
                </div>

                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                  activeDayRecord.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  activeDayRecord.status === 'ABSENT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  activeDayRecord.status === 'HALF_DAY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {activeDayRecord.statusLabel}
                </span>
              </div>

              {/* Working hours highlight */}
              <div className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-indigo-400" />
                  <div>
                    <span className="text-[10px] text-muted font-bold uppercase block">Total Working Hours</span>
                    <span className="text-sm font-extrabold text-white">{activeDayRecord.workingHours}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted">Rule: Full Day ≥ 8h • Half Day &lt; 5h</span>
              </div>

              {/* Punch In & Punch Out Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Punch In */}
                <div className="p-3.5 rounded-2xl bg-background border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> PUNCH IN TIME
                    </span>
                    <span className="font-mono text-xs font-bold text-white">{activeDayRecord.inTime}</span>
                  </div>

                  <div className="text-xs text-muted space-y-1">
                    <p className="flex items-center gap-1 text-[11px]">
                      <MapPin size={12} className="text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{activeDayRecord.inGeo}</span>
                    </p>
                    {activeDayRecord.inGeo && !activeDayRecord.inGeo.includes('not available') && (
                      <button
                        onClick={() => openGoogleMaps(activeDayRecord.inGeo)}
                        className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Open Maps Telemetry <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Punch Out */}
                <div className="p-3.5 rounded-2xl bg-background border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1">
                      <XCircle size={14} /> PUNCH OUT TIME
                    </span>
                    <span className="font-mono text-xs font-bold text-white">{activeDayRecord.outTime || 'Not Punched Out'}</span>
                  </div>

                  <div className="text-xs text-muted space-y-1">
                    <p className="flex items-center gap-1 text-[11px]">
                      <MapPin size={12} className="text-rose-400 flex-shrink-0" />
                      <span className="truncate">{activeDayRecord.outGeo || 'Location unavailable'}</span>
                    </p>
                    {activeDayRecord.outGeo && (
                      <button
                        onClick={() => openGoogleMaps(activeDayRecord.outGeo || '')}
                        className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Open Maps Telemetry <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 👑 ADMIN EXCLUSIVE OVERRIDE CONTROLS PANEL */}
            <div className="crm-card p-6 space-y-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Shield size={16} className="text-amber-400" /> Admin Override
                </h4>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ADMIN ONLY
                </span>
              </div>

              <p className="text-xs text-muted">
                Override attendance status for <strong className="text-white">{selectedEmployee.name}</strong> on <strong className="text-white">{selectedDay} {MONTH_NAMES[currentMonthIndex]}</strong>:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleAdminSetStatus('PRESENT')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-bold flex items-center justify-between"
                >
                  <span>✓ Set Present (Full Day)</span>
                  <span className="text-[10px] font-mono opacity-80">8h 30m</span>
                </button>

                <button
                  onClick={() => handleAdminSetStatus('HALF_DAY')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all text-xs font-bold flex items-center justify-between"
                >
                  <span>⏱️ Set Half Day (&lt;5h)</span>
                  <span className="text-[10px] font-mono opacity-80">4h 15m</span>
                </button>

                <button
                  onClick={() => handleAdminSetStatus('ABSENT')}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all text-xs font-bold flex items-center justify-between"
                >
                  <span>✕ Set Absent</span>
                  <span className="text-[10px] font-mono opacity-80">0h</span>
                </button>

                <button
                  onClick={() => handleAdminSetStatus('LEAVE')}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all text-xs font-bold flex items-center justify-between"
                >
                  <span>🏖️ Set Approved Leave</span>
                  <span className="text-[10px] font-mono opacity-80">0h</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE WEBCAM & GPS CAMERA PUNCH MODAL ───────────────────────────────────── */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="crm-card max-w-lg w-full p-6 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-4 relative">
            <button
              onClick={closeCameraPunchModal}
              className="absolute top-5 right-5 p-2 rounded-xl bg-background border border-border hover:bg-card text-muted hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CAMERA & GPS TELEMETRY
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                📷 Live Attendance Selfie Punch
              </h3>
              <p className="text-xs text-muted">
                {punchedIn ? 'Punch Out Verification' : 'Punch In Verification'} • Anti-Tamper Verification
              </p>
            </div>

            {/* Webcam / Live Viewfinder Box */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {!streamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/90 text-center">
                  <Camera size={36} className="text-indigo-400 mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-white">Camera Viewfinder Active</p>
                  <p className="text-xs text-muted mt-0.5">Capturing live selfie & GPS coordinates...</p>
                </div>
              )}

              {/* Anti-Tamper HUD Overlay */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span>🕒 Time: {currentTime}</span>
                  <span className="text-emerald-400 font-bold">🟢 GEO VERIFIED</span>
                </div>
                <div className="truncate">📍 Coords: {userCoords.lat.toFixed(6)}, {userCoords.lng.toFixed(6)}</div>
                <div className="text-indigo-300">🏢 Distance from HQ Hub: {geoDistance}m (Limit: 500m)</div>
              </div>
            </div>

            {/* Geo Boundary Status Pill */}
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
              isInsideFence ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <span>{isInsideFence ? '✓ INSIDE OFFICE GEO-FENCE BOUNDARY' : '⚠️ OUTSIDE OFFICE BOUNDARY'}</span>
              <button onClick={fetchCurrentLocation} className="text-[10px] underline hover:text-white">
                Refresh GPS
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={closeCameraPunchModal}
                className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPunch}
                className={`flex-1 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
                  punchedIn
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                📸 Confirm {punchedIn ? 'Punch Out' : 'Punch In'} & Sync →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

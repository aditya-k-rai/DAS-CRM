import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

// Runtime dynamic extra staff & role overrides in superadmin-web
const dynamicExtraStaff: any[] = [];
const dynamicRoleOverrides: Record<string, string> = {};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('organizationId') || 'cmuev7n3o000mikew7je1tdiw';

  // Attempt to proxy to frontend-web
  try {
    const res = await fetch(`http://localhost:3000/api/crm-sync?organizationId=${orgId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { headers: CORS_HEADERS });
    }
  } catch (_) {}

  // Fallback synced list
  const baseEmployees = [
    {
      id: 'cmuev7ni70016ikew8an7tdw8',
      name: 'Anurag Sharma',
      email: 'adorabletrading08@gmail.com',
      role: 'ADMIN',
      isActive: true,
      phone: '+91 97173 55779',
      assignedManager: 'Organization Admin',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T07:45:00.000Z',
      lastActiveAt: '2026-09-28T08:10:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-24T01:40:31.806Z',
    },
    {
      id: 'cmuhp0517000ngg2dq93a6nlp',
      name: 'Nandini Rastogi',
      email: 'rastoginandini92@gmail.com',
      role: 'SALES_EXEC',
      isActive: true,
      phone: '+91 98765 43210',
      assignedManager: 'Sachin Puri (Team Leader)',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T07:55:00.000Z',
      lastActiveAt: '2026-09-28T08:05:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-26T01:10:02.107Z',
    },
    {
      id: 'usr_aditya_rai_01',
      name: 'Aditya Kumar Rai',
      email: 'rai992522@gmail.com',
      role: 'MANAGER',
      isActive: true,
      phone: '+91 99252 20000',
      assignedManager: 'Admin',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T06:15:00.000Z',
      lastActiveAt: '2026-09-28T07:30:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-26T01:15:00.000Z',
    },
    {
      id: 'usr_sachin_puri_01',
      name: 'Sachin Puri',
      email: 'sachinpuri938@gmail.com',
      role: 'TEAM_LEADER',
      isActive: true,
      phone: '+91 93102 03982',
      assignedManager: 'Aditya Kumar Rai (Manager)',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T05:20:00.000Z',
      lastActiveAt: '2026-09-28T07:50:00.000Z',
      lastPlatform: 'ANDROID',
      createdAt: '2026-09-27T01:00:00.000Z',
    },
    {
      id: 'cmukwwdv9000ng42dghtw6t3z',
      name: 'Sulekha Tomar',
      email: 'sulekhatmr@gmail.com',
      role: 'SALES_EXEC',
      isActive: true,
      phone: '+91 93661 03735',
      assignedManager: 'Sachin Puri (Team Leader)',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T06:30:00.000Z',
      lastActiveAt: '2026-09-28T07:40:00.000Z',
      lastPlatform: 'ANDROID',
      createdAt: '2026-09-28T07:14:22.389Z',
    },
    {
      id: 'cmukykfoe000nht2d0ylnsd3t',
      name: 'Sadhana',
      email: 'sadhnadikshit98@gmail.com',
      role: dynamicRoleOverrides['sadhnadikshit98@gmail.com'] || dynamicRoleOverrides['cmukykfoe000nht2d0ylnsd3t'] || 'SALES_EXEC',
      isActive: true,
      phone: '+91 87968 24282',
      assignedManager: 'Sachin Puri (Team Leader)',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: null,
      lastActiveAt: null,
      lastPlatform: 'WEB',
      createdAt: '2026-09-28T08:01:04.094Z',
    },
  ];

  // Merge runtime dynamic extra staff and apply dynamic overrides
  const staffMap = new Map<string, any>();
  baseEmployees.forEach(e => {
    const override = dynamicRoleOverrides[e.id] || dynamicRoleOverrides[e.email.toLowerCase().trim()];
    staffMap.set(e.email.toLowerCase().trim(), override ? { ...e, role: override } : e);
  });

  dynamicExtraStaff.forEach(e => {
    if (e?.email) {
      const key = e.email.toLowerCase().trim();
      const existing = staffMap.get(key) || {};
      const override = dynamicRoleOverrides[e.id] || dynamicRoleOverrides[key];
      staffMap.set(key, { ...existing, ...e, role: override || e.role || existing.role || 'SALES_EXEC' });
    }
  });

  const finalEmployees = Array.from(staffMap.values());

  return NextResponse.json(
    {
      organizationId: orgId,
      companyName: 'Adorable Trading',
      companyKey: 'ADOR-EC-7187',
      seatsAllocated: 18,
      seatsUsed: finalEmployees.length,
      employees: finalEmployees,
      totalCount: finalEmployees.length,
    },
    {
      headers: CORS_HEADERS,
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Proxy to frontend-web if active
    fetch('http://localhost:3000/api/crm-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);

    if (body?.email) {
      const email = body.email.toLowerCase().trim();
      const role = body.role || body.assignedRole || 'SALES_EXEC';
      const existingIdx = dynamicExtraStaff.findIndex(e => e.email?.toLowerCase().trim() === email);
      const newStaff = {
        id: body.id || `usr_synced_${Date.now()}`,
        name: body.name || 'Staff Member',
        email,
        role,
        phone: body.phone || '',
        assignedManager: body.assignedManager || 'Admin',
        isActive: body.isActive !== false,
        keyUsed: body.keyUsed || body.companyKey || 'ADOR-EC-7187',
        createdAt: body.createdAt || new Date().toISOString(),
      };

      dynamicRoleOverrides[email] = role;
      if (body.id) dynamicRoleOverrides[body.id] = role;

      if (existingIdx >= 0) {
        dynamicExtraStaff[existingIdx] = { ...dynamicExtraStaff[existingIdx], ...newStaff };
      } else {
        dynamicExtraStaff.push(newStaff);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Sync registered successfully' },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Sync failed' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}


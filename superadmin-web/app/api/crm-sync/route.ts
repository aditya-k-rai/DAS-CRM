import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

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
  const employees = [
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
      id: 'usr_sulekha_tomar_01',
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
      createdAt: '2026-09-28T01:00:00.000Z',
    },
    {
      id: 'usr_rohit_verma_01',
      name: 'Rohit Verma',
      email: 'rohitverma88@gmail.com',
      role: 'UNASSIGNED',
      isActive: true,
      phone: '+91 98112 34567',
      assignedManager: 'Awaiting Role Assignment',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-28T04:15:00.000Z',
      lastActiveAt: '2026-09-28T06:20:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-28T03:30:00.000Z',
    },
    {
      id: 'usr_pooja_sharma_01',
      name: 'Pooja Sharma',
      email: 'poojasharma94@gmail.com',
      role: 'UNASSIGNED',
      isActive: true,
      phone: '+91 99105 67890',
      assignedManager: 'Awaiting Role Assignment',
      keyUsed: 'ADOR-EC-7187',
      lastLoginAt: '2026-09-27T16:40:00.000Z',
      lastActiveAt: '2026-09-27T18:10:00.000Z',
      lastPlatform: 'ANDROID',
      createdAt: '2026-09-27T15:00:00.000Z',
    },
  ];

  return NextResponse.json(
    {
      organizationId: orgId,
      companyName: 'Adorable Trading',
      companyKey: 'ADOR-EC-7187',
      seatsAllocated: 18,
      seatsUsed: 7,
      employees,
      totalCount: 7,
    },
    {
      headers: CORS_HEADERS,
    }
  );
}

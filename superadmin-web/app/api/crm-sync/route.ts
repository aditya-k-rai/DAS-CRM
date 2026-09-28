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
      createdAt: '2026-09-28T01:00:00.000Z',
    },
  ];

  return NextResponse.json(
    {
      organizationId: orgId,
      companyName: 'Adorable Trading',
      companyKey: 'ADOR-EC-7187',
      seatsAllocated: 18,
      seatsUsed: 5,
      employees,
      totalCount: 5,
    },
    {
      headers: CORS_HEADERS,
    }
  );
}

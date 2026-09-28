import { NextResponse } from 'next/server';

// In-memory runtime cache for dynamically registered / synced staff members across sessions
const dynamicExtraStaff: any[] = [];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
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
      id: 'cmukwwdv9000ng42dghtw6t3z',
      name: 'Sulekha Tomar',
      email: 'sulekhatmr@gmail.com',
      role: 'SALES_EXEC',
      isActive: true,
      phone: '+91 93661 03735',
      assignedManager: 'Sachin Puri (Team Leader)',
      keyUsed: 'ADOR-EC-7187',
      createdAt: '2026-09-28T07:14:22.389Z',
    },
    {
      id: 'cmukykfoe000nht2d0ylnsd3t',
      name: 'Sadhana',
      email: 'sadhnadikshit98@gmail.com',
      role: 'UNASSIGNED',
      isActive: true,
      phone: '',
      assignedManager: 'Awaiting Role Assignment',
      keyUsed: 'ADOR-EC-7187',
      createdAt: '2026-09-28T08:01:04.094Z',
    },
  ];

  // Merge runtime dynamic extra staff
  const staffMap = new Map<string, any>();
  baseEmployees.forEach(e => staffMap.set(e.email.toLowerCase().trim(), e));
  dynamicExtraStaff.forEach(e => {
    if (e?.email) staffMap.set(e.email.toLowerCase().trim(), { ...staffMap.get(e.email.toLowerCase().trim()), ...e });
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
    if (body?.email) {
      const email = body.email.toLowerCase().trim();
      const existingIdx = dynamicExtraStaff.findIndex(e => e.email?.toLowerCase().trim() === email);
      const newStaff = {
        id: body.id || `usr_synced_${Date.now()}`,
        name: body.name || 'New Staff Member',
        email,
        role: body.role || 'SALES_EXEC',
        phone: body.phone || '',
        assignedManager: body.assignedManager || 'Admin',
        isActive: body.isActive !== false,
        keyUsed: body.keyUsed || body.companyKey || 'ADOR-EC-7187',
        createdAt: body.createdAt || new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        dynamicExtraStaff[existingIdx] = { ...dynamicExtraStaff[existingIdx], ...newStaff };
      } else {
        dynamicExtraStaff.push(newStaff);
      }
    }

    return NextResponse.json({ success: true, count: dynamicExtraStaff.length }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 400, headers: CORS_HEADERS });
  }
}

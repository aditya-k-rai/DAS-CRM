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
  const orgId = searchParams.get('organizationId');

  if (!orgId) {
    return NextResponse.json(
      {
        organizationId: '',
        companyName: 'Organization Workspace',
        companyKey: '',
        seatsAllocated: 0,
        seatsUsed: 0,
        employees: [],
        totalCount: 0,
      },
      { headers: CORS_HEADERS }
    );
  }

  // Runtime staff for this specific organization
  const staffMap = new Map<string, any>();
  dynamicExtraStaff.forEach(e => {
    if (e?.email && e?.organizationId === orgId) {
      staffMap.set(e.email.toLowerCase().trim(), e);
    }
  });

  const finalEmployees = Array.from(staffMap.values());

  return NextResponse.json(
    {
      organizationId: orgId,
      companyName: 'Organization Workspace',
      companyKey: '',
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

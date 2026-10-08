import { NextResponse } from 'next/server';
import { getLocalGoals, saveLocalGoals, GoalsStoragePayload } from '@/lib/serverGoals';

export async function GET() {
  try {
    const goals = getLocalGoals();
    return NextResponse.json({ success: true, ...goals });
  } catch (error: any) {
    console.error('[API /api/goals] GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch goals configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const current = getLocalGoals();

    const updated: GoalsStoragePayload = {
      globalSettings: body.globalSettings ? { ...current.globalSettings, ...body.globalSettings } : current.globalSettings,
      userOverrides: Array.isArray(body.userOverrides) ? body.userOverrides : current.userOverrides,
      updatedAt: new Date().toISOString(),
    };

    saveLocalGoals(updated);
    return NextResponse.json({ success: true, ...updated });
  } catch (error: any) {
    console.error('[API /api/goals] PUT error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save goals configuration' },
      { status: 500 }
    );
  }
}

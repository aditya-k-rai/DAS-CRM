import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getLocalNotices(): any[] {
  try {
    if (fs.existsSync(NOTICES_FILE)) {
      const content = fs.readFileSync(NOTICES_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // Auto-purge expired notices
        return parsed.filter((n: any) => n.expiresAt > Date.now());
      }
    }
  } catch (_) {}
  return [];
}

function saveLocalNotices(notices: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(NOTICES_FILE, JSON.stringify(notices, null, 2), 'utf8');
  } catch (_) {}
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  const notices = getLocalNotices();
  return NextResponse.json(notices, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const notice = await req.json();
    if (!notice?.id || !notice?.title) {
      return NextResponse.json({ error: 'Invalid notice payload' }, { status: 400, headers: CORS_HEADERS });
    }
    const current = getLocalNotices();
    const updated = [notice, ...current.filter((n: any) => n.id !== notice.id)];
    saveLocalNotices(updated);
    return NextResponse.json(notice, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, acknowledgeEmail } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing notice ID' }, { status: 400, headers: CORS_HEADERS });
    }
    const current = getLocalNotices();
    const updated = current.map((n: any) => {
      if (n.id === id && acknowledgeEmail) {
        const acks = Array.isArray(n.acknowledgedBy) ? n.acknowledgedBy : [];
        if (!acks.includes(acknowledgeEmail)) {
          return { ...n, acknowledgedBy: [...acks, acknowledgeEmail] };
        }
      }
      return n;
    });
    saveLocalNotices(updated);
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing notice ID' }, { status: 400, headers: CORS_HEADERS });
    }
    const current = getLocalNotices();
    const updated = current.filter((n: any) => n.id !== id);
    saveLocalNotices(updated);
    return NextResponse.json({ success: true, id }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

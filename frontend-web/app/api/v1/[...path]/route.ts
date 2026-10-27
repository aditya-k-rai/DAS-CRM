import { NextRequest, NextResponse } from 'next/server';

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ||
  'http://localhost:3001';

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${BACKEND_INTERNAL_URL}/api/v1/${pathStr}${searchParams}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', req.headers.get('host') || '');
  headers.set('x-forwarded-proto', req.nextUrl.protocol.replace(':', ''));

  let body: BodyInit | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');

    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[Next.js API Proxy] Error forwarding request to ${targetUrl}:`, err);
    return NextResponse.json(
      { error: 'Backend Service Unavailable', message: err.message },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;

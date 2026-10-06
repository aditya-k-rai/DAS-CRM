import { NextResponse } from 'next/server';
import { savePdfToFirestore } from '@/lib/serverFirestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customFileName = (formData.get('customFileName') as string) || (file?.name) || `document_${Date.now()}`;
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = formData.get('category') as string || 'QUOTATIONS';

    let pdfDataUrl = '';
    if (file) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mime = file.type || 'application/pdf';
      pdfDataUrl = `data:${mime};base64,${base64}`;

      // Save PDF into Firestore collection 'invoices_pdfs'
      await savePdfToFirestore(customFileName, pdfDataUrl, {
        fileName: customFileName,
        fileId,
        category,
        uploadedBy: formData.get('uploadedBy') as string || '',
        companyName: formData.get('companyName') as string || '',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'File processed and registered successfully in Firestore vault',
      data: {
        fileId,
        fileName: customFileName,
        driveViewUrl: pdfDataUrl || `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/invoices_pdfs/${encodeURIComponent(customFileName)}`,
        driveDownloadUrl: pdfDataUrl || `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/invoices_pdfs/${encodeURIComponent(customFileName)}`,
        gcsDownloadUrl: pdfDataUrl,
      },
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500, headers: CORS_HEADERS });
  }
}

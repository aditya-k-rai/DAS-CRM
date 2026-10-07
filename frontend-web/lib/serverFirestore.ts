import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getServiceAccount(): any {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (_) {}
  }
  const candidatePaths = [
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'frontend-web', 'service-account.json'),
    path.resolve(process.cwd(), 'backend', 'service-account.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        return JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf8'));
      } catch (_) {}
    }
  }
  return null;
}

export async function getFirestoreAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > now + 60) {
    return cachedToken;
  }

  const sa = getServiceAccount();
  if (!sa || !sa.client_email || !sa.private_key) {
    return null;
  }

  try {
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Claim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const signatureInput = `${b64Header}.${b64Claim}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(sa.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedToken = data.access_token;
        tokenExpiresAt = now + (data.expires_in || 3600);
        return cachedToken;
      }
    }
  } catch (err) {
    console.warn('[Firestore] Failed to obtain access token:', err);
  }
  return null;
}

export async function saveImageToFirestore(docId: string, dataUrl: string, fileName: string = 'product_image'): Promise<string> {
  const token = await getFirestoreAccessToken();
  if (!token) return dataUrl;

  try {
    const cleanId = encodeURIComponent(docId.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/product_images/${cleanId}`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: cleanId },
          fileName: { stringValue: fileName },
          dataUrl: { stringValue: dataUrl },
          uploadedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (e) {
    console.warn('[Firestore] Image save to Firestore collection product_images notice:', e);
  }
  return dataUrl;
}

export async function savePdfToFirestore(docNo: string, pdfDataUrl: string, metadata: any = {}): Promise<void> {
  const token = await getFirestoreAccessToken();
  if (!token) return;

  try {
    const cleanId = encodeURIComponent(docNo.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/invoices_pdfs/${cleanId}`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          docNo: { stringValue: docNo },
          pdfData: { stringValue: pdfDataUrl },
          totalAmount: { doubleValue: Number(metadata.totalAmount || 0) },
          partyName: { stringValue: metadata.partyName || '' },
          companyName: { stringValue: metadata.companyName || '' },
          status: { stringValue: metadata.status || 'SENT' },
          savedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (e) {
    console.warn('[Firestore] PDF save to Firestore collection invoices_pdfs notice:', e);
  }
}

export async function upsertProductInFirestore(id: string, product: any): Promise<void> {
  const token = await getFirestoreAccessToken();
  if (!token) return;

  try {
    const cleanId = encodeURIComponent(id.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/products/${cleanId}`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: id },
          name: { stringValue: product.name || '' },
          sku: { stringValue: product.sku || '' },
          category: { stringValue: product.category || '' },
          subCategory: { stringValue: product.subCategory || '' },
          brand: { stringValue: product.brand || '' },
          color: { stringValue: product.color || '' },
          unit: { stringValue: product.unit || 'Pieces (Pcs)' },
          price: { doubleValue: Number(product.price || 0) },
          stock: { integerValue: String(product.stock ?? 100) },
          taxRate: { doubleValue: Number(product.taxRate || 18) },
          description: { stringValue: product.description || product.overview || '' },
          imageUrl: { stringValue: product.imageUrl || product.coverImage || '' },
          imagesJson: { stringValue: JSON.stringify(product.images || [product.imageUrl || product.coverImage].filter(Boolean)) },
          featuresJson: { stringValue: JSON.stringify(product.features || []) },
          volumeDiscountsJson: { stringValue: JSON.stringify(product.volumeDiscounts || []) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (e) {
    console.warn('[Firestore] Product upsert in Firestore notice:', e);
  }
}

export async function getProductsFromFirestore(): Promise<any[]> {
  const token = await getFirestoreAccessToken();
  if (!token) return [];

  try {
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/products?pageSize=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.documents)) {
        return data.documents.map((doc: any) => {
          const f = doc.fields || {};
          let images: string[] = [];
          try {
            if (f.imagesJson?.stringValue) images = JSON.parse(f.imagesJson.stringValue);
          } catch (_) {}

          let features: string[] = [];
          try {
            if (f.featuresJson?.stringValue) features = JSON.parse(f.featuresJson.stringValue);
          } catch (_) {}

          let volumeDiscounts: any[] = [];
          try {
            if (f.volumeDiscountsJson?.stringValue) volumeDiscounts = JSON.parse(f.volumeDiscountsJson.stringValue);
          } catch (_) {}

          return {
            id: f.id?.stringValue || doc.name.split('/').pop(),
            name: f.name?.stringValue || '',
            sku: f.sku?.stringValue || '',
            category: f.category?.stringValue || '',
            subCategory: f.subCategory?.stringValue || '',
            brand: f.brand?.stringValue || '',
            color: f.color?.stringValue || '',
            unit: f.unit?.stringValue || 'Pieces (Pcs)',
            price: Number(f.price?.doubleValue ?? f.price?.integerValue ?? 0),
            stock: Number(f.stock?.integerValue ?? 100),
            taxRate: Number(f.taxRate?.doubleValue ?? f.taxRate?.integerValue ?? 18),
            description: f.description?.stringValue || '',
            overview: f.description?.stringValue || '',
            imageUrl: f.imageUrl?.stringValue || '',
            coverImage: f.imageUrl?.stringValue || '',
            images,
            features,
            volumeDiscounts,
            updatedAt: f.updatedAt?.stringValue,
          };
        });
      }
    }
  } catch (e) {
    console.warn('[Firestore] Failed to list products from Firestore:', e);
  }
  return [];
}

export async function saveQuoteToFirestore(quote: any): Promise<void> {
  const token = await getFirestoreAccessToken();
  if (!token) return;

  try {
    const docNo = quote.quoteNumber || quote.docNo || quote.id || `doc_${Date.now()}`;
    const cleanId = encodeURIComponent(docNo.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/invoices_pdfs/${cleanId}`;

    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: quote.id || cleanId },
          docNo: { stringValue: docNo },
          docType: { stringValue: quote.docType || 'QUOTATION' },
          pdfData: { stringValue: quote.pdfUrl || '' },
          totalAmount: { doubleValue: Number(quote.totalAmount || 0) },
          partyName: { stringValue: quote.partyName || quote.clientName || 'Client' },
          companyName: { stringValue: quote.companyName || quote.clientCompany || 'Company' },
          status: { stringValue: quote.status || 'DRAFT' },
          createdByName: { stringValue: quote.createdByName || '' },
          createdByRole: { stringValue: quote.createdByRole || '' },
          payloadJson: { stringValue: JSON.stringify(quote.payload || {}) },
          itemsJson: { stringValue: JSON.stringify(quote.items || []) },
          savedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (e) {
    console.warn('[Firestore] Quote save to Firestore collection invoices_pdfs notice:', e);
  }
}

export async function getQuotesFromFirestore(): Promise<any[]> {
  const token = await getFirestoreAccessToken();
  if (!token) return [];

  try {
    const url = `https://firestore.googleapis.com/v1/projects/das-crm0/databases/(default)/documents/invoices_pdfs?pageSize=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.documents)) {
        return data.documents.map((doc: any) => {
          const f = doc.fields || {};
          let payload: any = {};
          try {
            if (f.payloadJson?.stringValue) payload = JSON.parse(f.payloadJson.stringValue);
          } catch (_) {}

          let items: any[] = [];
          try {
            if (f.itemsJson?.stringValue) items = JSON.parse(f.itemsJson.stringValue);
          } catch (_) {}

          const docNo = f.docNo?.stringValue || doc.name.split('/').pop();
          const pdfUrl = f.pdfData?.stringValue || f.pdfUrl?.stringValue || payload?.pdfUrl || '';

          return {
            id: f.id?.stringValue || docNo,
            docNo,
            quoteNumber: docNo,
            docType: f.docType?.stringValue || 'QUOTATION',
            partyName: f.partyName?.stringValue || 'Client',
            clientName: f.partyName?.stringValue || 'Client',
            companyName: f.companyName?.stringValue || 'Company',
            clientCompany: f.companyName?.stringValue || 'Company',
            totalAmount: Number(f.totalAmount?.doubleValue ?? f.totalAmount?.integerValue ?? 0),
            status: f.status?.stringValue || 'GENERATED_SENT',
            pdfUrl,
            createdByName: f.createdByName?.stringValue,
            createdByRole: f.createdByRole?.stringValue,
            savedAt: f.savedAt?.stringValue ? new Date(f.savedAt.stringValue).toLocaleString('en-IN') : 'Recently',
            createdAt: f.savedAt?.stringValue || new Date().toISOString(),
            payload: {
              ...payload,
              pdfUrl,
            },
            items,
          };
        });
      }
    }
  } catch (e) {
    console.warn('[Firestore] Failed to list quotes from Firestore:', e);
  }
  return [];
}

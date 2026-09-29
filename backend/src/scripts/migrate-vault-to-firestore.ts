import * as path from 'path';
import * as fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function migrateVaultToFirestore() {
  console.log('🚀 Starting DAS CRM Vault to Google Firestore Migration...');

  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || 'service-account.json';
  const keyFilePath = path.isAbsolute(keyFile) ? keyFile : path.resolve(process.cwd(), keyFile);
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'das-crm-506400';

  let app;
  if (fs.existsSync(keyFilePath)) {
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    app = initializeApp({
      credential: cert(keyData),
      projectId: keyData.project_id || projectId,
    });
    console.log(`✅ Firebase initialized with key file: ${keyFilePath}`);
  } else {
    app = initializeApp({
      projectId,
    });
    console.log(`✅ Firebase initialized with project ID: ${projectId}`);
  }

  const firestore = getFirestore(app);
  const vaultPath = path.resolve(process.cwd(), 'storage', 'drive_vault');
  const registryPath = path.join(vaultPath, 'registry.json');
  const firestoreRegPath = path.join(vaultPath, 'firestore_registry.json');

  let records: any[] = [];

  if (fs.existsSync(firestoreRegPath)) {
    records = JSON.parse(fs.readFileSync(firestoreRegPath, 'utf8'));
  } else if (fs.existsSync(registryPath)) {
    records = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  }

  console.log(`📂 Found ${records.length} file records to migrate.`);

  let migratedCount = 0;
  for (const record of records) {
    const fileId = record.fileId || `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = firestore.collection('files').doc(fileId);

    const firestoreDoc = {
      fileId,
      organizationId: record.organizationId || 'org_default',
      companyName: record.companyName || 'Acme Sales Solutions',
      fileName: record.fileName || 'unnamed_file',
      originalName: record.originalName || record.fileName || 'file',
      mimeType: record.mimeType || 'application/octet-stream',
      fileExtension: (record.fileName || '').split('.').pop() || 'dat',
      sizeBytes: record.sizeBytes || 0,
      sizeFormatted: record.sizeFormatted || '0 B',
      category: record.category || 'DOCUMENTS',
      subCategory: record.subCategory || null,
      employeeName: record.employeeName || null,
      folderHierarchy: record.folderHierarchy || [record.companyName || 'Acme Sales Solutions', 'Documents'],
      folderPath: record.folderPath || `Google Drive > ${record.companyName || 'Acme Sales Solutions'} > Documents`,
      storageEngines: {
        firestore: true,
        googleCloudStorage: !!record.gcsPath,
        googleDrive: !!record.driveFileId,
        localVault: true,
      },
      driveFileId: record.driveFileId || null,
      driveViewUrl: record.driveViewUrl || null,
      driveDownloadUrl: record.driveDownloadUrl || null,
      isProtectedKyc:
        record.category === 'EMPLOYEES' ||
        record.category === 'PROFILES' ||
        (record.subCategory && record.subCategory.toLowerCase() === 'documents') ||
        !!(record.employeeName && record.employeeName.trim().length > 0),
      uploadedAt: record.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    await docRef.set(firestoreDoc, { merge: true });
    migratedCount++;
    console.log(`  [${migratedCount}/${records.length}] Migrated: ${firestoreDoc.fileName} (${fileId})`);
  }

  console.log(`\n🎉 Migration Complete! Successfully migrated ${migratedCount} file records to Firestore.`);
}

if (require.main === module) {
  migrateVaultToFirestore()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

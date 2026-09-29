import { FirestoreService } from './firestore.service';
import { FirestoreStorageService } from './firestore-storage.service';
import { FirestoreFileDocument } from './firestore.interface';

describe('FirestoreStorageService & Document Indexing Tests', () => {
  let firestoreService: FirestoreService;
  let storageService: FirestoreStorageService;

  beforeEach(() => {
    firestoreService = new FirestoreService();
    storageService = new FirestoreStorageService(firestoreService);
  });

  it('should initialize and provide connection status telemetry', () => {
    const status = firestoreService.getStatus();
    expect(status).toBeDefined();
    expect(status.activeCategories).toContain('EMPLOYEES');
    expect(status.activeCategories).toContain('LEADS');
    expect(status.activeCategories).toContain('DOCUMENTS');
  });

  it('should save, index, and retrieve a file document', async () => {
    const testDoc: FirestoreFileDocument = {
      fileId: `test_${Date.now()}`,
      organizationId: 'org_test_1',
      companyName: 'Acme Test Corp',
      fileName: 'test_report_2026.xlsx',
      originalName: 'test_report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
      sizeBytes: 1048576,
      sizeFormatted: '1 MB',
      category: 'LEADS',
      folderHierarchy: ['Acme Test Corp', 'Leads'],
      folderPath: 'Google Drive > Acme Test Corp > Leads',
      storageEngines: {
        firestore: true,
        googleCloudStorage: false,
        googleDrive: true,
        localVault: true,
      },
      driveFileId: 'drive_test_123',
      driveViewUrl: 'https://drive.google.com/file/d/drive_test_123/view',
      driveDownloadUrl: 'https://drive.google.com/uc?export=download&id=drive_test_123',
      isProtectedKyc: false,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    const saved = await storageService.saveFileRecord(testDoc);
    expect(saved.fileId).toBe(testDoc.fileId);

    const retrieved = await storageService.getFileRecord(testDoc.fileId);
    expect(retrieved.fileName).toBe('test_report_2026.xlsx');
    expect(retrieved.companyName).toBe('Acme Test Corp');
    expect(retrieved.category).toBe('LEADS');
    expect(retrieved.storageEngines.firestore).toBe(true);
  });

  it('should list files matching company and category filters', async () => {
    const files = await storageService.listFileRecords({
      companyName: 'Acme Test Corp',
      category: 'LEADS',
    });
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it('should compute storage usage summary accurately', async () => {
    const summary = await storageService.getStorageUsageSummary('Acme Test Corp');
    expect(summary).toBeDefined();
    expect(summary.totalFiles).toBeGreaterThanOrEqual(1);
    expect(summary.categoryBreakdown['LEADS']).toBeDefined();
  });

  it('should mark employee documents as permanently protected KYC records', () => {
    const legacyEmpDoc = {
      fileId: 'emp_doc_1',
      fileName: 'PASSPORT_SCAN.pdf',
      category: 'EMPLOYEES',
      employeeName: 'Priya Sharma',
      subCategory: 'Documents',
      sizeBytes: 204800,
    };

    const converted = storageService.convertLegacyFileToFirestoreDoc(legacyEmpDoc);
    expect(converted.isProtectedKyc).toBe(true);
    expect(converted.category).toBe('EMPLOYEES');
    expect(converted.fileExtension).toBe('pdf');
  });
});

import { DriveService, StoredFileInfo } from '../drive/drive.service';
import { FirestoreService } from '../firestore/firestore.service';
import { FirestoreStorageService } from '../firestore/firestore-storage.service';

describe('DataRetention & Employee Documents Exemption Tests', () => {
  let driveService: DriveService;
  let firestoreStorageService: FirestoreStorageService;

  beforeEach(() => {
    const firestoreService = new FirestoreService();
    firestoreStorageService = new FirestoreStorageService(firestoreService);
    driveService = new DriveService(firestoreService, firestoreStorageService);
  });

  it('should identify all employee verified document variations as protected', () => {
    const employeeDocs: StoredFileInfo[] = [
      {
        fileId: 'f1',
        fileName: 'AADHAAR_VERIFIED.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        companyName: 'Acme Sales Solutions',
        category: 'EMPLOYEES',
        employeeName: 'Amit Shah',
        subCategory: 'Documents',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Amit Shah', 'Documents'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Amit Shah > Documents',
        driveViewUrl: 'http://example.com/view1',
        driveDownloadUrl: 'http://example.com/dl1',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'f2',
        fileName: 'PAN_CARD_SCAN.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        companyName: 'Acme Sales Solutions',
        category: 'EMPLOYEES',
        employeeName: 'Rahul Verma',
        subCategory: 'Documents',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Rahul Verma', 'Documents'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Rahul Verma > Documents',
        driveViewUrl: 'http://example.com/view2',
        driveDownloadUrl: 'http://example.com/dl2',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'f3',
        fileName: 'PROFILE_PHOTO.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 512,
        companyName: 'Acme Sales Solutions',
        category: 'PROFILES',
        employeeName: 'Sneha Patel',
        subCategory: 'DP',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Sneha Patel', 'DP'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Sneha Patel > DP',
        driveViewUrl: 'http://example.com/view3',
        driveDownloadUrl: 'http://example.com/dl3',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'f4',
        fileName: 'EMPLOYMENT_AGREEMENT.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 4096,
        companyName: 'Acme Sales Solutions',
        category: 'DOCUMENTS',
        employeeName: 'Karan Mehra',
        subCategory: 'Details',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Karan Mehra', 'Details'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Karan Mehra > Details',
        driveViewUrl: 'http://example.com/view4',
        driveDownloadUrl: 'http://example.com/dl4',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const file of employeeDocs) {
      expect(driveService.isEmployeeDocument(file)).toBe(true);
    }
  });

  it('should identify general non-employee company files as eligible for retention purge', () => {
    const generalCompanyFiles: StoredFileInfo[] = [
      {
        fileId: 'g1',
        fileName: 'LEADS_IMPORT_JAN.csv',
        mimeType: 'text/csv',
        sizeBytes: 1024,
        companyName: 'Acme Sales Solutions',
        category: 'LEADS',
        folderHierarchy: ['Acme Sales Solutions', 'Leads'],
        folderPath: 'Google Drive > Acme Sales Solutions > Leads',
        driveViewUrl: 'http://example.com/g1',
        driveDownloadUrl: 'http://example.com/g1_dl',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'g2',
        fileName: 'QUOTATION_Q101.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        companyName: 'Acme Sales Solutions',
        category: 'QUOTATIONS',
        folderHierarchy: ['Acme Sales Solutions', 'Quotations'],
        folderPath: 'Google Drive > Acme Sales Solutions > Quotations',
        driveViewUrl: 'http://example.com/g2',
        driveDownloadUrl: 'http://example.com/g2_dl',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'g3',
        fileName: 'PRODUCT_BROCHURE.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 5120,
        companyName: 'Acme Sales Solutions',
        category: 'PRODUCTS',
        folderHierarchy: ['Acme Sales Solutions', 'Products'],
        folderPath: 'Google Drive > Acme Sales Solutions > Products',
        driveViewUrl: 'http://example.com/g3',
        driveDownloadUrl: 'http://example.com/g3_dl',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const file of generalCompanyFiles) {
      expect(driveService.isEmployeeDocument(file)).toBe(false);
    }
  });

  it('should purge expired company files while strictly preserving verified employee documents', async () => {
    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const mixedFiles: StoredFileInfo[] = [
      {
        fileId: 'lead_csv_old',
        fileName: 'OLD_LEADS_BATCH.csv',
        mimeType: 'text/csv',
        sizeBytes: 5000,
        companyName: 'Test Org',
        category: 'LEADS',
        folderPath: 'Google Drive > Test Org > Leads',
        driveViewUrl: 'http://example.com/lead',
        driveDownloadUrl: 'http://example.com/lead_dl',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'emp_pan_doc',
        fileName: 'EMPLOYEE_PAN_CARD.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 3000,
        companyName: 'Test Org',
        category: 'EMPLOYEES',
        employeeName: 'Rahul Verma',
        subCategory: 'Documents',
        folderHierarchy: ['Test Org', 'Employees', 'Rahul Verma', 'Documents'],
        folderPath: 'Google Drive > Test Org > Employees > Rahul Verma > Documents',
        driveViewUrl: 'http://example.com/emp_pan',
        driveDownloadUrl: 'http://example.com/emp_pan_dl',
        uploadedAt: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'emp_aadhaar_doc',
        fileName: 'AADHAAR_CARD.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2500,
        companyName: 'Test Org',
        category: 'EMPLOYEES',
        employeeName: 'Rahul Verma',
        subCategory: 'Documents',
        folderHierarchy: ['Test Org', 'Employees', 'Rahul Verma', 'Documents'],
        folderPath: 'Google Drive > Test Org > Employees > Rahul Verma > Documents',
        driveViewUrl: 'http://example.com/emp_aadhaar',
        driveDownloadUrl: 'http://example.com/emp_aadhaar_dl',
        uploadedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const f of mixedFiles) {
      await firestoreStorageService.saveFileRecord(
        firestoreStorageService.convertLegacyFileToFirestoreDoc(f),
      );
    }

    const result = await driveService.purgeExpiredCompanyFiles(cutoffDate, 'Test Org');

    expect(result.purgedCount).toBe(1);
    expect(result.purgedFiles).toContain('OLD_LEADS_BATCH.csv');
    expect(result.protectedEmployeeDocCount).toBe(2);

    const remaining = await firestoreStorageService.listFileRecords({ companyName: 'Test Org' });
    expect(remaining.length).toBe(2);
    expect(remaining.some((f) => f.fileName === 'EMPLOYEE_PAN_CARD.pdf')).toBe(true);
    expect(remaining.some((f) => f.fileName === 'AADHAAR_CARD.pdf')).toBe(true);
    expect(remaining.some((f) => f.fileName === 'OLD_LEADS_BATCH.csv')).toBe(false);
  });
});

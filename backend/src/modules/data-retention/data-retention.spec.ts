import { DriveService, StoredFileInfo } from '../drive/drive.service';

describe('DataRetention & Employee Documents Exemption Tests', () => {
  let driveService: DriveService;

  beforeEach(() => {
    driveService = new DriveService();
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
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
      },
      {
        fileId: 'f2',
        fileName: 'PAN_CARD_SCAN.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        companyName: 'Acme Sales Solutions',
        category: 'EMPLOYEES',
        employeeName: 'Priya Sharma',
        subCategory: 'Documents',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Priya Sharma', 'Documents'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Priya Sharma > Documents',
        driveViewUrl: 'http://example.com/view2',
        driveDownloadUrl: 'http://example.com/dl2',
        uploadedAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(), // 250 days ago
      },
      {
        fileId: 'f3',
        fileName: 'EMPLOYEE_PROFILE_PHOTO.png',
        mimeType: 'image/png',
        sizeBytes: 512,
        companyName: 'Acme Sales Solutions',
        category: 'PROFILES',
        employeeName: 'Amit Shah',
        subCategory: 'DP',
        folderHierarchy: ['Acme Sales Solutions', 'Employees', 'Amit Shah', 'DP'],
        folderPath: 'Google Drive > Acme Sales Solutions > Employees > Amit Shah > DP',
        driveViewUrl: 'http://example.com/view3',
        driveDownloadUrl: 'http://example.com/dl3',
        uploadedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const doc of employeeDocs) {
      expect(driveService.isEmployeeDocument(doc)).toBe(true);
    }
  });

  it('should classify non-employee company files as NOT exempt (eligible for purge if > 180 days)', () => {
    const nonEmployeeFiles: StoredFileInfo[] = [
      {
        fileId: 'f4',
        fileName: 'LEAD_IMPORT_OCTOBER_2025.csv',
        mimeType: 'text/csv',
        sizeBytes: 4096,
        companyName: 'Acme Sales Solutions',
        category: 'LEADS',
        subCategory: 'Spreadsheets',
        folderHierarchy: ['Acme Sales Solutions', 'Leads'],
        folderPath: 'Google Drive > Acme Sales Solutions > Leads',
        driveViewUrl: 'http://example.com/view4',
        driveDownloadUrl: 'http://example.com/dl4',
        uploadedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        fileId: 'f5',
        fileName: 'EXPIRED_QUOTATION_Q982.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 8192,
        companyName: 'Acme Sales Solutions',
        category: 'QUOTATIONS',
        folderHierarchy: ['Acme Sales Solutions', 'Quotations'],
        folderPath: 'Google Drive > Acme Sales Solutions > Quotations',
        driveViewUrl: 'http://example.com/view5',
        driveDownloadUrl: 'http://example.com/dl5',
        uploadedAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const file of nonEmployeeFiles) {
      expect(driveService.isEmployeeDocument(file)).toBe(false);
    }
  });

  it('should purge expired company files while strictly preserving verified employee documents', async () => {
    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const mixedFiles: StoredFileInfo[] = [
      // Expired company file (200 days old) -> Should be PURGED
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
      // Expired verified employee document (220 days old) -> MUST BE PRESERVED
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
      // Expired verified employee KYC document (300 days old) -> MUST BE PRESERVED
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

    (driveService as any).storedFilesRegistry = mixedFiles;

    const result = await driveService.purgeExpiredCompanyFiles(cutoffDate, 'Test Org');

    // Exactly 1 company file purged
    expect(result.purgedCount).toBe(1);
    expect(result.purgedFiles).toContain('OLD_LEADS_BATCH.csv');

    // Both employee documents strictly preserved
    expect(result.protectedEmployeeDocCount).toBe(2);

    const remaining = (driveService as any).storedFilesRegistry;
    expect(remaining.length).toBe(2);
    expect(remaining.some((f: StoredFileInfo) => f.fileName === 'EMPLOYEE_PAN_CARD.pdf')).toBe(true);
    expect(remaining.some((f: StoredFileInfo) => f.fileName === 'AADHAAR_CARD.pdf')).toBe(true);
    expect(remaining.some((f: StoredFileInfo) => f.fileName === 'OLD_LEADS_BATCH.csv')).toBe(false);
  });
});

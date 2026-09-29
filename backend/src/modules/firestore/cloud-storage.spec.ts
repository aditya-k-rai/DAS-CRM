import { FirestoreService } from './firestore.service';
import { CloudStorageService } from './cloud-storage.service';
import { DriveService } from '../drive/drive.service';
import { FirestoreStorageService } from './firestore-storage.service';

describe('CloudStorageService & Unified Storage Engine Tests', () => {
  let firestoreService: FirestoreService;
  let firestoreStorageService: FirestoreStorageService;
  let cloudStorageService: CloudStorageService;
  let driveService: DriveService;

  beforeEach(() => {
    firestoreService = new FirestoreService();
    firestoreStorageService = new FirestoreStorageService(firestoreService);
    cloudStorageService = new CloudStorageService(firestoreService);
    driveService = new DriveService(
      firestoreService,
      firestoreStorageService,
      cloudStorageService,
    );
  });

  it('should initialize and provide Cloud Storage bucket details', () => {
    const bucketName = cloudStorageService.getBucketName();
    expect(bucketName).toBeDefined();
    expect(bucketName.length).toBeGreaterThan(0);
  });

  it('should upload a buffer and return cloud storage / vault paths', async () => {
    const testContent = Buffer.from('DAS CRM Unified Architecture Cloud Storage Test Payload');
    const objectPath = 'vault/Test_Org/Documents/test_cloud_upload.txt';

    const result = await cloudStorageService.uploadBuffer(
      testContent,
      objectPath,
      'text/plain',
    );

    expect(result).toBeDefined();
    expect(result.gcsPath).toBeDefined();
    expect(result.gcsDownloadUrl).toBeDefined();
  });

  it('should generate a signed upload URL structure', async () => {
    const result = await cloudStorageService.generateSignedUploadUrl(
      'vault/Test_Org/Leads/direct_client_upload.csv',
      'text/csv',
      15,
    );

    expect(result).toBeDefined();
    expect(result.uploadUrl).toBeDefined();
    expect(result.objectPath).toContain('direct_client_upload.csv');
    expect(result.expiresAt).toBeDefined();
  });

  it('should generate a signed download URL structure', async () => {
    const downloadUrl = await cloudStorageService.generateSignedDownloadUrl(
      'vault/Test_Org/Quotations/quote_2026.pdf',
      'quote_2026.pdf',
      60,
    );

    expect(downloadUrl).toBeDefined();
    expect(typeof downloadUrl).toBe('string');
  });

  it('should return unified storage status across Firestore, Cloud Storage, and Drive', async () => {
    const status = await driveService.getUnifiedStatus();
    expect(status).toBeDefined();
    expect(status.firestore).toBeDefined();
    expect(status.cloudStorage).toBeDefined();
    expect(status.googleDrive).toBeDefined();
    expect(status.message).toContain('Unified Cloud Engine');
  });
});

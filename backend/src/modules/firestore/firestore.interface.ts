export type StorageCategory =
  | 'EMPLOYEES'
  | 'LEADS'
  | 'QUOTATIONS'
  | 'PRODUCTS'
  | 'PROFILES'
  | 'DOCUMENTS';

export interface StorageEnginesState {
  firestore: boolean;
  googleCloudStorage: boolean;
  googleDrive: boolean;
  localVault: boolean;
}

export interface FirestoreFileDocument {
  fileId: string;
  organizationId: string;
  companyName: string;

  // File Metadata
  fileName: string;
  originalName: string;
  mimeType: string;
  fileExtension: string;
  sizeBytes: number;
  sizeFormatted: string;
  checksumSha256?: string;

  // Classification & Folder Tree
  category: StorageCategory;
  subCategory?: string;
  employeeName?: string;
  employeeId?: string;
  folderHierarchy: string[];
  folderPath: string;

  // Storage Engine Locations & URLs
  storageEngines: StorageEnginesState;

  gcsPath?: string;
  gcsDownloadUrl?: string;

  driveFileId?: string;
  driveViewUrl?: string;
  driveDownloadUrl?: string;
  driveFolderId?: string;

  localPath?: string;
  thumbnailBase64?: string;

  // Compliance, Security & Retention
  isProtectedKyc: boolean;
  uploadedByUserId?: string;
  uploadedByRole?: string;

  // Timestamps & Lifecycle
  uploadedAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface FileFilterDto {
  organizationId?: string;
  companyName?: string;
  category?: StorageCategory;
  employeeName?: string;
  subCategory?: string;
  fileExtension?: string;
  searchQuery?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface StorageStatsDto {
  totalFiles: number;
  totalBytes: number;
  totalSizeFormatted: string;
  categoryBreakdown: Record<
    string,
    { count: number; bytes: number; sizeFormatted: string }
  >;
  protectedEmployeeDocsCount: number;
  expiredCompanyFilesCount: number;
}

export interface FirestoreConnectionStatus {
  connected: boolean;
  authType: 'SERVICE_ACCOUNT' | 'FIREBASE_ENV' | 'EMULATOR' | 'LOCAL_CACHE';
  projectId: string;
  serviceAccountEmail?: string;
  storageBucket?: string;
  firestoreCollection: string;
  totalIndexedFiles: number;
  activeCategories: StorageCategory[];
  message: string;
}

export interface AppReleaseInfo {
  version: string;
  platform: 'ANDROID_APK' | 'MAC_DMG';
  fileName: string;
  fileSize: string;
  driveDownloadUrl: string;
  firestoreDocId?: string;
  uploadedAt: string;
}

export interface FolderMailRequestDto {
  folderPath: string;
  recipientEmail: string;
  companyName?: string;
  category?: StorageCategory;
  employeeName?: string;
  subCategory?: string;
  format?: 'ZIP' | 'CSV_MANIFEST' | 'SECURE_LINK';
  notes?: string;
}

export interface FolderMailRequestRecord {
  requestId: string;
  folderPath: string;
  recipientEmail: string;
  companyName: string;
  category?: StorageCategory;
  employeeName?: string;
  format: 'ZIP' | 'CSV_MANIFEST' | 'SECURE_LINK';
  fileCount: number;
  totalSizeMb: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED';
  requestedAt: string;
  downloadUrl?: string;
}

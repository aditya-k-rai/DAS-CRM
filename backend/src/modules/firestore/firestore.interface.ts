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
  accessControl?: 'PUBLIC' | 'ORG_INTERNAL' | 'HR_CONFIDENTIAL' | 'ADMIN_RESTRICTED';

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

export interface UnifiedStorageStatus {
  firestore: FirestoreConnectionStatus;
  cloudStorage: {
    connected: boolean;
    bucketName: string;
    authType: string;
  };
  googleDrive: {
    connected: boolean;
    authType: string;
    serviceAccountEmail?: string;
  };
  totalFilesIndexed: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  message: string;
}

export interface SignedUploadUrlRequestDto {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  category: StorageCategory;
  companyName?: string;
  employeeName?: string;
  subCategory?: string;
  expiresInMinutes?: number;
}

export interface SignedUploadUrlResponseDto {
  fileId: string;
  uploadUrl: string;
  gcsPath: string;
  objectPath: string;
  expiresAt: string;
  category: StorageCategory;
  folderPath: string;
}

export interface ConfirmSignedUploadDto {
  fileId: string;
  fileName: string;
  originalName?: string;
  mimeType: string;
  sizeBytes: number;
  category: StorageCategory;
  companyName?: string;
  employeeName?: string;
  subCategory?: string;
  checksumSha256?: string;
}

export interface AppReleaseInfo {
  version: string;
  platform: 'ANDROID_APK' | 'MAC_DMG' | 'WINDOWS_EXE';
  fileName: string;
  fileSize: string;
  driveDownloadUrl: string;
  gcsDownloadUrl?: string;
  firestoreDocId?: string;
  uploadedAt: string;
  releaseNotes?: string;
  isLatest?: boolean;
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

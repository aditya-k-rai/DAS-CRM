import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { FirestoreService } from './firestore.service';
import {
  FirestoreFileDocument,
  FileFilterDto,
  StorageStatsDto,
  AppReleaseInfo,
  FolderMailRequestRecord,
  StorageCategory,
} from './firestore.interface';

@Injectable()
export class FirestoreStorageService {
  private readonly logger = new Logger(FirestoreStorageService.name);
  private readonly collectionName = 'files';
  private readonly localVaultBasePath: string;
  private localFilesRegistry: Map<string, FirestoreFileDocument> = new Map();
  private appReleasesCache: AppReleaseInfo[] = [];
  private mailRequestsCache: FolderMailRequestRecord[] = [];

  constructor(private readonly firestoreService: FirestoreService) {
    this.localVaultBasePath = path.resolve(process.cwd(), 'storage', 'drive_vault');
    this.initLocalRegistry();
  }

  private initLocalRegistry() {
    try {
      if (!fs.existsSync(this.localVaultBasePath)) {
        fs.mkdirSync(this.localVaultBasePath, { recursive: true });
      }
      const regPath = path.join(this.localVaultBasePath, 'firestore_registry.json');
      const legacyRegPath = path.join(this.localVaultBasePath, 'registry.json');

      if (fs.existsSync(regPath)) {
        const raw = fs.readFileSync(regPath, 'utf8');
        const items: FirestoreFileDocument[] = JSON.parse(raw);
        items.forEach((item) => this.localFilesRegistry.set(item.fileId, item));
      } else if (fs.existsSync(legacyRegPath)) {
        const raw = fs.readFileSync(legacyRegPath, 'utf8');
        const legacyItems = JSON.parse(raw);
        legacyItems.forEach((legacy: any) => {
          const converted = this.convertLegacyFileToFirestoreDoc(legacy);
          this.localFilesRegistry.set(converted.fileId, converted);
        });
        this.persistLocalRegistry();
      }
    } catch (e) {
      this.logger.warn('Could not initialize local cache registry:', e);
    }
  }

  private persistLocalRegistry() {
    try {
      const regPath = path.join(this.localVaultBasePath, 'firestore_registry.json');
      const items = Array.from(this.localFilesRegistry.values());
      fs.writeFileSync(regPath, JSON.stringify(items, null, 2), 'utf8');
    } catch (e) {
      this.logger.warn('Failed to persist firestore cache registry to disk:', e);
    }
  }

  convertLegacyFileToFirestoreDoc(legacy: any): FirestoreFileDocument {
    const extMatch = (legacy.fileName || '').match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'dat';
    const isProtected =
      legacy.category === 'EMPLOYEES' ||
      legacy.category === 'PROFILES' ||
      (legacy.subCategory && legacy.subCategory.toLowerCase() === 'documents') ||
      !!(legacy.employeeName && legacy.employeeName.trim().length > 0);

    return {
      fileId: legacy.fileId || `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: legacy.organizationId || 'org_default',
      companyName: legacy.companyName || 'Acme Sales Solutions',
      fileName: legacy.fileName || 'unnamed_file',
      originalName: legacy.originalName || legacy.fileName || 'file',
      mimeType: legacy.mimeType || 'application/octet-stream',
      fileExtension: ext,
      sizeBytes: legacy.sizeBytes || 0,
      sizeFormatted: this.formatBytes(legacy.sizeBytes || 0),
      category: legacy.category || 'DOCUMENTS',
      subCategory: legacy.subCategory,
      employeeName: legacy.employeeName,
      folderHierarchy: legacy.folderHierarchy || [legacy.companyName || 'Acme Sales Solutions', 'Documents'],
      folderPath: legacy.folderPath || `Google Drive > ${legacy.companyName || 'Acme Sales Solutions'} > Documents`,
      storageEngines: {
        firestore: true,
        googleCloudStorage: !!legacy.gcsPath,
        googleDrive: !!legacy.driveFileId,
        localVault: !!legacy.localPath,
      },
      gcsPath: legacy.gcsPath,
      gcsDownloadUrl: legacy.gcsDownloadUrl,
      driveFileId: legacy.driveFileId,
      driveViewUrl: legacy.driveViewUrl || (legacy.driveFileId ? `https://drive.google.com/file/d/${legacy.driveFileId}/view` : undefined),
      driveDownloadUrl: legacy.driveDownloadUrl || (legacy.driveFileId ? `https://drive.google.com/uc?export=download&id=${legacy.driveFileId}` : undefined),
      localPath: legacy.localPath,
      isProtectedKyc: isProtected,
      uploadedAt: legacy.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async saveFileRecord(doc: FirestoreFileDocument): Promise<FirestoreFileDocument> {
    doc.updatedAt = new Date().toISOString();
    doc.sizeFormatted = this.formatBytes(doc.sizeBytes);

    // 1. Update In-Memory & Local Disk Cache
    this.localFilesRegistry.set(doc.fileId, doc);
    this.persistLocalRegistry();

    // 2. Persist to Google Cloud Firestore if connected
    const firestore = this.firestoreService.getFirestore();
    if (firestore) {
      try {
        const docRef = firestore.collection(this.collectionName).doc(doc.fileId);
        await docRef.set(doc, { merge: true });
        this.logger.log(`🔥 Document synced to Firestore collection [${this.collectionName}/${doc.fileId}]`);
      } catch (err) {
        this.logger.error(`Error saving document ${doc.fileId} to Firestore:`, err);
      }
    }

    return doc;
  }

  async getFileRecord(fileId: string): Promise<FirestoreFileDocument> {
    // 1. Check local cache first for sub-millisecond retrieval
    if (this.localFilesRegistry.has(fileId)) {
      return this.localFilesRegistry.get(fileId)!;
    }

    // 2. Search local cache by driveFileId
    for (const item of this.localFilesRegistry.values()) {
      if (item.driveFileId === fileId) {
        return item;
      }
    }

    // 3. Fallback to Cloud Firestore
    const firestore = this.firestoreService.getFirestore();
    if (firestore) {
      try {
        const docRef = firestore.collection(this.collectionName).doc(fileId);
        const snapshot = await docRef.get();
        if (snapshot.exists) {
          const data = snapshot.data() as FirestoreFileDocument;
          this.localFilesRegistry.set(data.fileId, data);
          return data;
        }
      } catch (err) {
        this.logger.warn(`Could not fetch file ${fileId} from Firestore:`, err);
      }
    }

    throw new NotFoundException(`File record ${fileId} not found in Firestore registry`);
  }

  async listFileRecords(filters: FileFilterDto = {}): Promise<FirestoreFileDocument[]> {
    const {
      companyName,
      category,
      employeeName,
      subCategory,
      fileExtension,
      searchQuery,
      includeDeleted = false,
      limit = 500,
      offset = 0,
    } = filters;

    let items = Array.from(this.localFilesRegistry.values());

    // Apply Filter Criteria
    items = items.filter((f) => {
      if (!includeDeleted && f.isDeleted) return false;
      if (companyName && f.companyName.toLowerCase() !== companyName.toLowerCase()) return false;
      if (category && f.category !== category) return false;
      if (employeeName && (!f.employeeName || f.employeeName.toLowerCase() !== employeeName.toLowerCase())) return false;
      if (subCategory && (!f.subCategory || f.subCategory.toLowerCase() !== subCategory.toLowerCase())) return false;
      if (fileExtension && f.fileExtension.toLowerCase() !== fileExtension.toLowerCase()) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          f.fileName.toLowerCase().includes(q) ||
          f.originalName.toLowerCase().includes(q) ||
          f.folderPath.toLowerCase().includes(q) ||
          (f.employeeName && f.employeeName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });

    // Sort latest uploads first
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return items.slice(offset, offset + limit);
  }

  async updateFileRecord(
    fileId: string,
    patch: Partial<FirestoreFileDocument>,
  ): Promise<FirestoreFileDocument> {
    const existing = await this.getFileRecord(fileId);
    const updated: FirestoreFileDocument = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    return this.saveFileRecord(updated);
  }

  async deleteFileRecord(fileId: string, hardDelete: boolean = false): Promise<boolean> {
    try {
      const existing = await this.getFileRecord(fileId);

      if (hardDelete) {
        this.localFilesRegistry.delete(existing.fileId);
        this.persistLocalRegistry();

        const firestore = this.firestoreService.getFirestore();
        if (firestore) {
          await firestore.collection(this.collectionName).doc(existing.fileId).delete();
        }
      } else {
        existing.isDeleted = true;
        existing.deletedAt = new Date().toISOString();
        await this.saveFileRecord(existing);
      }

      return true;
    } catch {
      return false;
    }
  }

  async getStorageUsageSummary(companyName?: string): Promise<StorageStatsDto> {
    const files = await this.listFileRecords({ companyName, includeDeleted: false });
    let totalBytes = 0;
    const categoryBreakdown: Record<string, { count: number; bytes: number; sizeFormatted: string }> = {};
    let protectedEmployeeDocsCount = 0;

    const categories: StorageCategory[] = [
      'EMPLOYEES',
      'LEADS',
      'QUOTATIONS',
      'PRODUCTS',
      'PROFILES',
      'DOCUMENTS',
    ];
    categories.forEach((cat) => {
      categoryBreakdown[cat] = { count: 0, bytes: 0, sizeFormatted: '0 B' };
    });

    for (const f of files) {
      totalBytes += f.sizeBytes || 0;
      if (f.isProtectedKyc) {
        protectedEmployeeDocsCount++;
      }

      const cat = f.category || 'DOCUMENTS';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, bytes: 0, sizeFormatted: '0 B' };
      }
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].bytes += f.sizeBytes || 0;
      categoryBreakdown[cat].sizeFormatted = this.formatBytes(categoryBreakdown[cat].bytes);
    }

    return {
      totalFiles: files.length,
      totalBytes,
      totalSizeFormatted: this.formatBytes(totalBytes),
      categoryBreakdown,
      protectedEmployeeDocsCount,
      expiredCompanyFilesCount: 0,
    };
  }

  async saveAppRelease(release: AppReleaseInfo): Promise<AppReleaseInfo> {
    this.appReleasesCache.unshift(release);

    const firestore = this.firestoreService.getFirestore();
    if (firestore) {
      try {
        const releaseDocId = `release_${release.platform.toLowerCase()}_${release.version.replace(/\./g, '_')}`;
        await firestore.collection('superadmin_app_releases').doc(releaseDocId).set(release);
      } catch (e) {
        this.logger.warn('Could not persist app release to Firestore:', e);
      }
    }

    return release;
  }

  getAppReleases(): AppReleaseInfo[] {
    return this.appReleasesCache.length > 0
      ? this.appReleasesCache
      : [
          {
            version: 'v1.4.2',
            platform: 'ANDROID_APK',
            fileName: 'DAS_CRM_Android_v1.4.2.apk',
            fileSize: '48.2 MB',
            driveDownloadUrl: 'https://drive.google.com/uc?export=download&id=demo_apk_id',
            uploadedAt: 'Aug 22, 2026',
          },
          {
            version: 'v1.4.2',
            platform: 'MAC_DMG',
            fileName: 'DAS_CRM_Mac_v1.4.2.dmg',
            fileSize: '82.6 MB',
            driveDownloadUrl: 'https://drive.google.com/uc?export=download&id=demo_dmg_id',
            uploadedAt: 'Aug 22, 2026',
          },
        ];
  }

  async saveMailRequest(record: FolderMailRequestRecord): Promise<FolderMailRequestRecord> {
    this.mailRequestsCache.unshift(record);

    const firestore = this.firestoreService.getFirestore();
    if (firestore) {
      try {
        await firestore.collection('superadmin_mail_requests').doc(record.requestId).set(record);
      } catch (e) {
        this.logger.warn('Could not persist mail request to Firestore:', e);
      }
    }

    return record;
  }

  getMailRequests(companyName?: string): FolderMailRequestRecord[] {
    if (!companyName) return this.mailRequestsCache;
    return this.mailRequestsCache.filter(
      (r) => !r.companyName || r.companyName.toLowerCase() === companyName.toLowerCase(),
    );
  }
}

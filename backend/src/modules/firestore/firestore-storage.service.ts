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
      folderPath: legacy.folderPath || `Firebase Storage > ${legacy.companyName || 'Acme Sales Solutions'} > Documents`,
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
        const sanitizedDoc = JSON.parse(JSON.stringify(doc));
        // Collection 1: 'files' - Full File Archive & Metadata
        const docRef = firestore.collection(this.collectionName).doc(doc.fileId);
        await docRef.set(sanitizedDoc, { merge: true });
        this.logger.log(`🔥 Document synced to Firestore collection [${this.collectionName}/${doc.fileId}] (${doc.fileName})`);

        // Collection 2: 'lead_imports' - Dedicated Audit Log for CSV/Excel/Spreadsheet Ingestions
        if (doc.category === 'LEADS' || doc.rowsCount !== undefined || doc.leadsCount !== undefined) {
          const importRecord = {
            id: doc.fileId,
            fileId: doc.fileId,
            fileName: doc.fileName,
            originalName: doc.originalName || doc.fileName,
            fileSize: doc.sizeFormatted,
            sizeBytes: doc.sizeBytes,
            rowsCount: doc.rowsCount ?? 0,
            colsCount: doc.colsCount ?? 0,
            leadsCount: doc.leadsCount ?? doc.rowsCount ?? 0,
            uploadedAt: doc.uploadedAt,
            uploadDateFormatted: new Date(doc.uploadedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            uploadedBy: doc.uploadedBy || 'Admin',
            sourcePlatform: doc.sourcePlatform || 'Spreadsheet Import',
            status: 'SUCCESS',
            downloadUrl: doc.gcsDownloadUrl || doc.driveDownloadUrl || '',
            storageUrl: doc.gcsDownloadUrl || doc.driveDownloadUrl || '',
            folderPath: doc.folderPath,
            companyName: doc.companyName,
          };
          const importDocRef = firestore.collection('lead_imports').doc(doc.fileId);
          await importDocRef.set(JSON.parse(JSON.stringify(importRecord)), { merge: true });
          this.logger.log(`🔥 Import audit log synced to Firestore [lead_imports/${doc.fileId}] (${doc.fileName})`);
        }

        // Collection 3: 'leads' - Persist individual leads data if attached
        if (Array.isArray(doc.leadsData) && doc.leadsData.length > 0) {
          const batch = firestore.batch();
          doc.leadsData.forEach((lead: any, idx: number) => {
            const leadId = lead.id || `lead_${doc.fileId}_${idx}`;
            const leadDocRef = firestore.collection('leads').doc(leadId);
            const leadPayload = {
              id: leadId,
              fileId: doc.fileId,
              fileName: doc.fileName,
              name: lead.name || 'Unnamed Lead',
              email: lead.email || '',
              phone: lead.phone || '',
              company: lead.company || 'Individual',
              value: lead.value || 0,
              source: doc.sourcePlatform || lead.source || 'Spreadsheet Import',
              status: lead.status || 'NEW',
              stage: lead.stage || 'Prospecting',
              assignedRep: lead.assignedRep || 'Unassigned',
              customFields: lead.customFields || {},
              uploadedAt: doc.uploadedAt,
              uploadedBy: doc.uploadedBy || 'Admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            batch.set(leadDocRef, JSON.parse(JSON.stringify(leadPayload)), { merge: true });
          });
          await batch.commit();
          this.logger.log(`🔥 Batch synced ${doc.leadsData.length} lead items to Firestore [leads] for file ${doc.fileName}`);
        }
      } catch (err) {
        this.logger.error(`Error saving document ${doc.fileId} to Firestore:`, err);
      }
    }

    return doc;
  }

  async getLeadImports(): Promise<any[]> {
    const firestore = this.firestoreService.getFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('lead_imports').orderBy('uploadedAt', 'desc').get();
        if (!snapshot.empty) {
          return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        this.logger.warn('Could not query Firestore lead_imports directly, falling back to files:', err);
      }
    }

    // Fallback: search local files registry for LEADS category
    const files = Array.from(this.localFilesRegistry.values())
      .filter((f) => f.category === 'LEADS' || f.rowsCount !== undefined)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map((f) => ({
        id: f.fileId,
        fileName: f.fileName,
        fileSize: f.sizeFormatted,
        sizeBytes: f.sizeBytes,
        rowsCount: f.rowsCount || 0,
        colsCount: f.colsCount || 0,
        leadsCount: f.leadsCount || f.rowsCount || 0,
        uploadedAt: f.uploadedAt,
        uploadedBy: f.uploadedBy || 'Admin',
        sourcePlatform: f.sourcePlatform || 'Spreadsheet Import',
        status: 'SUCCESS',
        downloadUrl: f.gcsDownloadUrl || f.driveDownloadUrl || '',
      }));

    return files;
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

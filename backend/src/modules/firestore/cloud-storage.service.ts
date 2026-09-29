import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';

export interface SignedUploadUrlResult {
  uploadUrl: string;
  gcsPath: string;
  objectPath: string;
  expiresAt: string;
}

@Injectable()
export class CloudStorageService {
  private readonly logger = new Logger(CloudStorageService.name);
  private readonly localVaultBasePath: string;

  constructor(private readonly firestoreService: FirestoreService) {
    this.localVaultBasePath = path.resolve(process.cwd(), 'storage', 'drive_vault');
    if (!fs.existsSync(this.localVaultBasePath)) {
      try {
        fs.mkdirSync(this.localVaultBasePath, { recursive: true });
      } catch {}
    }
  }

  getBucket(): any {
    return this.firestoreService.getStorageBucket();
  }

  isStorageConnected(): boolean {
    return !!this.getBucket() && this.firestoreService.isFirestoreConnected();
  }

  getBucketName(): string {
    const bucket = this.getBucket();
    return bucket ? bucket.name : 'das-crm-506400.appspot.com';
  }

  /**
   * Directly upload a binary Buffer to Google Cloud Storage.
   */
  async uploadBuffer(
    buffer: Buffer,
    objectPath: string,
    mimeType: string = 'application/octet-stream',
  ): Promise<{ gcsPath: string; gcsDownloadUrl: string }> {
    const bucket = this.getBucket();
    const cleanObjectPath = objectPath.replace(/^\/+/, '');

    if (bucket) {
      try {
        const file = bucket.file(cleanObjectPath);
        await file.save(buffer, {
          contentType: mimeType,
          resumable: buffer.length > 5 * 1024 * 1024,
          metadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=31536000',
          },
        });

        const gcsPath = `gs://${bucket.name}/${cleanObjectPath}`;
        const gcsDownloadUrl = `https://storage.googleapis.com/${bucket.name}/${cleanObjectPath}`;
        this.logger.log(`☁️ Cloud Storage upload success: ${gcsPath} (${buffer.length} bytes)`);

        return { gcsPath, gcsDownloadUrl };
      } catch (err) {
        this.logger.warn(`Could not upload directly to Cloud Storage bucket (${cleanObjectPath}):`, err);
      }
    }

    // Local Vault Fallback
    const localTarget = path.join(this.localVaultBasePath, cleanObjectPath);
    const parentDir = path.dirname(localTarget);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(localTarget, buffer);

    return {
      gcsPath: `vault://${cleanObjectPath}`,
      gcsDownloadUrl: `/api/v1/storage/files/vault/${encodeURIComponent(cleanObjectPath)}`,
    };
  }

  /**
   * Generate a v4 cryptographically signed URL for direct client-to-GCS binary upload.
   * This offloads high-bandwidth file uploads (APKs, videos, large spreadsheets) from the API server.
   */
  async generateSignedUploadUrl(
    objectPath: string,
    mimeType: string = 'application/octet-stream',
    expiresInMinutes: number = 15,
  ): Promise<SignedUploadUrlResult> {
    const bucket = this.getBucket();
    const cleanObjectPath = objectPath.replace(/^\/+/, '');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    if (bucket) {
      try {
        const file = bucket.file(cleanObjectPath);
        const [uploadUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + expiresInMinutes * 60 * 1000,
          contentType: mimeType,
        });

        const gcsPath = `gs://${bucket.name}/${cleanObjectPath}`;
        this.logger.log(`🔑 Generated signed upload URL for ${gcsPath} (valid for ${expiresInMinutes}m)`);

        return {
          uploadUrl,
          gcsPath,
          objectPath: cleanObjectPath,
          expiresAt,
        };
      } catch (err) {
        this.logger.warn(`Could not generate signed upload URL, using API fallback proxy:`, err);
      }
    }

    // Fallback direct upload endpoint
    return {
      uploadUrl: `/api/v1/storage/upload`,
      gcsPath: `vault://${cleanObjectPath}`,
      objectPath: cleanObjectPath,
      expiresAt,
    };
  }

  /**
   * Generate a v4 cryptographically signed URL for secure, time-limited file download.
   */
  async generateSignedDownloadUrl(
    objectPath: string,
    fileName?: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    const bucket = this.getBucket();
    const cleanObjectPath = objectPath.replace(/^\/+/, '').replace(/^gs:\/\/[^/]+\//, '');

    if (bucket) {
      try {
        const file = bucket.file(cleanObjectPath);
        const [downloadUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + expiresInMinutes * 60 * 1000,
          promptSaveAs: fileName || undefined,
        });
        return downloadUrl;
      } catch (err) {
        this.logger.warn(`Could not generate signed download URL for ${cleanObjectPath}:`, err);
      }
    }

    return `/api/v1/storage/download/${encodeURIComponent(cleanObjectPath)}`;
  }

  /**
   * Get a readable stream for high-performance chunked file streaming.
   */
  async getReadStream(objectPath: string): Promise<Readable | null> {
    const bucket = this.getBucket();
    const cleanObjectPath = objectPath.replace(/^\/+/, '').replace(/^gs:\/\/[^/]+\//, '');

    if (bucket) {
      try {
        const file = bucket.file(cleanObjectPath);
        const [exists] = await file.exists();
        if (exists) {
          return file.createReadStream();
        }
      } catch (err) {
        this.logger.warn(`Could not create read stream from Cloud Storage for ${cleanObjectPath}:`, err);
      }
    }

    // Check local vault
    const localTarget = path.join(this.localVaultBasePath, cleanObjectPath);
    if (fs.existsSync(localTarget)) {
      return fs.createReadStream(localTarget);
    }

    return null;
  }

  /**
   * Delete an object from Google Cloud Storage.
   */
  async deleteObject(objectPath: string): Promise<boolean> {
    const bucket = this.getBucket();
    const cleanObjectPath = objectPath.replace(/^\/+/, '').replace(/^gs:\/\/[^/]+\//, '');

    if (bucket) {
      try {
        const file = bucket.file(cleanObjectPath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          this.logger.log(`🗑️ Deleted Cloud Storage object: ${cleanObjectPath}`);
          return true;
        }
      } catch (err) {
        this.logger.warn(`Failed to delete Cloud Storage object ${cleanObjectPath}:`, err);
      }
    }

    // Delete local vault copy if present
    const localTarget = path.join(this.localVaultBasePath, cleanObjectPath);
    if (fs.existsSync(localTarget)) {
      try {
        fs.unlinkSync(localTarget);
        return true;
      } catch {}
    }

    return false;
  }
}

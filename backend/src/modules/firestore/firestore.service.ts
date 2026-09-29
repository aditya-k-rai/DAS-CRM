import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';
import { FirestoreConnectionStatus } from './firestore.interface';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreService.name);
  private firebaseApp: App | null = null;
  private firestoreInstance: Firestore | null = null;
  private storageBucketInstance: any = null;
  private isConnected = false;
  private authType: 'SERVICE_ACCOUNT' | 'FIREBASE_ENV' | 'EMULATOR' | 'LOCAL_CACHE' = 'LOCAL_CACHE';
  private projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'das-crm0';
  private clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  private bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'das-crm0.firebasestorage.app';

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      // 1. Check if Firebase is already initialized
      const apps = getApps();
      if (apps.length > 0) {
        this.firebaseApp = apps[0];
        this.firestoreInstance = getFirestore(this.firebaseApp);
        try {
          this.storageBucketInstance = getStorage(this.firebaseApp).bucket(this.bucketName);
        } catch {
          // storage bucket optional
        }
        this.isConnected = true;
        this.logger.log('✅ Connected to existing Firebase Admin instance');
        return;
      }

      // 2. Check Service Account Key JSON file
      const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || 'service-account.json';
      const keyFilePath = path.isAbsolute(keyFile) ? keyFile : path.resolve(process.cwd(), keyFile);

      if (fs.existsSync(keyFilePath)) {
        const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
        this.projectId = keyData.project_id || this.projectId;
        this.clientEmail = keyData.client_email || this.clientEmail;

        this.firebaseApp = initializeApp({
          credential: cert(keyData),
          projectId: this.projectId,
          storageBucket: this.bucketName,
        });

        this.firestoreInstance = getFirestore(this.firebaseApp);
        try {
          this.storageBucketInstance = getStorage(this.firebaseApp).bucket(this.bucketName);
        } catch {
          // storage bucket optional
        }
        this.isConnected = true;
        this.authType = 'SERVICE_ACCOUNT';
        this.logger.log(`✅ Google Firestore initialized via Service Account JSON (${this.clientEmail})`);
        return;
      }

      // 3. Check Environment Variables for Service Account
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      if (this.clientEmail && privateKey) {
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId: this.projectId,
            clientEmail: this.clientEmail,
            privateKey: privateKey,
          }),
          projectId: this.projectId,
          storageBucket: this.bucketName,
        });

        this.firestoreInstance = getFirestore(this.firebaseApp);
        try {
          this.storageBucketInstance = getStorage(this.firebaseApp).bucket(this.bucketName);
        } catch {
          // storage bucket optional
        }
        this.isConnected = true;
        this.authType = 'FIREBASE_ENV';
        this.logger.log(`✅ Google Firestore initialized via Environment Variables (${this.clientEmail})`);
        return;
      }

      // 4. Default Application Credentials (GCP environment)
      try {
        this.firebaseApp = initializeApp({
          projectId: this.projectId,
          storageBucket: this.bucketName,
        });
        this.firestoreInstance = getFirestore(this.firebaseApp);
        try {
          this.storageBucketInstance = getStorage(this.firebaseApp).bucket(this.bucketName);
        } catch {
          // storage bucket optional
        }
        this.isConnected = true;
        this.authType = 'FIREBASE_ENV';
        this.logger.log(`✅ Google Firestore initialized via Default Application Credentials`);
        return;
      } catch (appDefaultErr) {
        this.logger.debug('Default application credentials not found:', appDefaultErr);
      }

      // 5. Fallback to Local Vault mode
      this.authType = 'LOCAL_CACHE';
      this.isConnected = false;
      this.logger.warn('⚠️ Google Firestore operating in Local High-Speed Cache Vault Mode.');
    } catch (err) {
      this.authType = 'LOCAL_CACHE';
      this.isConnected = false;
      this.logger.error('Firebase Initialization Exception:', err);
    }
  }

  getFirestore(): Firestore | null {
    return this.firestoreInstance;
  }

  getStorageBucket(): any {
    return this.storageBucketInstance;
  }

  isFirestoreConnected(): boolean {
    return this.isConnected && !!this.firestoreInstance;
  }

  getStatus(): FirestoreConnectionStatus {
    return {
      connected: this.isFirestoreConnected(),
      authType: this.authType,
      projectId: this.projectId,
      serviceAccountEmail: this.clientEmail || 'das-crm-drive@das-crm-506400.iam.gserviceaccount.com',
      storageBucket: this.bucketName,
      firestoreCollection: 'files',
      totalIndexedFiles: 0,
      activeCategories: ['EMPLOYEES', 'LEADS', 'QUOTATIONS', 'PRODUCTS', 'PROFILES', 'DOCUMENTS'],
      message: this.isFirestoreConnected()
        ? `Connected to Google Cloud Firestore (${this.authType}: ${this.projectId}). Realtime file metadata indexing active.`
        : 'Google Firestore operating in Local Vault Cache Mode. Ready for credentials to enable direct cloud sync.',
    };
  }
}

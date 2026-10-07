import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { FirestoreStorageService } from './firestore-storage.service';
import { CloudStorageService } from './cloud-storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [FirestoreService, FirestoreStorageService, CloudStorageService],
  exports: [FirestoreService, FirestoreStorageService, CloudStorageService],
})
export class FirestoreModule {}

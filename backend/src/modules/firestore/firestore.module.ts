import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { FirestoreStorageService } from './firestore-storage.service';
import { CloudStorageService } from './cloud-storage.service';

@Global()
@Module({
  providers: [FirestoreService, FirestoreStorageService, CloudStorageService],
  exports: [FirestoreService, FirestoreStorageService, CloudStorageService],
})
export class FirestoreModule {}

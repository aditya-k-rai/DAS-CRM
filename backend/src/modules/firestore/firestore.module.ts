import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { FirestoreStorageService } from './firestore-storage.service';

@Global()
@Module({
  providers: [FirestoreService, FirestoreStorageService],
  exports: [FirestoreService, FirestoreStorageService],
})
export class FirestoreModule {}

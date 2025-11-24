/**
 * StorageModule
 *
 * Module providing S3 storage services
 */

import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class StorageModule {}

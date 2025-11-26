import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { StorageModule } from '../storage/storage.module';

/**
 * VideoModule
 *
 * Handles video upload operations including presigned URL generation
 * for direct browser-to-S3 uploads.
 */
@Module({
  imports: [StorageModule],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}

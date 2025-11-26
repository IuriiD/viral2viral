import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { StorageModule } from '../storage/storage.module';

/**
 * GenerationModule handles video generation operations
 */
@Module({
  imports: [StorageModule],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}

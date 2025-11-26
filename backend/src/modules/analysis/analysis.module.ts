import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { StorageModule } from '../storage/storage.module';

/**
 * AnalysisModule
 *
 * Handles video analysis operations using Google Gemini AI.
 * Provides endpoints for triggering analysis, checking status,
 * and updating user-edited analysis results.
 */
@Module({
  imports: [StorageModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}

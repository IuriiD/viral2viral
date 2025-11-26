/**
 * AppModule
 *
 * Root application module that imports all feature modules.
 */

import { Module, Global } from '@nestjs/common';
import { StorageModule } from './modules/storage/storage.module';
import { VideoModule } from './modules/video/video.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ProductModule } from './modules/product/product.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { GenerationModule } from './modules/generation/generation.module';
import { SessionService } from './common/session.service';

@Global()
@Module({
  imports: [
    StorageModule,
    VideoModule,
    AnalysisModule,
    SessionsModule,
    ProductModule,
    PromptModule,
    GenerationModule,
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class AppModule {}

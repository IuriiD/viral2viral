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
import { SessionService } from './common/session.service';

@Global()
@Module({
  imports: [
    StorageModule,
    VideoModule,
    AnalysisModule,
    SessionsModule,
    ProductModule,
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class AppModule {}

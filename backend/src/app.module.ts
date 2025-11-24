/**
 * AppModule
 *
 * Root application module that imports all feature modules.
 */

import { Module } from '@nestjs/common';
import { StorageModule } from './modules/storage/storage.module';
import { SessionService } from './common/session.service';

@Module({
  imports: [StorageModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class AppModule {}

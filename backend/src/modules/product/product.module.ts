import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { StorageModule } from '../storage/storage.module';
import * as multer from 'multer';

/**
 * ProductModule handles product information management
 */
@Module({
  imports: [
    StorageModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

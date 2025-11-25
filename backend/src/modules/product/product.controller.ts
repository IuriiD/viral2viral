import {
  Controller,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { SubmitProductInfoRequestDto } from './dto/submit-product-info-request.dto';
import { SubmitProductInfoResponseDto } from './dto/submit-product-info-response.dto';
import { UploadProductImageRequestDto } from './dto/upload-product-image-request.dto';
import { UploadProductImageResponseDto } from './dto/upload-product-image-response.dto';

/**
 * ProductController handles product information endpoints
 */
@Controller('sessions/:sessionId/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Submit product information (name and description)
   * POST /sessions/:sessionId/product
   */
  @Post()
  async submitProductInfo(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitProductInfoRequestDto,
  ): Promise<SubmitProductInfoResponseDto> {
    return this.productService.submitProductInfo(sessionId, dto);
  }

  /**
   * Get presigned upload URL for product image
   * POST /sessions/:sessionId/product/image/upload-url
   */
  @Post('image/upload-url')
  async getProductImageUploadUrl(
    @Param('sessionId') sessionId: string,
    @Body() dto: UploadProductImageRequestDto,
  ): Promise<UploadProductImageResponseDto> {
    return this.productService.generateProductImageUploadUrl(sessionId, dto);
  }

  /**
   * Direct upload of product image (bypasses S3 CORS)
   * POST /sessions/:sessionId/product/image/upload
   */
  @Post('image/upload')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only PNG, JPEG, and WebP are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadProductImage(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.productService.uploadProductImageDirect(sessionId, file);

    return {
      success: true,
      message: 'Product image uploaded successfully',
    };
  }
}

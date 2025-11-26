import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SessionService } from '../../common/session.service';
import { S3Service } from '../storage/s3.service';
import { SubmitProductInfoRequestDto } from './dto/submit-product-info-request.dto';
import { SubmitProductInfoResponseDto } from './dto/submit-product-info-response.dto';
import { UploadProductImageRequestDto } from './dto/upload-product-image-request.dto';
import { UploadProductImageResponseDto } from './dto/upload-product-image-response.dto';
import { SessionStatus } from '../../common/types/session.types';

/**
 * ProductService handles product information submission and image uploads
 */
@Injectable()
export class ProductService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Submit product information and store in session
   * @param sessionId - Session UUID
   * @param dto - Product information (name and description)
   * @returns Confirmation with updated session status
   */
  async submitProductInfo(
    sessionId: string,
    dto: SubmitProductInfoRequestDto,
  ): Promise<SubmitProductInfoResponseDto> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Update session with product information
    const updatedSession = this.sessionService.updateSession(sessionId, {
      productInformation: {
        productName: dto.productName,
        productDescription: dto.productDescription,
        addedAt: new Date(),
      },
      status: SessionStatus.PRODUCT_INFO_ADDED,
    });

    if (!updatedSession) {
      throw new NotFoundException(`Failed to update session ${sessionId}`);
    }

    return {
      sessionId,
      productName: dto.productName,
      productDescription: dto.productDescription,
      status: updatedSession.status,
    };
  }

  /**
   * Generate presigned upload URL for product image
   * @param sessionId - Session UUID
   * @param dto - Image upload request details
   * @returns Presigned upload URL and fields
   */
  async generateProductImageUploadUrl(
    sessionId: string,
    dto: UploadProductImageRequestDto,
  ): Promise<UploadProductImageResponseDto> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Validate product info has been added
    if (!session.productInformation) {
      throw new BadRequestException(
        'Product information must be submitted before uploading image',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (dto.fileSize > maxSize) {
      throw new BadRequestException(
        `Image file size exceeds maximum of 10MB. Received: ${dto.fileSize} bytes`,
      );
    }

    // Validate MIME type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(dto.mimeType)) {
      throw new BadRequestException(
        `Invalid image format. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    // Generate S3 key for product image
    const fileExtension = dto.mimeType.split('/')[1];
    const s3Key = `sessions/${sessionId}/product-image.${fileExtension}`;

    // Generate presigned POST URL
    const presignedData = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      dto.mimeType,
    );

    // Update session with image metadata (will be updated after actual upload)
    this.sessionService.updateSession(sessionId, {
      productInformation: {
        ...session.productInformation,
        productImageS3Key: s3Key,
        productImageMimeType: dto.mimeType,
      },
    });

    return {
      success: true,
      data: {
        uploadUrl: presignedData.uploadUrl,
        uploadFields: presignedData.uploadFields,
        s3Key: presignedData.s3Key,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
      },
    };
  }

  /**
   * Upload product image directly (bypasses S3 CORS)
   * @param sessionId - Session UUID
   * @param file - Uploaded file from multer
   */
  async uploadProductImageDirect(
    sessionId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Validate product info has been added
    if (!session.productInformation) {
      throw new BadRequestException(
        'Product information must be submitted before uploading image',
      );
    }

    // Generate S3 key for product image
    const fileExtension = file.mimetype.split('/')[1];
    const s3Key = `sessions/${sessionId}/product-image.${fileExtension}`;

    // Upload directly to S3
    await this.s3Service.uploadBuffer(s3Key, file.buffer, file.mimetype);

    // Update session with image metadata
    this.sessionService.updateSession(sessionId, {
      productInformation: {
        ...session.productInformation,
        productImageS3Key: s3Key,
        productImageMimeType: file.mimetype,
      },
    });
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from '../storage/s3.service';
import { SessionService } from '../../common/session.service';
import { SessionStatus } from '../../common/types/session.types';

/**
 * VideoService
 *
 * Handles video upload operations including presigned URL generation
 * for direct browser-to-S3 uploads.
 */
@Injectable()
export class VideoService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Generate presigned upload URL for video file
   * @param sessionId - Session identifier
   * @param fileName - Original filename
   * @param fileSize - File size in bytes
   * @param mimeType - MIME type of the video
   * @returns Presigned upload URL with form fields and S3 key
   */
  async generateUploadUrl(
    sessionId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
  ): Promise<{
    uploadUrl: string;
    uploadFields: Record<string, string>;
    s3Key: string;
  }> {
    // Validate session exists
    const session = this.sessionService.getSession(sessionId);
    console.log('Looking up session:', sessionId);
    console.log('Session found:', session ? 'yes' : 'no');
    console.log(
      'All sessions:',
      this.sessionService.getAllSessions().map((s) => s.sessionId),
    );
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Validate file size
    if (fileSize > 104857600) {
      throw new BadRequestException('Video file exceeds maximum size of 100MB');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid video format. Allowed formats: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Generate S3 key with session ID prefix
    const fileExtension = this.getFileExtension(fileName);
    const s3Key = `sessions/${sessionId}/original${fileExtension}`;

    // Generate presigned POST URL
    const {
      uploadUrl,
      uploadFields,
      s3Key: returnedKey,
    } = await this.s3Service.generatePresignedUploadUrl(s3Key, mimeType);

    // Update session with video metadata (not yet uploaded)
    this.sessionService.updateSession(sessionId, {
      originalVideo: {
        s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET!,
        fileName,
        fileSize,
        mimeType,
        uploadedAt: new Date(),
      },
      status: SessionStatus.VIDEO_UPLOADED,
    });

    return {
      uploadUrl,
      uploadFields,
      s3Key,
    };
  }

  /**
   * Upload video file directly to S3 through backend
   * @param sessionId - Session identifier
   * @param buffer - File buffer
   * @param fileName - Original filename
   * @param fileSize - File size in bytes
   * @param mimeType - MIME type of the video
   * @returns S3 key of uploaded file
   */
  async uploadVideo(
    sessionId: string,
    buffer: Buffer,
    fileName: string,
    fileSize: number,
    mimeType: string,
  ): Promise<{ s3Key: string }> {
    // Validate session exists
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Validate file size
    if (fileSize > 104857600) {
      throw new BadRequestException('Video file exceeds maximum size of 100MB');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid video format. Allowed formats: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Generate S3 key with session ID prefix
    const fileExtension = this.getFileExtension(fileName);
    const s3Key = `sessions/${sessionId}/original${fileExtension}`;

    // Upload to S3
    await this.s3Service.uploadBuffer(s3Key, buffer, mimeType);

    // Update session with video metadata
    this.sessionService.updateSession(sessionId, {
      originalVideo: {
        s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET!,
        fileName,
        fileSize,
        mimeType,
        uploadedAt: new Date(),
      },
      status: SessionStatus.VIDEO_UPLOADED,
    });

    return { s3Key };
  }

  /**
   * Extract file extension from filename
   * @param fileName - Original filename
   * @returns File extension with leading dot
   */
  private getFileExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.substring(dotIndex) : '';
  }
}

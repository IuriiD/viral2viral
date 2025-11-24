/**
 * S3Service
 *
 * AWS S3 operations for file storage, presigned URLs, and downloads.
 * Handles video and image uploads/downloads using AWS SDK v3.
 */

import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { loadConfiguration } from '../../config/configuration';

/**
 * Presigned POST URL response structure
 */
export interface PresignedPostUrl {
  uploadUrl: string;
  uploadFields: Record<string, string>;
  s3Key: string;
}

/**
 * S3Service provides AWS S3 operations
 */
@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const config = loadConfiguration();

    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });

    this.bucketName = config.aws.s3Bucket;
  }

  /**
   * Generate presigned POST URL for direct browser upload
   * @param key - S3 object key
   * @param contentType - File MIME type
   * @param maxSizeBytes - Maximum file size in bytes
   * @returns Presigned POST URL and fields
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
  ): Promise<PresignedPostUrl> {
    // For direct uploads, we'll use presigned PUT URLs (simpler than POST)
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      uploadUrl,
      uploadFields: {
        'Content-Type': contentType,
      },
      s3Key: key,
    };
  }

  /**
   * Generate presigned GET URL for downloading files
   * @param key - S3 object key
   * @param expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns Presigned download URL
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Upload buffer directly to S3 (for server-generated content)
   * @param key - S3 object key
   * @param buffer - File buffer
   * @param contentType - File MIME type
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Download file from S3 as buffer
   * @param key - S3 object key
   * @returns File buffer
   */
  async downloadBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body;

    if (!stream) {
      throw new Error('No data received from S3');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Check if object exists in S3
   * @param key - S3 object key
   * @returns True if exists, false otherwise
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get object metadata
   * @param key - S3 object key
   * @returns Object metadata including size and content type
   */
  async getObjectMetadata(
    key: string,
  ): Promise<{ size: number; contentType: string }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }

  /**
   * Generate S3 key for session video
   * @param sessionId - Session UUID
   * @param fileName - Original filename
   * @returns S3 key path
   */
  generateVideoKey(sessionId: string, fileName: string): string {
    const extension = fileName.split('.').pop() || 'mp4';
    return `sessions/${sessionId}/original.${extension}`;
  }

  /**
   * Generate S3 key for product image
   * @param sessionId - Session UUID
   * @param fileName - Original filename
   * @returns S3 key path
   */
  generateProductImageKey(sessionId: string, fileName: string): string {
    const extension = fileName.split('.').pop() || 'png';
    return `sessions/${sessionId}/product.${extension}`;
  }

  /**
   * Generate S3 key for generated video
   * @param sessionId - Session UUID
   * @returns S3 key path
   */
  generateGeneratedVideoKey(sessionId: string): string {
    return `sessions/${sessionId}/generated.mp4`;
  }
}

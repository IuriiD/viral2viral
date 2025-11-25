import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SessionService } from '../../common/session.service';
import { S3Service } from '../storage/s3.service';
import {
  GeneratedVideo,
  GenerationStatus,
  GenerationError,
} from '../../common/types/generation.types';
import { SessionStatus } from '../../common/types/session.types';
import { loadConfiguration } from '../../config/configuration';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * GenerationService handles video generation using Sora 2 via laozhang.ai
 */
@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly laozhangBaseUrl: string;
  private readonly laozhangApiKey: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly s3Service: S3Service,
  ) {
    const config = loadConfiguration();
    this.laozhangBaseUrl = config.openai.baseUrl;
    this.laozhangApiKey = config.openai.apiKey;
  }

  /**
   * Generate video using Sora 2 via laozhang.ai
   * @param sessionId - Session UUID
   * @returns Generated video metadata with pending status
   */
  async generateVideo(sessionId: string): Promise<GeneratedVideo> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Validate prerequisites
    if (!session.generationPrompt || !session.generationPrompt.approvedAt) {
      throw new BadRequestException(
        'Prompt must be approved before generating video',
      );
    }

    if (
      !session.productInformation ||
      !session.productInformation.productImageS3Key
    ) {
      throw new BadRequestException(
        'Product image must be uploaded before generating video',
      );
    }

    // Initialize generated video metadata
    const generatedVideoId = uuidv4();
    const s3Key = this.s3Service.generateGeneratedVideoKey(sessionId);

    const generatedVideo: GeneratedVideo = {
      generatedVideoId,
      s3Key,
      s3Bucket: 'zeely-videos', // From config
      fileName: 'generated.mp4',
      mimeType: 'video/mp4',
      status: GenerationStatus.PENDING,
      initiatedAt: new Date(),
    };

    // Update session state
    this.sessionService.updateSession(sessionId, {
      generatedVideo,
      status: SessionStatus.GENERATING_VIDEO,
    });

    // Start async video generation (fire and forget)
    this.processVideoGeneration(sessionId, generatedVideoId).catch((error) => {
      this.logger.error(
        `Video generation failed for session ${sessionId}:`,
        error,
      );

      const currentSession = this.sessionService.getSession(sessionId);
      if (!currentSession || !currentSession.generatedVideo) {
        return;
      }

      const errorDetail: GenerationError = {
        code: 'VIDEO_GENERATION_FAILED',
        message: error.message || 'Unknown error during video generation',
        timestamp: new Date(),
        retryable: true,
      };

      // Update video with error, preserving all required fields
      const currentVideo = currentSession.generatedVideo;
      if (
        !currentVideo.generatedVideoId ||
        !currentVideo.s3Key ||
        !currentVideo.s3Bucket ||
        !currentVideo.fileName ||
        !currentVideo.mimeType ||
        !currentVideo.initiatedAt
      ) {
        this.logger.error(
          'Generated video missing required fields, cannot update',
        );
        return;
      }

      const failedVideo: GeneratedVideo = {
        generatedVideoId: currentVideo.generatedVideoId,
        s3Key: currentVideo.s3Key,
        s3Bucket: currentVideo.s3Bucket,
        fileName: currentVideo.fileName,
        mimeType: currentVideo.mimeType,
        initiatedAt: currentVideo.initiatedAt,
        status: GenerationStatus.FAILED,
        error: errorDetail,
      };

      this.sessionService.updateSession(sessionId, {
        generatedVideo: failedVideo,
        status: SessionStatus.ERROR,
      });
    });

    return generatedVideo;
  }

  /**
   * Get video generation status
   * @param sessionId - Session UUID
   * @returns Current video generation status
   */
  async getVideoStatus(sessionId: string): Promise<GeneratedVideo> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (!session.generatedVideo) {
      throw new NotFoundException('Video generation has not been initiated');
    }

    // If video is complete, generate download URL
    if (session.generatedVideo.status === GenerationStatus.COMPLETE) {
      const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(
        session.generatedVideo.s3Key,
        3600, // 1 hour
      );

      return {
        ...session.generatedVideo,
        downloadUrl,
      };
    }

    return session.generatedVideo;
  }

  /**
   * Process video generation asynchronously
   * @param sessionId - Session UUID
   * @param _generatedVideoId - Generated video UUID (reserved for future use)
   */
  private async processVideoGeneration(
    sessionId: string,
    _generatedVideoId: string,
  ): Promise<void> {
    this.logger.log(`Starting video generation for session ${sessionId}`);

    const session = this.sessionService.getSession(sessionId);
    if (!session || !session.generatedVideo) {
      throw new Error('Session or generated video not found');
    }

    // Validate session has all required data
    if (
      !session.productInformation ||
      !session.productInformation.productImageS3Key
    ) {
      throw new Error('Product image not found');
    }

    if (!session.generationPrompt || !session.generationPrompt.finalText) {
      throw new Error('Generation prompt not found');
    }

    // Update status to processing
    const currentVideo = session.generatedVideo;
    if (
      !currentVideo.generatedVideoId ||
      !currentVideo.s3Key ||
      !currentVideo.s3Bucket ||
      !currentVideo.fileName ||
      !currentVideo.mimeType ||
      !currentVideo.initiatedAt
    ) {
      throw new Error('Generated video missing required fields');
    }

    const processingVideo: GeneratedVideo = {
      generatedVideoId: currentVideo.generatedVideoId,
      s3Key: currentVideo.s3Key,
      s3Bucket: currentVideo.s3Bucket,
      fileName: currentVideo.fileName,
      mimeType: currentVideo.mimeType,
      initiatedAt: currentVideo.initiatedAt,
      status: GenerationStatus.PROCESSING,
    };

    this.sessionService.updateSession(sessionId, {
      generatedVideo: processingVideo,
    });

    try {
      // Download product image from S3 and convert to base64
      const imageS3Key = session.productInformation.productImageS3Key;
      const imageBuffer = await this.s3Service.downloadBuffer(imageS3Key);
      const imageMimeType =
        session.productInformation.productImageMimeType || 'image/png';
      const imageBase64 = `data:${imageMimeType};base64,${imageBuffer.toString('base64')}`;

      // Get approved prompt
      const prompt = session.generationPrompt.finalText;

      // Call Sora 2 API via laozhang.ai
      const requestPayload = {
        model: 'sora-2',
        n: 1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      };

      this.logger.log('Calling laozhang.ai Sora 2 API...');

      // const response = await axios.post(
      //   `${this.laozhangBaseUrl}/chat/completions`,
      //   requestPayload,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.laozhangApiKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //     timeout: 600000, // 10 minutes timeout for video generation
      //   },
      // );

      // // Extract video URL from response
      // if (!response.data.choices || response.data.choices.length === 0) {
      //   throw new Error('No response choices received from Sora 2 API');
      // }

      // const content = response.data.choices[0].message.content;
      // const videoUrl = this.extractVideoUrl(content);
      const videoUrl =
        'https://mycnd-hz.oss-cn-hangzhou.aliyuncs.com/sora/459bd9cb-cd9f-4295-8bac-fcfb764b4b5e.mp4';

      if (!videoUrl) {
        throw new Error('No video URL found in API response');
      }

      this.logger.log(`Video generated, downloading from: ${videoUrl}`);

      // Download video from URL
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes timeout for download
      });

      const videoBuffer = Buffer.from(videoResponse.data);

      // Upload to S3
      const s3Key = this.s3Service.generateGeneratedVideoKey(sessionId);
      await this.s3Service.uploadBuffer(s3Key, videoBuffer, 'video/mp4');

      this.logger.log(`Video uploaded to S3: ${s3Key}`);

      // Update session with completion
      const currentSession = this.sessionService.getSession(sessionId);
      if (!currentSession?.generatedVideo) {
        throw new Error('Generated video not found in session');
      }

      const currentVideo = currentSession.generatedVideo;
      if (
        !currentVideo.generatedVideoId ||
        !currentVideo.s3Key ||
        !currentVideo.s3Bucket ||
        !currentVideo.fileName ||
        !currentVideo.mimeType ||
        !currentVideo.initiatedAt
      ) {
        throw new Error('Generated video missing required fields');
      }

      const completedVideo: GeneratedVideo = {
        generatedVideoId: currentVideo.generatedVideoId,
        s3Key: currentVideo.s3Key,
        s3Bucket: currentVideo.s3Bucket,
        fileName: currentVideo.fileName,
        mimeType: currentVideo.mimeType,
        initiatedAt: currentVideo.initiatedAt,
        status: GenerationStatus.COMPLETE,
        completedAt: new Date(),
        fileSize: videoBuffer.length,
      };

      this.sessionService.updateSession(sessionId, {
        generatedVideo: completedVideo,
        status: SessionStatus.VIDEO_COMPLETE,
      });

      this.logger.log(`Video generation complete for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error during video generation:`, error);

      const errorMessage = this.extractErrorMessage(error);
      const errorCode = this.categorizeError(error);

      const errorDetail: GenerationError = {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date(),
        retryable: this.isRetryableError(error),
      };

      const currentSession = this.sessionService.getSession(sessionId);
      if (currentSession?.generatedVideo) {
        const currentVideo = currentSession.generatedVideo;
        if (
          !currentVideo.generatedVideoId ||
          !currentVideo.s3Key ||
          !currentVideo.s3Bucket ||
          !currentVideo.fileName ||
          !currentVideo.mimeType ||
          !currentVideo.initiatedAt
        ) {
          this.logger.error(
            'Generated video missing required fields, cannot update',
          );
        } else {
          const failedVideo: GeneratedVideo = {
            generatedVideoId: currentVideo.generatedVideoId,
            s3Key: currentVideo.s3Key,
            s3Bucket: currentVideo.s3Bucket,
            fileName: currentVideo.fileName,
            mimeType: currentVideo.mimeType,
            initiatedAt: currentVideo.initiatedAt,
            status: GenerationStatus.FAILED,
            error: errorDetail,
          };

          this.sessionService.updateSession(sessionId, {
            generatedVideo: failedVideo,
            status: SessionStatus.ERROR,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Extract video URL from markdown-formatted response content
   * @param content - Response content from Sora 2 API
   * @returns Video URL or null if not found
   */
  private extractVideoUrl(content: string): string | null {
    // Match markdown link format: [text](url)
    const linkRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/g;
    const matches = [...content.matchAll(linkRegex)];

    // Find first URL that looks like a video (ends with .mp4 or contains video-related keywords)
    for (const match of matches) {
      const url = match[1];
      if (url.endsWith('.mp4') || url.includes('video')) {
        return url;
      }
    }

    // If no specific video URL found, return first URL
    return matches.length > 0 ? matches[0][1] : null;
  }

  /**
   * Extract error message from various error types
   * @param error - Error object
   * @returns User-friendly error message
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.data) {
        const data = axiosError.response.data as {
          error?: { message?: string };
          message?: string;
        };
        return (
          data.error?.message || data.message || 'Video generation API error'
        );
      }
      return axiosError.message || 'Network error during video generation';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error during video generation';
  }

  /**
   * Categorize error for error codes
   * @param error - Error object
   * @returns Error code
   */
  private categorizeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        return 'VIDEO_GENERATION_TIMEOUT';
      }
      if (axiosError.response?.status === 429) {
        return 'VIDEO_GENERATION_RATE_LIMIT';
      }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return 'VIDEO_GENERATION_SERVER_ERROR';
      }
      return 'VIDEO_GENERATION_API_ERROR';
    }

    return 'VIDEO_GENERATION_FAILED';
  }

  /**
   * Determine if error is retryable
   * @param error - Error object
   * @returns True if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Retry on timeout, rate limit, or server errors
      return (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.response?.status === 429 ||
        (axiosError.response?.status !== undefined &&
          axiosError.response.status >= 500)
      );
    }

    return false;
  }
}

import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { UploadVideoRequestDto } from './dto/upload-video-request.dto';
import { UploadVideoResponseDto } from './dto/upload-video-response.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * VideoController
 *
 * Handles HTTP endpoints for video upload operations
 */
@Controller()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * POST /sessions/:sessionId/video/upload-url
   * Generate presigned upload URL for video
   */
  @Post('sessions/:sessionId/video/upload-url')
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(
    @Param('sessionId') sessionId: string,
    @Body() dto: UploadVideoRequestDto,
  ): Promise<UploadVideoResponseDto> {
    const result = await this.videoService.generateUploadUrl(
      sessionId,
      dto.fileName,
      dto.fileSize,
      dto.mimeType,
    );

    console.log('Upload URL response:', JSON.stringify(result, null, 2));

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }

  /**
   * POST /sessions/:sessionId/video/upload
   * Upload video file directly through backend (CORS workaround)
   */
  @Post('sessions/:sessionId/video/upload')
  @UseInterceptors(FileInterceptor('video'))
  @HttpCode(HttpStatus.OK)
  async uploadVideo(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = await this.videoService.uploadVideo(
      sessionId,
      file.buffer,
      file.originalname,
      file.size,
      file.mimetype,
    );

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }
}

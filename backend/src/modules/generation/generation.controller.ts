import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerateVideoResponseDto } from './dto/generate-video-response.dto';
import { GetVideoStatusResponseDto } from './dto/get-video-status-response.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * GenerationController handles video generation endpoints
 */
@Controller('sessions/:sessionId')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  /**
   * POST /sessions/:sessionId/generate
   * Generate video using Sora 2 with approved prompt and product image
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateVideo(
    @Param('sessionId') sessionId: string,
  ): Promise<GenerateVideoResponseDto> {
    const generatedVideo =
      await this.generationService.generateVideo(sessionId);

    return {
      success: true,
      data: generatedVideo,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${uuidv4()}`,
      },
    };
  }

  /**
   * GET /sessions/:sessionId/generate
   * Get video generation status and download URL when complete
   */
  @Get('generate')
  async getVideoStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<GetVideoStatusResponseDto> {
    const generatedVideo =
      await this.generationService.getVideoStatus(sessionId);

    return {
      success: true,
      data: generatedVideo,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${uuidv4()}`,
      },
    };
  }
}

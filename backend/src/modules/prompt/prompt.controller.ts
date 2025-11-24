/**
 * Prompt Controller
 *
 * Handles HTTP endpoints for text-to-video prompt generation,
 * editing, and approval.
 */

import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PromptService } from './prompt.service';
import { UpdatePromptRequestDto } from './dto/update-prompt-request.dto';
import { GeneratePromptResponseDto } from './dto/generate-prompt-response.dto';
import { UpdatePromptResponseDto } from './dto/update-prompt-response.dto';
import { ApprovePromptResponseDto } from './dto/approve-prompt-response.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * PromptController handles prompt generation and management endpoints
 * Base path: /sessions/:sessionId/prompt
 */
@Controller('sessions/:sessionId/prompt')
export class PromptController {
  private readonly logger = new Logger(PromptController.name);

  constructor(private readonly promptService: PromptService) {}

  /**
   * POST /sessions/:sessionId/prompt
   * Generate a text-to-video prompt from video analysis and product info
   *
   * @param sessionId - Session identifier
   * @returns Generated prompt with moderation status
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async generatePrompt(
    @Param('sessionId') sessionId: string,
  ): Promise<GeneratePromptResponseDto> {
    this.logger.log(`POST /sessions/${sessionId}/prompt`);

    const prompt = await this.promptService.generatePrompt(sessionId);

    return {
      success: true,
      data: prompt,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }

  /**
   * PATCH /sessions/:sessionId/prompt
   * Update prompt with user edits
   *
   * @param sessionId - Session identifier
   * @param dto - Request body with edited text
   * @returns Updated prompt with new moderation status
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  async updatePrompt(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdatePromptRequestDto,
  ): Promise<UpdatePromptResponseDto> {
    this.logger.log(`PATCH /sessions/${sessionId}/prompt`);

    const prompt = await this.promptService.updatePrompt(
      sessionId,
      dto.editedText,
    );

    return {
      success: true,
      data: prompt,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }

  /**
   * POST /sessions/:sessionId/prompt/approve
   * Approve prompt for video generation
   *
   * @param sessionId - Session identifier
   * @returns Approved prompt
   */
  @Post('approve')
  @HttpCode(HttpStatus.OK)
  async approvePrompt(
    @Param('sessionId') sessionId: string,
  ): Promise<ApprovePromptResponseDto> {
    this.logger.log(`POST /sessions/${sessionId}/prompt/approve`);

    const prompt = await this.promptService.approvePrompt(sessionId);

    return {
      success: true,
      data: prompt,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }
}

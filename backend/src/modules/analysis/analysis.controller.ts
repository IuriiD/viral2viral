import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { UpdateAnalysisRequestDto } from './dto/update-analysis-request.dto';
import { TriggerAnalysisResponseDto } from './dto/trigger-analysis-response.dto';
import { GetAnalysisResponseDto } from './dto/get-analysis-response.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * AnalysisController
 *
 * Handles HTTP endpoints for video analysis operations
 */
@Controller()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * POST /sessions/:sessionId/analysis
   * Trigger video analysis using Gemini
   */
  @Post('sessions/:sessionId/analysis')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerAnalysis(
    @Param('sessionId') sessionId: string,
  ): Promise<TriggerAnalysisResponseDto> {
    console.log(
      '[AnalysisController] Triggering analysis for session:',
      sessionId,
    );
    const result = await this.analysisService.analyzeVideo(sessionId);
    console.log('[AnalysisController] Analysis triggered, result:', result);

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
   * GET /sessions/:sessionId/analysis
   * Retrieve analysis results (for polling)
   */
  @Get('sessions/:sessionId/analysis')
  @HttpCode(HttpStatus.OK)
  async getAnalysis(
    @Param('sessionId') sessionId: string,
  ): Promise<GetAnalysisResponseDto> {
    const analysis = await this.analysisService.getAnalysisStatus(sessionId);

    return {
      success: true,
      data: analysis,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }

  /**
   * PATCH /sessions/:sessionId/analysis
   * Update analysis with user edits
   */
  @Patch('sessions/:sessionId/analysis')
  @HttpCode(HttpStatus.OK)
  async updateAnalysis(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateAnalysisRequestDto,
  ): Promise<GetAnalysisResponseDto> {
    const analysis = await this.analysisService.updateAnalysis(
      sessionId,
      dto.editedText,
    );

    return {
      success: true,
      data: analysis,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
  }
}

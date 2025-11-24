/**
 * Generate Prompt Response DTO
 *
 * Response for prompt generation endpoint
 */

import { GenerationPrompt } from '../../../common/types/prompt.types';

/**
 * Response for POST /sessions/:sessionId/prompt
 */
export interface GeneratePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

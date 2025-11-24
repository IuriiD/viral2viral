/**
 * Update Prompt Response DTO
 *
 * Response for prompt update endpoint
 */

import { GenerationPrompt } from '../../../common/types/prompt.types';

/**
 * Response for PATCH /sessions/:sessionId/prompt
 */
export interface UpdatePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

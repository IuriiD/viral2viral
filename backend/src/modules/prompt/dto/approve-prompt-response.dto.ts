/**
 * Approve Prompt Response DTO
 *
 * Response for prompt approval endpoint
 */

import { GenerationPrompt } from '../../../common/types/prompt.types';

/**
 * Response for POST /sessions/:sessionId/prompt/approve
 */
export interface ApprovePromptResponseDto {
  success: boolean;
  data: GenerationPrompt;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

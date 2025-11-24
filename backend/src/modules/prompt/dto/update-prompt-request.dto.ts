/**
 * Update Prompt Request DTO
 *
 * Validation for prompt update requests
 */

import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * Request body for PATCH /sessions/:sessionId/prompt
 */
export class UpdatePromptRequestDto {
  /**
   * User's edited prompt text
   * Must be between 1 and 5000 characters
   */
  @IsString()
  @IsNotEmpty({ message: 'Edited text is required' })
  @Length(1, 5000, {
    message: 'Prompt must be between 1 and 5000 characters',
  })
  editedText!: string;
}

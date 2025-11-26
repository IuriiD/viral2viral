/**
 * Prompt Module
 *
 * Handles text-to-video prompt generation, editing, and approval.
 */

import { Module } from '@nestjs/common';
import { PromptController } from './prompt.controller';
import { PromptService } from './prompt.service';

/**
 * PromptModule provides prompt generation and management functionality
 */
@Module({
  controllers: [PromptController],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}

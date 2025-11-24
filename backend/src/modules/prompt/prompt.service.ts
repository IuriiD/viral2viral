/**
 * Prompt Service
 *
 * Handles text-to-video prompt generation using GPT-5,
 * prompt updates, and basic content moderation.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { SessionService } from '../../common/session.service';
import {
  GenerationPrompt,
  ModerationStatus,
} from '../../common/types/prompt.types';
import { SessionStatus } from '../../common/types/session.types';

/**
 * PromptService generates and manages text-to-video prompts
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly httpClient: AxiosInstance;
  private readonly gptModel: string;

  // Basic moderation patterns (simple keyword matching for POC)
  private readonly moderationPatterns = [
    /\b(violence|violent|kill|death|blood|gore)\b/i,
    /\b(explicit|sexual|nude|nudity|porn)\b/i,
    /\b(hate|racist|discrimination|offensive)\b/i,
    /\b(illegal|drugs|weapon|bomb)\b/i,
  ];

  private readonly moderationCategories = [
    'violence',
    'sexual-content',
    'hate-speech',
    'illegal-content',
  ];

  constructor(private readonly sessionService: SessionService) {
    // Get OpenAI/laozhang.ai configuration from environment
    const apiKey = process.env.OPENAI_API_KEY || process.env.LAOZHANG_API_KEY;
    const baseUrl =
      process.env.OPENAI_API_BASE_URL ||
      process.env.LAOZHANG_API_BASE_URL ||
      'https://api.laozhang.ai/v1';
    this.gptModel = process.env.OPENAI_GPT_MODEL || 'gpt-5';

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY or LAOZHANG_API_KEY environment variable is required',
      );
    }

    // Initialize axios client for laozhang.ai API
    this.httpClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000, // 120 second timeout for GPT-5 (prompt generation can be slow)
    });
  }

  /**
   * Generate a text-to-video prompt using GPT-5
   * Combines video analysis and product information
   *
   * @param sessionId - The session ID
   * @returns Generated prompt with moderation status
   * @throws BadRequestException if session not ready or missing data
   */
  async generatePrompt(sessionId: string): Promise<GenerationPrompt> {
    this.logger.log(`Generating prompt for session ${sessionId}`);

    // Get session and validate state
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.videoAnalysis) {
      throw new BadRequestException(
        'Video analysis not complete. Please analyze video first.',
      );
    }

    if (!session.productInformation) {
      throw new BadRequestException(
        'Product information not provided. Please submit product details first.',
      );
    }

    if (session.videoAnalysis.status !== 'complete') {
      throw new BadRequestException(
        'Video analysis is not complete. Please wait for analysis to finish.',
      );
    }

    try {
      // Build prompt generation request
      const analysisText =
        session.videoAnalysis.userEdits || session.videoAnalysis.sceneBreakdown;
      const productName = session.productInformation.productName;
      const productDescription = session.productInformation.productDescription;

      const userMessage = `You are an expert AI video prompt engineer specializing in Sora 2. 
Below isn a detailed description of an existing viral UGC video which includes scene breakdown and Dialogue/voiceover.
${analysisText}

Your task is to analyze all the scenes and generate a single, detailed video generation prompt that Sora could use to recreate the 8-second video but tailored for a product ${productName} ${productDescription}.
Format as: "[Duration] seconds; [Camera style/lens]. [Subject + action]. Aesthetic: [visual style]. Camera movement: [specific movements]. Pacing: [fast/medium/slow with rhythm description]. Colors: [palette]. Audio: [music/sound style]. Text overlay: [if needed]. Dialogue: [original dialogue but adapted for [[PRODUCT_DESCRIPTION]]]. End with: [CTA visual and audio].

Please respond with a valid JSON object only with a key "prompt" containing the generated prompt.
The "prompt" value should be a complete, ready-to-use prompt for text-to-video generation, without any conversational filler.
`;

      // Call GPT-5 via laozhang.ai
      const response = await this.httpClient.post('/chat/completions', {
        model: this.gptModel,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedText =
        response.data.choices[0]?.message?.content?.trim() || '';

      if (!generatedText) {
        this.logger.error(
          `Empty response from GPT-5. Response data: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          'GPT-5 returned an empty response. This may be due to content filtering or API issues.',
        );
      }

      // Run basic moderation
      const moderation = this.moderateContent(generatedText);

      // Create prompt object
      const prompt: GenerationPrompt = {
        promptId: uuidv4(),
        generatedText: generatedText,
        finalText: generatedText,
        characterCount: generatedText.length,
        generatedAt: new Date(),
        moderationStatus: moderation.status,
        moderationFlags: moderation.flags,
      };

      // Update session
      session.generationPrompt = prompt;
      session.status = SessionStatus.PROMPT_GENERATED;
      session.lastActivityAt = new Date();
      this.sessionService.updateSession(sessionId, session);

      this.logger.log(
        `Prompt generated successfully for session ${sessionId} (${generatedText.length} chars)`,
      );

      return prompt;
    } catch (error) {
      this.logger.error(
        `Failed to generate prompt for session ${sessionId}`,
        error,
      );

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        if (
          error.code === 'ECONNABORTED' ||
          error.message.includes('timeout')
        ) {
          throw new BadRequestException(
            'Prompt generation timed out. The AI service is taking longer than expected. Please try again.',
          );
        } else if (status === 401) {
          throw new BadRequestException(
            'Invalid API key for prompt generation',
          );
        } else if (status === 429) {
          throw new BadRequestException(
            'Rate limit exceeded. Please try again later.',
          );
        } else {
          throw new BadRequestException(
            `Failed to generate prompt: ${message}`,
          );
        }
      }

      throw new BadRequestException(
        'Failed to generate prompt. Please try again.',
      );
    }
  }

  /**
   * Update an existing prompt with user edits
   *
   * @param sessionId - The session ID
   * @param editedText - User's edited prompt text
   * @returns Updated prompt
   * @throws BadRequestException if session not found or no prompt exists
   */
  async updatePrompt(
    sessionId: string,
    editedText: string,
  ): Promise<GenerationPrompt> {
    this.logger.log(`Updating prompt for session ${sessionId}`);

    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.generationPrompt) {
      throw new BadRequestException(
        'No prompt exists. Please generate a prompt first.',
      );
    }

    // Run moderation on edited text
    const moderation = this.moderateContent(editedText);

    // Update prompt
    session.generationPrompt.userEditedText = editedText;
    session.generationPrompt.finalText = editedText;
    session.generationPrompt.characterCount = editedText.length;
    session.generationPrompt.moderationStatus = moderation.status;
    session.generationPrompt.moderationFlags = moderation.flags;
    session.generationPrompt.approvedAt = undefined; // Reset approval if edited
    session.lastActivityAt = new Date();

    this.sessionService.updateSession(sessionId, session);

    this.logger.log(
      `Prompt updated for session ${sessionId} (${editedText.length} chars)`,
    );

    return session.generationPrompt;
  }

  /**
   * Approve a prompt for video generation
   *
   * @param sessionId - The session ID
   * @returns Approved prompt
   * @throws BadRequestException if session not found or no prompt exists
   */
  async approvePrompt(sessionId: string): Promise<GenerationPrompt> {
    this.logger.log(`Approving prompt for session ${sessionId}`);

    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.generationPrompt) {
      throw new BadRequestException(
        'No prompt exists. Please generate a prompt first.',
      );
    }

    // Mark as approved
    session.generationPrompt.approvedAt = new Date();

    // If flagged, mark as bypassed (user explicitly approved)
    if (
      session.generationPrompt.moderationStatus === ModerationStatus.FLAGGED
    ) {
      session.generationPrompt.moderationStatus = ModerationStatus.BYPASSED;
    } else if (
      session.generationPrompt.moderationStatus === ModerationStatus.PENDING
    ) {
      session.generationPrompt.moderationStatus = ModerationStatus.APPROVED;
    }

    session.lastActivityAt = new Date();
    this.sessionService.updateSession(sessionId, session);

    this.logger.log(`Prompt approved for session ${sessionId}`);

    return session.generationPrompt;
  }

  /**
   * Basic content moderation using keyword matching
   * This is a simple POC implementation - production would use a proper moderation API
   *
   * @param text - Text to moderate
   * @returns Moderation result with status and flags
   */
  private moderateContent(text: string): {
    status: ModerationStatus;
    flags: string[];
  } {
    const flags: string[] = [];

    // Check each pattern
    this.moderationPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        flags.push(this.moderationCategories[index]);
      }
    });

    const status =
      flags.length > 0 ? ModerationStatus.FLAGGED : ModerationStatus.PENDING;

    return { status, flags };
  }
}

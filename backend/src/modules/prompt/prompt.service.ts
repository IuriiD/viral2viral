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
import { loadConfiguration } from '../../config/configuration';

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
    // Get OpenAI/laozhang.ai configuration from centralized config
    const config = loadConfiguration();
    const apiKey = config.openai.apiKey;
    const baseUrl = config.openai.baseUrl;
    this.gptModel = config.openai.gptModel;

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

      // // Call GPT-5 via laozhang.ai
      // const response = await this.httpClient.post('/chat/completions', {
      //   model: this.gptModel,
      //   messages: [{ role: 'user', content: userMessage }],
      //   temperature: 0.7,
      //   max_tokens: 4000,
      // });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = {};
      response.data = {
        id: 'chatcmpl-CfVgjLYMX3CHZcKNsupj595S3k2r1',
        object: 'chat.completion',
        created: 1764009293,
        model: 'gpt-5-2025-08-07',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                '{\n  "prompt": "8 seconds; UGC smartphone realism, 35mm-equivalent prime lens, shallow depth of field, 4K, 24fps. Subject + action: A fast, clean UGC unboxing-to-testimonial sequence showcasing SuperBelly Mango Passion Fruit as an easy daily gut-support drink. Aesthetic: bright natural daylight, lifestyle product demo with authentic testimonial energy, minimal props, no distracting clutter.\\nCamera movement: Scene 1 (0:00–0:01.5) slight upward pan from inside an open mango-yellow shipping box to a matte mango-yellow SuperBelly pouch; Scene 2 (0:01.5–0:03.5) static medium shot on woman in a bright kitchen, hard cut to tight detail of scoop; Scene 3 (0:03.5–0:05.5) static medium close-up on man speaking; Scene 4 (0:05.5–0:08.0) medium close-up on man holding a clear shaker, hard cut to overhead product flat lay.\\nPacing: fast and upbeat with snappy hard cuts on the musical beat; quick intro hook, direct benefit line, punchy CTA finish.\\nColors: mango-yellow and passionfruit purple accents, fresh greens, crisp white backgrounds, warm wood tones, natural skin tones. High contrast but soft shadows.\\nAudio: upbeat tropical pop bed (light marimba, claps, soft kick), medium intensity, rises slightly toward the end; subtle foley for the powder scoop; clean, intimate VO. No reverb.\\nText overlay: persistent top-left sans-serif, white with soft drop shadow: “Free Shaker Bottle + 5 Free Travel Sticks.” Keep size readable on mobile; animate in subtly at 0:00 and gently scale up 5% at the CTA.\\nDialogue (timed to scenes):\\n- Scene 1 (0:00–0:01.5, female VO over unboxing): “Remembering to take all of my supplements is a lot sometimes.”\\n- Scene 2 (0:01.5–0:03.5, female VO over medium shot and scoop close-up): “And this is so much more than just a mango passion fruit drink—it’s packed with prebiotics, probiotics, and belly-loving fiber.”\\n- Scene 3 (0:03.5–0:05.5, male on-camera): “It’s helped my gut health, regularity, and daily energy—and I’ve noticed way less bloating.”\\n- Scene 4 (0:05.5–0:08.0, male VO on shaker and flat lay): “Order SuperBelly Mango Passion Fruit now and get a free shaker bottle and five free travel sticks.”\\nVisual direction by scene:\\n- Scene 1 Hook (0:00–0:01.5): Medium close-up; hand with rings gently lifts a large matte mango-yellow SuperBelly pouch from a custom-fit mango-yellow box lined with tropical leaf print. Clear white “SuperBelly” wordmark, flavor copy “Mango Passion Fruit,” and small icons: Prebiotic • Probiotic • Fiber. Bright, even daylight; soft shadows. No VFX.\\n- Scene 2 Solution (0:01.5–0:03.5): Medium shot; smiling woman in white tee and jeans, slight three-quarter angle in a sunlit minimalist kitchen, holding a clear shaker with a golden-mango drink (tiny bubbles, condensation). Hard cut to close-up of a mango-colored scoop pulling sunny-yellow powder from a brushed-metal canister; a soft “scoop” foley. Subtle logo visible on shaker.\\n- Scene 3 Benefits (0:03.5–0:05.5): Medium close-up; bearded man with glasses and cap, blue hoodie over green tee, holding the SuperBelly pouch at chest level, gesturing with animated excitement. Bright, soft, even lighting with gentle shadow for depth. Clean white patterned wall behind.\\n- Scene 4 CTA (0:05.5–0:08.0): Medium close-up; same man now holds a clear BPA-free shaker with SuperBelly logo toward camera, smiles. Hard cut to overhead flat lay: five mango-yellow SuperBelly travel sticks fanned neatly on warm walnut wood beside the pouch and shaker. The overlay text subtly scales up. Music hits a feel-good flourish on the last beat.\\nEnd with: CTA visual and audio: freeze on the overhead flat lay of the five travel sticks, pouch, and shaker with the overlay “Free Shaker Bottle + 5 Free Travel Sticks” and a small URL/tag @SuperBelly in bottom-right; music button resolves on the final word of the CTA VO."\n}',
              refusal: null,
              annotations: [],
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1667,
          completion_tokens: 3562,
          total_tokens: 5229,
          prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
          completion_tokens_details: {
            reasoning_tokens: 2560,
            audio_tokens: 0,
            accepted_prediction_tokens: 0,
            rejected_prediction_tokens: 0,
          },
        },
        service_tier: 'default',
        system_fingerprint: null,
      };
      console.log('GPT-5 response:', JSON.stringify(response.data));

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

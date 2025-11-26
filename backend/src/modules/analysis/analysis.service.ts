import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { S3Service } from '../storage/s3.service';
import { SessionService } from '../../common/session.service';
import {
  VideoAnalysis,
  AnalysisStatus,
} from '../../common/types/analysis.types';
import { SessionStatus } from '../../common/types/session.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * AnalysisService
 *
 * Handles video analysis operations using Google Gemini AI.
 * Provides methods for triggering analysis, checking status,
 * and updating user-edited results.
 */
@Injectable()
export class AnalysisService {
  private readonly genai: GoogleGenAI;

  constructor(
    private readonly s3Service: S3Service,
    private readonly sessionService: SessionService,
  ) {
    const apiKey =
      process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable is required',
      );
    }
    this.genai = new GoogleGenAI({});
  }

  /**
   * Analyze uploaded video using Google Gemini
   * @param sessionId - Session identifier
   * @returns Analysis ID and initial status
   */
  async analyzeVideo(
    sessionId: string,
  ): Promise<{ analysisId: string; status: AnalysisStatus }> {
    // Validate session exists and has uploaded video
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.originalVideo) {
      throw new BadRequestException('No video uploaded yet');
    }

    // Create initial analysis record
    const analysisId = uuidv4();
    const videoAnalysis: VideoAnalysis = {
      analysisId,
      analyzedAt: new Date(),
      status: AnalysisStatus.PROCESSING,
      sceneBreakdown: '',
    };

    // Update session status to analyzing
    this.sessionService.updateSession(sessionId, {
      videoAnalysis,
      status: SessionStatus.ANALYZING,
    });

    // Start async analysis
    this.performAnalysis(sessionId, session.originalVideo.s3Key).catch(
      (error) => {
        console.error('Video analysis failed:', error);
        this.sessionService.updateSession(sessionId, {
          videoAnalysis: {
            ...videoAnalysis,
            status: AnalysisStatus.FAILED,
            error: {
              code: 'ANALYSIS_FAILED',
              message: error.message || 'Video analysis failed',
              timestamp: new Date(),
            },
          },
          status: SessionStatus.ERROR,
        });
      },
    );

    return {
      analysisId,
      status: AnalysisStatus.PROCESSING,
    };
  }

  /**
   * Perform video analysis using Gemini
   * @param sessionId - Session identifier
   * @param s3Key - S3 key of video file
   */
  private async performAnalysis(
    sessionId: string,
    s3Key: string,
  ): Promise<void> {
    console.log('[AnalysisService] Starting analysis for session:', sessionId);
    console.log('[AnalysisService] S3 Key:', s3Key);

    try {
      // Download video from S3
      console.log('[AnalysisService] Downloading video from S3...');
      const videoBuffer = await this.s3Service.downloadBuffer(s3Key);
      console.log(
        '[AnalysisService] Video downloaded, size:',
        videoBuffer.length,
        'bytes',
      );

      // Convert to base64
      console.log('[AnalysisService] Converting to base64...');
      const videoBase64 = videoBuffer.toString('base64');
      console.log('[AnalysisService] Base64 length:', videoBase64.length);

      // Get Gemini model
      const prompt = `You are analyzing a video to extract key scenes for recreating an 8-second viral video using AI video generation tools.
Focus ONLY on the most impactful, engaging moments. Ignore filler, transitions, credits, or non-essential content. Prioritize intensity, visual impact, and message clarity.

You must respond with a valid JSON object with a single key "sceneBreakdown" containing the scene breakdown, like so:
{
  "sceneBreakdown": ""
}

For each scene, provide:
SCENE BREAKDOWN:
[Timestamp from original video]
Duration: [seconds needed in 8-sec format]
Scene Purpose: [Hook/Problem/Solution/CTA]
Visual Details:
Camera angle and movement: [specific framing and any dolly, pan, or zoom]
Subject positioning and action: [what's happening, who/what is visible, direction of movement]
Lighting: [dominant color temperature, intensity, shadows, mood]
Color palette: [primary colors, grading, emotional tone]
On-screen elements: [text, graphics, overlays, props visible]
Visual effects or transitions: [any special effects, cuts, or stylistic elements]
Cinematic Details:
Shot type: [wide, medium, close-up, detail shot]
Pacing/rhythm: [speed of action, cut timing]
Style and aesthetic: [documentary, cinematic, animated, product demo, etc.]
Audio Details:
Dialogue/voiceover: [exact words if present, tone, emotional delivery]
Sound design: [music genre, ambient sounds, sound effects, music intensity]
Timing: [when sounds occur relative to visuals]

IMPORTANT REQUIREMENTS:
Maintain the original video's core message and visual identity.
Optimize for maximum virality: emotional impact, pattern interrupts, clarity, and urgency.
Respond with a valid JSON with 1 key "sceneBreakdown", without any additional explanation or text outside the JSON object.`;

      // Send request to Gemini
      console.log('[AnalysisService] Sending request to Gemini API...');

      // DEVELOPMENT MODE: Using hardcoded response to avoid expensive API calls
      // TODO: Remove this when ready for production
      // const response = {
      //   sdkHttpResponse: {
      //     headers: {
      //       'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      //       'content-encoding': 'gzip',
      //       'content-type': 'application/json; charset=UTF-8',
      //       date: 'Mon, 24 Nov 2025 16:23:59 GMT',
      //       server: 'scaffolding on HTTPServer2',
      //       'server-timing': 'gfet4t7; dur=25710',
      //       'transfer-encoding': 'chunked',
      //       vary: 'Origin, X-Origin, Referer',
      //       'x-content-type-options': 'nosniff',
      //       'x-frame-options': 'SAMEORIGIN',
      //       'x-xss-protection': '0',
      //     },
      //   },
      //   candidates: [
      //     {
      //       content: {
      //         parts: [
      //           {
      //             text: '```json\n{\n  "sceneBreakdown": [\n    {\n      "Timestamp from original video": "0:00",\n      "Duration": "1.5s",\n      "Scene Purpose": "Hook",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, slight upward pan from the shipping box to the AG1 pouch.",\n        "Subject positioning and action": "A hand (wearing rings) is gently holding a large green AG1 pouch, which is nestled in a custom-fit green cardboard box.",\n        "Lighting": "Bright, even, appearing like natural daylight. Soft shadows give depth.",\n        "Color palette": "Dominant deep greens (pouch, box), crisp white text on the pouch, warm skin tones.",\n        "On-screen elements": "Large \'AG1\' logo, \'Comprehensive + Convenient Daily Nutrition\', and certification badges on the pouch. Text overlay: \'Free Year Supply of Vitamin D & 5 Free Travel Packs\'.",\n        "Visual effects or transitions": "None."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up.",\n        "Pacing/rhythm": "Smooth, steady, introductory.",\n        "Style and aesthetic": "Product unboxing/reveal, clean, direct."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'Remembering to take all of my supplements is a lot sometimes.\' (Female voice, relatable, slightly hurried tone).",\n        "Sound design": "Upbeat, modern, corporate-friendly background music, medium intensity.",\n        "Timing": "Dialogue begins immediately with the visual."\n      }\n    },\n    {\n      "Timestamp from original video": "0:03.5",\n      "Duration": "2s",\n      "Scene Purpose": "Solution",\n      "Visual Details": {\n        "Camera angle and movement": "Medium shot, static, directly facing the woman. Quick cut to a close-up of a hand scooping green powder.",\n        "Subject positioning and action": "A smiling woman with long brown hair, wearing a white t-shirt, holds a clear bottle of green liquid (mixed AG1). Her body is slightly angled, looking at the camera. Then, a hand uses a green scoop to retrieve light green powder from a metallic-looking container.",\n        "Lighting": "Bright, even, consistent lighting. The woman is against a bright, minimalist background. The powder shot has warm kitchen lighting.",\n        "Color palette": "Vibrant greens (drink, powder), crisp white (woman\'s shirt), warm skin tones, light neutral backgrounds.",\n        "On-screen elements": "AG1 logo faintly visible on the bottle. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "Hard cut between the woman and the powder scoop."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium shot, then detail shot.",\n        "Pacing/rhythm": "Quick and informative cuts.",\n        "Style and aesthetic": "Lifestyle, product demonstration, energetic."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'And this is so much more than just a greens powder. It\'s got all of your vitamins, minerals, probiotics and more.\' (Female voice, enthusiastic, clear articulation).",\n        "Sound design": "Background music continues, steady intensity. Subtle \'scooping\' sound effect.",\n        "Timing": "Dialogue starts with the woman\'s shot and continues over the scoop shot."\n      }\n    },\n    {\n      "Timestamp from original video": "0:13",\n      "Duration": "2s",\n      "Scene Purpose": "Benefits",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, static, man directly facing the camera.",\n        "Subject positioning and action": "A bearded man with glasses and a cap, wearing a blue hoodie over a green shirt, holds an AG1 pouch and gestures with his free hand, expressing excitement.",\n        "Lighting": "Bright, soft, even lighting. Some subtle shadows on the white patterned background add dimension.",\n        "Color palette": "Dominant green (pouch, shirt), blue (hoodie), warm skin tones, clean white background.",\n        "On-screen elements": "AG1 pouch. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "None."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up.",\n        "Pacing/rhythm": "Dynamic and engaging, driven by the speaker\'s energy.",\n        "Style and aesthetic": "Testimonial, authentic, friendly."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'my immune system, my gut health, and energy. And I\'ve also noticed a huge difference in my hair and nails.\' (Male voice, enthusiastic, confident tone).",\n        "Sound design": "Background music continues, slightly increasing in energy.",\n        "Timing": "Dialogue begins immediately and is delivered expressively."\n      }\n    },\n    {\n      "Timestamp from original video": "0:28",\n      "Duration": "2.5s",\n      "Scene Purpose": "CTA",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, static, man facing camera. Quick cut to a close-up overhead shot.",\n        "Subject positioning and action": "The same man holds up a small, dark green dropper bottle (liquid Vitamin D), smiling at the camera. Then, five small green AG1 travel packs are neatly spread on a warm-toned wooden surface next to an AG1 container.",\n        "Lighting": "Bright, even, highlighting product details. The wooden surface has a slightly warmer, inviting feel.",\n        "Color palette": "Rich greens (bottle, packs, container), dark brown (wooden surface), crisp white text on products, warm skin tones.",\n        "On-screen elements": "Small \'D3+K2\' text on the dropper bottle. \'AG1\' logo and product details on travel packs. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "Hard cut between the man and the close-up of the packs."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up, then detail shot.",\n        "Pacing/rhythm": "Fast cuts to emphasize the bundled offer.",\n        "Style and aesthetic": "Promotional, clear call to action, value-oriented."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'If you order Athletic Greens right now, you\'ll receive this year supply of this liquid Vitamin D and five free travel packs.\' (Male voice, urgent, persuasive tone).",\n        "Sound design": "Background music builds to a final flourish, ending with the dialogue.",\n        "Timing": "Dialogue starts with the man\'s shot and continues over the product close-up, concluding the video."\n      }\n    }\n  ]\n}\n```',
      //           },
      //         ],
      //         role: 'model',
      //       },
      //       finishReason: 'STOP',
      //       index: 0,
      //     },
      //   ],
      //   modelVersion: 'gemini-2.5-flash',
      //   responseId: 'n4YkaYyLKNCOvdIPkJWQ6AM',
      //   usageMetadata: {
      //     promptTokenCount: 11304,
      //     candidatesTokenCount: 1587,
      //     totalTokenCount: 15994,
      //     promptTokensDetails: [
      //       { modality: 'TEXT', tokenCount: 412 },
      //       { modality: 'VIDEO', tokenCount: 9731 },
      //       { modality: 'AUDIO', tokenCount: 1161 },
      //     ],
      //     thoughtsTokenCount: 3103,
      //   },
      //   text: '```json\n{\n  "sceneBreakdown": [\n    {\n      "Timestamp from original video": "0:00",\n      "Duration": "1.5s",\n      "Scene Purpose": "Hook",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, slight upward pan from the shipping box to the AG1 pouch.",\n        "Subject positioning and action": "A hand (wearing rings) is gently holding a large green AG1 pouch, which is nestled in a custom-fit green cardboard box.",\n        "Lighting": "Bright, even, appearing like natural daylight. Soft shadows give depth.",\n        "Color palette": "Dominant deep greens (pouch, box), crisp white text on the pouch, warm skin tones.",\n        "On-screen elements": "Large \'AG1\' logo, \'Comprehensive + Convenient Daily Nutrition\', and certification badges on the pouch. Text overlay: \'Free Year Supply of Vitamin D & 5 Free Travel Packs\'.",\n        "Visual effects or transitions": "None."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up.",\n        "Pacing/rhythm": "Smooth, steady, introductory.",\n        "Style and aesthetic": "Product unboxing/reveal, clean, direct."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'Remembering to take all of my supplements is a lot sometimes.\' (Female voice, relatable, slightly hurried tone).",\n        "Sound design": "Upbeat, modern, corporate-friendly background music, medium intensity.",\n        "Timing": "Dialogue begins immediately with the visual."\n      }\n    },\n    {\n      "Timestamp from original video": "0:03.5",\n      "Duration": "2s",\n      "Scene Purpose": "Solution",\n      "Visual Details": {\n        "Camera angle and movement": "Medium shot, static, directly facing the woman. Quick cut to a close-up of a hand scooping green powder.",\n        "Subject positioning and action": "A smiling woman with long brown hair, wearing a white t-shirt, holds a clear bottle of green liquid (mixed AG1). Her body is slightly angled, looking at the camera. Then, a hand uses a green scoop to retrieve light green powder from a metallic-looking container.",\n        "Lighting": "Bright, even, consistent lighting. The woman is against a bright, minimalist background. The powder shot has warm kitchen lighting.",\n        "Color palette": "Vibrant greens (drink, powder), crisp white (woman\'s shirt), warm skin tones, light neutral backgrounds.",\n        "On-screen elements": "AG1 logo faintly visible on the bottle. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "Hard cut between the woman and the powder scoop."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium shot, then detail shot.",\n        "Pacing/rhythm": "Quick and informative cuts.",\n        "Style and aesthetic": "Lifestyle, product demonstration, energetic."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'And this is so much more than just a greens powder. It\'s got all of your vitamins, minerals, probiotics and more.\' (Female voice, enthusiastic, clear articulation).",\n        "Sound design": "Background music continues, steady intensity. Subtle \'scooping\' sound effect.",\n        "Timing": "Dialogue starts with the woman\'s shot and continues over the scoop shot."\n      }\n    },\n    {\n      "Timestamp from original video": "0:13",\n      "Duration": "2s",\n      "Scene Purpose": "Benefits",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, static, man directly facing the camera.",\n        "Subject positioning and action": "A bearded man with glasses and a cap, wearing a blue hoodie over a green shirt, holds an AG1 pouch and gestures with his free hand, expressing excitement.",\n        "Lighting": "Bright, soft, even lighting. Some subtle shadows on the white patterned background add dimension.",\n        "Color palette": "Dominant green (pouch, shirt), blue (hoodie), warm skin tones, clean white background.",\n        "On-screen elements": "AG1 pouch. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "None."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up.",\n        "Pacing/rhythm": "Dynamic and engaging, driven by the speaker\'s energy.",\n        "Style and aesthetic": "Testimonial, authentic, friendly."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'my immune system, my gut health, and energy. And I\'ve also noticed a huge difference in my hair and nails.\' (Male voice, enthusiastic, confident tone).",\n        "Sound design": "Background music continues, slightly increasing in energy.",\n        "Timing": "Dialogue begins immediately and is delivered expressively."\n      }\n    },\n    {\n      "Timestamp from original video": "0:28",\n      "Duration": "2.5s",\n      "Scene Purpose": "CTA",\n      "Visual Details": {\n        "Camera angle and movement": "Medium close-up, static, man facing camera. Quick cut to a close-up overhead shot.",\n        "Subject positioning and action": "The same man holds up a small, dark green dropper bottle (liquid Vitamin D), smiling at the camera. Then, five small green AG1 travel packs are neatly spread on a warm-toned wooden surface next to an AG1 container.",\n        "Lighting": "Bright, even, highlighting product details. The wooden surface has a slightly warmer, inviting feel.",\n        "Color palette": "Rich greens (bottle, packs, container), dark brown (wooden surface), crisp white text on products, warm skin tones.",\n        "On-screen elements": "Small \'D3+K2\' text on the dropper bottle. \'AG1\' logo and product details on travel packs. Text overlay \'Free Year Supply of Vitamin D & 5 Free Travel Packs\' remains.",\n        "Visual effects or transitions": "Hard cut between the man and the close-up of the packs."\n      },\n      "Cinematic Details": {\n        "Shot type": "Medium close-up, then detail shot.",\n        "Pacing/rhythm": "Fast cuts to emphasize the bundled offer.",\n        "Style and aesthetic": "Promotional, clear call to action, value-oriented."\n      },\n      "Audio Details": {\n        "Dialogue/voiceover": "\'If you order Athletic Greens right now, you\'ll receive this year supply of this liquid Vitamin D and five free travel packs.\' (Male voice, urgent, persuasive tone).",\n        "Sound design": "Background music builds to a final flourish, ending with the dialogue.",\n        "Timing": "Dialogue starts with the man\'s shot and continues over the product close-up, concluding the video."\n      }\n    }\n  ]\n}\n```',
      // };

      // PRODUCTION: Uncomment this to use real Gemini API
      const response = await this.genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'video/mp4',
              data: videoBase64,
            },
          },
          { text: prompt },
        ],
      });

      console.log('[AnalysisService] Received response from Gemini');
      console.log('[AnalysisService] Response:', JSON.stringify(response));
      console.log('[AnalysisService] Response Raw:', response);

      let sceneBreakdown = '';
      try {
        const responseText = response?.text || '';
        console.log(
          '[AnalysisService] Raw response length:',
          responseText.length,
        );
        console.log(
          '[AnalysisService] Raw response preview:',
          responseText.substring(0, 200),
        );

        // Try to parse JSON response - remove markdown code blocks if present
        const cleanedText = responseText
          .replace(/```json\n?|```\n?/g, '')
          .trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Handle both array and string formats
          if (Array.isArray(parsed.sceneBreakdown)) {
            sceneBreakdown = JSON.stringify(parsed.sceneBreakdown, null, 2);
            console.log(
              '[AnalysisService] Extracted sceneBreakdown array, items:',
              parsed.sceneBreakdown.length,
            );
          } else if (typeof parsed.sceneBreakdown === 'string') {
            sceneBreakdown = parsed.sceneBreakdown;
            console.log(
              '[AnalysisService] Extracted sceneBreakdown string, length:',
              sceneBreakdown.length,
            );
          } else {
            sceneBreakdown = cleanedText;
            console.log(
              '[AnalysisService] Using full cleaned text as sceneBreakdown',
            );
          }
        } else {
          // Fallback to full text if not JSON
          sceneBreakdown = responseText;
          console.log(
            '[AnalysisService] Using full response text as sceneBreakdown',
          );
        }
      } catch (parseError) {
        console.error(
          '[AnalysisService] Error parsing JSON response:',
          parseError,
        );
        sceneBreakdown = response?.text || '';
      }
      console.log(
        '[AnalysisService] Final scene breakdown length:',
        sceneBreakdown.length,
      );
      console.log(
        '[AnalysisService] Final scene breakdown:',
        JSON.stringify(sceneBreakdown),
      );

      // Update session with complete analysis
      const session = this.sessionService.getSession(sessionId);
      if (session?.videoAnalysis) {
        this.sessionService.updateSession(sessionId, {
          videoAnalysis: {
            ...session.videoAnalysis,
            status: AnalysisStatus.COMPLETE,
            sceneBreakdown,
          },
          status: SessionStatus.ANALYSIS_COMPLETE,
        });
        console.log(
          '[AnalysisService] Analysis complete for session:',
          sessionId,
        );
      }
    } catch (error) {
      console.error('[AnalysisService] Analysis failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Gemini analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Get analysis status and results
   * @param sessionId - Session identifier
   * @returns Video analysis data
   */
  async getAnalysisStatus(sessionId: string): Promise<VideoAnalysis> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.videoAnalysis) {
      throw new BadRequestException('Analysis not started');
    }

    return session.videoAnalysis;
  }

  /**
   * Update analysis with user edits
   * @param sessionId - Session identifier
   * @param editedText - User's edited analysis text
   * @returns Updated video analysis
   */
  async updateAnalysis(
    sessionId: string,
    editedText: string,
  ): Promise<VideoAnalysis> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (!session.videoAnalysis) {
      throw new BadRequestException('Analysis not started');
    }

    // Update with user edits
    const updatedAnalysis: VideoAnalysis = {
      ...session.videoAnalysis,
      userEdits: editedText,
    };

    this.sessionService.updateSession(sessionId, {
      videoAnalysis: updatedAnalysis,
    });

    return updatedAnalysis;
  }
}

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

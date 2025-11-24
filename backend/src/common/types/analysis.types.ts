/**
 * Analysis Types
 *
 * Defines AI-generated video analysis structures using Google Gemini.
 */

/**
 * Analysis processing status
 */
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

/**
 * Scene purpose in video narrative
 */
export enum ScenePurpose {
  HOOK = 'hook',
  PROBLEM = 'problem',
  SOLUTION = 'solution',
  CTA = 'cta',
}

/**
 * Individual scene analysis
 */
export interface Scene {
  /** Original timestamp (e.g., "0:00-0:02") */
  timestamp: string;

  /** Duration in seconds */
  duration: number;

  /** Scene purpose in narrative */
  purpose: ScenePurpose;

  /** Visual details */
  visualDetails: {
    cameraAngle?: string;
    movement?: string;
    lighting?: string;
    colorPalette?: string;
    onScreenElements?: string;
  };

  /** Cinematic details */
  cinematicDetails: {
    shotType?: string;
    pacing?: string;
    style?: string;
  };

  /** Audio details */
  audioDetails: {
    dialogue?: string;
    soundDesign?: string;
    timing?: string;
  };
}

/**
 * Structured analysis data parsed from AI response
 */
export interface AnalysisStructuredData {
  /** Scene-by-scene breakdown */
  scenes: Scene[];

  /** Overall aesthetic description */
  overallAesthetic?: string;

  /** Dominant colors identified */
  dominantColors?: string[];

  /** Pacing description */
  pacing?: string;

  /** Audio style description */
  audioStyle?: string;
}

/**
 * Analysis error details
 */
export interface AnalysisError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error timestamp */
  timestamp: Date;
}

/**
 * VideoAnalysis represents AI-generated insights from the original video
 */
export interface VideoAnalysis {
  /** Unique identifier (UUID) */
  analysisId: string;

  /** Analysis timestamp */
  analyzedAt: Date;

  /** Processing status */
  status: AnalysisStatus;

  /** Raw scene-by-scene breakdown (can be edited by user) */
  sceneBreakdown: string;

  /** Parsed structured insights (optional) */
  structuredData?: AnalysisStructuredData;

  /** User's edited version of scene breakdown (optional) */
  userEdits?: string;

  /** Error details if analysis failed (optional) */
  error?: AnalysisError;
}

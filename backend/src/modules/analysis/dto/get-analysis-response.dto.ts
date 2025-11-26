import { VideoAnalysis } from '../../../common/types/analysis.types';

/**
 * Response DTO for retrieving analysis results
 */
export class GetAnalysisResponseDto {
  success!: boolean;
  data!: VideoAnalysis;
  meta!: {
    timestamp: string;
    requestId: string;
  };
}

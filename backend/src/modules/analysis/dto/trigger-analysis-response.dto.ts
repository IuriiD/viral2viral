import { AnalysisStatus } from '../../../common/types/analysis.types';

/**
 * Response DTO for triggering video analysis
 */
export class TriggerAnalysisResponseDto {
  success!: boolean;
  data!: {
    analysisId: string;
    status: AnalysisStatus;
  };
  meta!: {
    timestamp: string;
    requestId: string;
  };
}

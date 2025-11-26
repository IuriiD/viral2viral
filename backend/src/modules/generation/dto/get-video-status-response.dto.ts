import { GeneratedVideo } from '../../../common/types/generation.types';

/**
 * DTO for video generation status polling response
 */
export class GetVideoStatusResponseDto {
  success!: boolean;
  data!: GeneratedVideo;
  meta!: {
    timestamp: string;
    requestId: string;
  };
}

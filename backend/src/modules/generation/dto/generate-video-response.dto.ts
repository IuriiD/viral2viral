import { GeneratedVideo } from '../../../common/types/generation.types';

/**
 * DTO for video generation initiation response
 */
export class GenerateVideoResponseDto {
  success!: boolean;
  data!: GeneratedVideo;
  meta!: {
    timestamp: string;
    requestId: string;
  };
}

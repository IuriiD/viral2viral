import {
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

/**
 * Request DTO for generating presigned video upload URL
 */
export class UploadVideoRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsNumber()
  @Min(1)
  @Max(104857600) // 100MB in bytes
  fileSize!: number;

  @IsEnum(['video/mp4', 'video/quicktime', 'video/x-msvideo'])
  mimeType!: string;
}

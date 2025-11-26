import { IsString, IsNumber, IsIn, MaxLength, Min, Max } from 'class-validator';

/**
 * DTO for requesting a presigned upload URL for product image
 */
export class UploadProductImageRequestDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsNumber()
  @Min(1)
  @Max(10485760) // 10MB max
  fileSize!: number;

  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/webp'])
  mimeType!: string;
}

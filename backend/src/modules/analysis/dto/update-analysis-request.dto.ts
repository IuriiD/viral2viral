import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

/**
 * Request DTO for updating user-edited analysis text
 */
export class UpdateAnalysisRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  editedText!: string;
}

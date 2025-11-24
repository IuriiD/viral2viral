/**
 * Response DTO for presigned video upload URL
 */
export class UploadVideoResponseDto {
  success!: boolean;
  data!: {
    uploadUrl: string;
    uploadFields: Record<string, string>;
    s3Key: string;
  };
  meta!: {
    timestamp: string;
    requestId: string;
  };
}

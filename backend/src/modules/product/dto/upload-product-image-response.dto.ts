/**
 * DTO for presigned upload URL response for product image
 */
export class UploadProductImageResponseDto {
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

/**
 * Product Types
 *
 * Defines product information structures for the new advertisement.
 */

/**
 * ProductInformation represents user's product details for the advertisement
 */
export interface ProductInformation {
  /** Product name (3-100 characters) */
  productName: string;

  /** Product description (max 250 characters) */
  productDescription: string;

  /** S3 key for uploaded product image (optional) */
  productImageS3Key?: string;

  /** MIME type of product image (optional) */
  productImageMimeType?: string;

  /** Timestamp when product info was added */
  addedAt: Date;

  /** Presigned download URL for image (temporary, optional) */
  downloadUrl?: string;
}

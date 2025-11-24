/* eslint-disable no-undef */
/**
 * AWS S3 Service for storing and retrieving user activity images
 */
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Initialize AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// S3 bucket name
const bucketName = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload an image to S3 for a specific user
 * @param {string} userId - The user ID
 * @param {string} imageId - The image ID (typically activity ID)
 * @param {string|object} source - Local path to the image file OR an object with base64 data
 * @param {string} [source.data] - Base64 encoded image data (without the prefix)
 * @param {string} [source.contentType] - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<string>} - S3 object URL
 */
const uploadImage = async (userId, imageId, source) => {
  try {
    logger.info(`📤 Uploading image for user: ${userId}, image: ${imageId}`);

    let fileContent;
    let contentType;
    let fileExtension;

    // Check if source is a file path or base64 data
    if (typeof source === 'string') {
      // Handle file path
      if (!fs.existsSync(source)) {
        throw new Error(`File not found: ${source}`);
      }

      // Read file content
      fileContent = fs.readFileSync(source);

      // File extension
      fileExtension = path.extname(source);
      contentType = `image/${fileExtension.substring(1)}`; // Remove dot from extension
    } else if (source && source.data && source.contentType) {
      // Handle base64 data
      fileContent = Buffer.from(source.data, 'base64');
      contentType = source.contentType;

      // Extract extension from content type (e.g., 'image/jpeg' -> 'jpg')
      const extMap = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
      };
      fileExtension = extMap[contentType] || '.png';
    } else {
      throw new Error(
        'Invalid source provided. Expected file path or base64 data object',
      );
    }

    // Construct S3 key (path)
    const s3Key = `users/${userId}/${imageId}${fileExtension}`;

    // Set up upload parameters
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    };

    // Upload to S3
    const uploadResult = await s3.upload(params).promise();
    logger.info(`✅ Successfully uploaded image to: ${uploadResult.Location}`);

    return uploadResult.Location;
  } catch (error) {
    logger.error({ err: error }, '❌ Error uploading image to S3');
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
};

/**
 * Get a single image for a specific user
 * @param {string} userId - The user ID
 * @param {string} imageId - The image ID
 * @param {string} [extension='png'] - Image file extension
 * @returns {Promise<AWS.S3.GetObjectOutput>} - S3 object data
 */
const getImage = async (userId, imageId, extension = 'png') => {
  try {
    logger.info(`📥 Retrieving image for user: ${userId}, image: ${imageId}`);

    // Construct S3 key
    const s3Key = `users/${userId}/${imageId}.${extension}`;

    // Set up get parameters
    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };

    // Get object from S3
    const data = await s3.getObject(params).promise();
    logger.info(`✅ Successfully retrieved image: ${s3Key}`);

    return data;
  } catch (error) {
    logger.error({ err: error }, '❌ Error retrieving image from S3');
    throw new Error(`Failed to retrieve image from S3: ${error.message}`);
  }
};

/**
 * Get image URL for a specific user's image
 * @param {string} userId - The user ID
 * @param {string} imageId - The image ID
 * @param {string} [extension='jpg'] - Image file extension
 * @returns {Promise<string>} - Presigned URL for the image
 */
const getImageUrl = async (userId, imageId, extension = 'png') => {
  try {
    logger.info(`🔗 Generating URL for user: ${userId}, image: ${imageId}`);

    // Construct S3 key
    const s3Key = `users/${userId}/${imageId}.${extension}`;

    // Set up parameters for signed URL
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Expires: 3600, // URL expires in 1 hour
    };

    // Generate presigned URL
    const url = s3.getSignedUrl('getObject', params);
    logger.info(`✅ Successfully generated presigned URL for: ${s3Key}`);

    return url;
  } catch (error) {
    logger.error({ err: error }, '❌ Error generating presigned URL');
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * List all images for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of image objects with keys and URLs
 */
const listUserImages = async (userId) => {
  try {
    logger.info(`📋 Listing all images for user: ${userId}`);

    // Construct prefix for the user's folder
    const prefix = `users/${userId}/`;

    // Set up list parameters
    const params = {
      Bucket: bucketName,
      Prefix: prefix,
    };

    // List objects from S3
    const data = await s3.listObjectsV2(params).promise();

    // Process results to get image IDs and generate URLs
    const images = await Promise.all(
      data.Contents.map(async (item) => {
        // Extract imageId from the key (path)
        const key = item.Key;
        const imageId = path.basename(key, path.extname(key));

        // Generate presigned URL
        const url = await getImageUrl(
          userId,
          imageId,
          path.extname(key).substring(1),
        );

        return {
          imageId,
          key,
          url,
          lastModified: item.LastModified,
          size: item.Size,
        };
      }),
    );

    logger.info(
      `✅ Successfully retrieved ${images.length} images for user: ${userId}`,
    );

    return images;
  } catch (error) {
    logger.error({ err: error }, '❌ Error listing user images from S3');
    throw new Error(`Failed to list user images from S3: ${error.message}`);
  }
};

/**
 * Delete an image from S3
 * @param {string} userId - The user ID
 * @param {string} imageId - The image ID
 * @param {string} [extension='png'] - Image file extension
 * @returns {Promise<AWS.S3.DeleteObjectOutput>} - Delete operation result
 */
const deleteImage = async (userId, imageId, extension = 'png') => {
  try {
    logger.info(`🗑️ Deleting image for user: ${userId}, image: ${imageId}`);

    // Construct S3 key
    const s3Key = `users/${userId}/${imageId}.${extension}`;

    // Set up delete parameters
    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };

    // Delete object from S3
    const result = await s3.deleteObject(params).promise();
    logger.info(`✅ Successfully deleted image: ${s3Key}`);

    return result;
  } catch (error) {
    logger.error({ err: error }, '❌ Error deleting image from S3');
    throw new Error(`Failed to delete image from S3: ${error.message}`);
  }
};

/**
 * Download an image from S3 and save it to a local file
 * @param {string} userId - The user ID
 * @param {string} imageId - The image ID
 * @param {string} localFilePath - Local path where to save the file
 * @param {string} [extension='png'] - Image file extension
 * @returns {Promise<string>} - Local file path where the image was saved
 */
const downloadImageToFile = async (
  userId,
  imageId,
  localFilePath,
  extension = 'png',
) => {
  try {
    logger.info(
      `📥 Downloading image to file for user: ${userId}, image: ${imageId}`,
    );
    logger.info(`Target file: ${localFilePath}`);

    // Create directory if it doesn't exist
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`📁 Created directory: ${dir}`);
    }

    // Get image data from S3 using existing getImage function
    const imageData = await getImage(userId, imageId, extension);

    // Write image data to local file
    fs.writeFileSync(localFilePath, imageData.Body);

    logger.info(`✅ Successfully downloaded image to: ${localFilePath}`);
    return localFilePath;
  } catch (error) {
    logger.error({ err: error }, '❌ Error downloading image to file');
    throw new Error(`Failed to download image to file: ${error.message}`);
  }
};

/**
 * Upload a selfie image to S3 for a specific user
 * @param {string} userId - The user ID
 * @param {string} selfieId - The unique selfie ID (UUID)
 * @param {object} source - Object with base64 data
 * @param {string} source.data - Base64 encoded image data (without the prefix)
 * @param {string} source.contentType - Image MIME type (e.g., 'image/png')
 * @returns {Promise<string>} - S3 object URL
 */
const uploadSelfie = async (userId, selfieId, source) => {
  try {
    logger.info(`📤 Uploading selfie for user: ${userId}, selfie: ${selfieId}`);

    if (!source || !source.data || !source.contentType) {
      throw new Error(
        'Invalid source provided. Expected base64 data object with contentType',
      );
    }

    // Handle base64 data
    const fileContent = Buffer.from(source.data, 'base64');
    const contentType = source.contentType;

    // Construct S3 key (path) for selfie
    const s3Key = `users/${userId}/${selfieId}.png`;

    // Set up upload parameters
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    };

    // Upload to S3
    const uploadResult = await s3.upload(params).promise();
    logger.info(`✅ Successfully uploaded selfie to: ${uploadResult.Location}`);

    return uploadResult.Location;
  } catch (error) {
    logger.error({ err: error }, '❌ Error uploading selfie to S3');
    throw new Error(`Failed to upload selfie to S3: ${error.message}`);
  }
};

/**
 * Get a signed URL for a user's selfie
 * @param {string} userId - The user ID
 * @param {string} selfieId - The selfie ID
 * @returns {Promise<string>} - Signed URL for the selfie
 */
const getSelfieUrl = async (userId, selfieId) => {
  try {
    const s3Key = `users/${userId}/${selfieId}.png`;

    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Expires: 3600, // URL expires in 1 hour
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    logger.error({ err: error }, '❌ Error generating signed URL for selfie');
    throw new Error(`Failed to get selfie URL: ${error.message}`);
  }
};

/**
 * Delete a user's selfie from S3
 * @param {string} userId - The user ID
 * @param {string} selfieId - The selfie ID
 * @returns {Promise<void>}
 */
const deleteSelfie = async (userId, selfieId) => {
  try {
    logger.info(`🗑️ Deleting selfie for user: ${userId}, selfie: ${selfieId}`);

    const s3Key = `users/${userId}/${selfieId}.png`;

    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };

    await s3.deleteObject(params).promise();
    logger.info(`✅ Successfully deleted selfie: ${s3Key}`);
  } catch (error) {
    logger.error({ err: error }, '❌ Error deleting selfie from S3');
    throw new Error(`Failed to delete selfie from S3: ${error.message}`);
  }
};

/**
 * Check if the S3 service is properly configured
 * @returns {boolean} - Whether all required environment variables are set
 */
const isConfigured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET_NAME
  );
};

module.exports = {
  uploadImage,
  getImage,
  getImageUrl,
  listUserImages,
  deleteImage,
  downloadImageToFile,
  uploadSelfie,
  getSelfieUrl,
  deleteSelfie,
  isConfigured,
};

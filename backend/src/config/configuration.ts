/**
 * Configuration Module
 *
 * Loads and validates environment variables for the application.
 * Provides type-safe access to configuration values.
 */

export interface Configuration {
  // Server
  port: number;
  nodeEnv: string;

  // AWS S3
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
  };

  // Google Gemini
  gemini: {
    apiKey: string;
    model: string;
  };

  // OpenAI via laozhang.ai
  openai: {
    apiKey: string;
    baseUrl: string;
    gptModel: string;
    soraModel: string;
  };

  // CORS
  cors: {
    origin: string;
  };
}

/**
 * Load configuration from environment variables
 */
export const loadConfiguration = (): Configuration => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      s3Bucket: process.env.AWS_S3_BUCKET || '',
    },

    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_API_BASE_URL || 'https://api.laozhang.ai/v1',
      gptModel: process.env.OPENAI_GPT_MODEL || 'gpt-5',
      soraModel: process.env.OPENAI_SORA_MODEL || 'sora-2',
    },

    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
  };
};

/**
 * Validate that required configuration values are present
 * @throws Error if required values are missing
 */
export const validateConfiguration = (config: Configuration): void => {
  const requiredFields = [
    { key: 'AWS_REGION', value: config.aws.region },
    { key: 'AWS_ACCESS_KEY_ID', value: config.aws.accessKeyId },
    { key: 'AWS_SECRET_ACCESS_KEY', value: config.aws.secretAccessKey },
    { key: 'AWS_S3_BUCKET', value: config.aws.s3Bucket },
    { key: 'GEMINI_API_KEY', value: config.gemini.apiKey },
    { key: 'OPENAI_API_KEY', value: config.openai.apiKey },
  ];

  const missingFields = requiredFields
    .filter((field) => !field.value)
    .map((field) => field.key);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingFields.join(', ')}`,
    );
  }
};

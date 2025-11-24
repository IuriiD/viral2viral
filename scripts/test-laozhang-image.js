/* eslint-disable no-undef */
/**
 * Test script for laozhang.ai image generation API
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY environment variable
 * 2. Run: node scripts/test-laozhang-image.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// ============================================================================
// HTTP Client Helper
// ============================================================================

const makeRequest = async (url, options, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonResponse);
            } else {
              reject(
                new Error(
                  `HTTP ${res.statusCode}: ${jsonResponse.error?.message || responseData}`,
                ),
              );
            }
          } catch (parseError) {
            reject(
              new Error(`Failed to parse response: ${parseError.message}`),
            );
          }
        });
      },
    );

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
};

// ============================================================================
// Image Download Helper
// ============================================================================

const downloadImageAsBase64 = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(imageUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const base64 = buffer.toString('base64');
            resolve(base64);
          });
        } else {
          reject(new Error(`Failed to download image: HTTP ${res.statusCode}`));
        }
      },
    );

    req.on('error', (error) => {
      reject(new Error(`Failed to download image: ${error.message}`));
    });

    req.end();
  });
};

// ============================================================================
// Image URL Extraction Helper
// ============================================================================

const extractImageUrls = (content) => {
  // Match markdown image format: ![text](url)
  const imageRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  const urls = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
};

// ============================================================================
// Image Generation Function
// ============================================================================

const generateImage = async (prompt, options = {}) => {
  try {
    console.log('🖼️ Generating image with laozhang.ai');
    console.log(`📝 Prompt: ${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`);

    // Validate inputs
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Set default options
    const defaultOptions = {
      n: 1,
    };

    // Merge default options with provided options
    const imageOptions = {
      ...defaultOptions,
      ...options,
    };

    // Add the required 1:1 aspect ratio suffix to the prompt
    const modifiedPrompt = prompt.endsWith('【1:1】')
      ? prompt
      : `${prompt}【1:1】`;

    // Prepare the API request payload
    const requestPayload = {
      model: 'sora_image',
      n: imageOptions.n,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: modifiedPrompt,
            },
          ],
        },
      ],
    };

    // Get API configuration
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl =
      process.env.OPENAI_API_BASE_URL || 'https://api.laozhang.ai/v1';

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for laozhang.ai API',
      );
    }

    // Make API request
    const url = `${baseUrl}/chat/completions`;
    const requestOptions = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    console.log('🌐 Making request to laozhang.ai API...');
    const response = await makeRequest(
      url,
      requestOptions,
      JSON.stringify(requestPayload),
    );

    console.log(`✅ Response received from laozhang.ai`);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received from laozhang.ai API');
    }

    // Extract image URLs from the response
    const content = response.choices[0].message.content;
    const imageUrls = extractImageUrls(content);

    if (imageUrls.length === 0) {
      throw new Error('No image URLs found in laozhang.ai API response');
    }

    console.log(`📸 Found ${imageUrls.length} image URL(s) in response`);

    // Download all images and convert to base64
    const imageData = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log(`⬇️ Downloading image ${i + 1}/${imageUrls.length}...`);

      try {
        const base64Data = await downloadImageAsBase64(url);
        imageData.push({
          b64_json: base64Data,
          original_url: url,
        });
        console.log(`✅ Successfully downloaded image ${i + 1}`);
      } catch (downloadError) {
        console.error(
          `❌ Failed to download image ${i + 1}: ${downloadError.message}`,
        );
        throw new Error(
          `Failed to download image from ${url}: ${downloadError.message}`,
        );
      }
    }

    // Return response in OpenAI-compatible format
    const compatibleResponse = {
      data: imageData,
      usage: response.usage,
    };

    console.log('✅ Successfully generated image(s) with laozhang.ai');

    return compatibleResponse;
  } catch (error) {
    console.error(`❌ Error generating image with laozhang.ai: ${error.message}`);
    throw new Error(
      `Failed to generate image with laozhang.ai: ${error.message}`,
    );
  }
};

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_PROMPT = 'A serene Japanese garden with cherry blossoms and a koi pond';
const OUTPUT_DIR = path.join(__dirname, './output');

// ============================================================================
// Test Function
// ============================================================================

async function testImageGeneration() {
  console.log('🧪 Starting laozhang.ai image generation test...\n');

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. Please set it before running this test.',
      );
    }

    console.log('⏳ Generating image...\n');

    // Call the image generation function
    const result = await generateImage(TEST_PROMPT, { n: 1 });

    console.log('\n✅ Image generation successful!');
    console.log(`📊 Generated ${result.data.length} image(s)`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save generated images
    result.data.forEach((imageData, index) => {
      const timestamp = Date.now();
      const filename = `laozhang-test-${timestamp}-${index + 1}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      fs.writeFileSync(filepath, buffer);

      console.log(`💾 Saved image to: ${filepath}`);
      if (imageData.original_url) {
        console.log(`🔗 Original URL: ${imageData.original_url}`);
      }
    });

    // Display usage information if available
    if (result.usage) {
      console.log('\n📈 Usage statistics:');
      console.log(JSON.stringify(result.usage, null, 2));
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// Run Test
// ============================================================================

testImageGeneration();

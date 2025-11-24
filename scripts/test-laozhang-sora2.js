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
// Local Image to Base64 Helper
// ============================================================================

const imageToBase64 = (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/png';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    }
    
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }
};

// ============================================================================
// Image/Video URL Extraction Helper
// ============================================================================

const extractImageUrls = (content) => {
  // Match markdown image format: ![text](url)
  const imageRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  // Match markdown link format: [text](url) for any links (including video/download links)
  const linkRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/g;
  const urls = [];
  let match;

  // Extract image URLs
  while ((match = imageRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  // Extract video/download URLs from markdown links
  while ((match = linkRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
};

// ============================================================================
// Video Generation Function
// ============================================================================

const generateVideo = async (prompt, options = {}) => {
  try {
    console.log('🖼️ Generating video with laozhang.ai');
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

    // const testPrompt = `8 seconds; Dynamic cuts, bright, natural lighting. A hand holds a vibrant orange 'SuperBelly' daily nutrition pouch in a sleek, sustainable box. Text overlay: 'Free Year Supply of Vitamin D & 5 Free Travel Packs'. Cut to a charismatic man with a beard, glasses, and a orange cap, smiling and confidently holding the 'SuperBelly' pouch. Cut to a woman in a modern kitchen, effortlessly pouring water into a clear shaker bottle containing orange 'SuperBelly' powder, shaking it vigorously, and then smiling contentedly while holding the mixed drink. Cut back to the man, holding up a small dark orange dropper bottle of 'Liquid Vitamin D'. Aesthetic: Clean, modern, health-focused, approachable, vibrant. Camera movement: Rapid, deliberate cuts to maintain engagement. Pacing: Fast and energetic. Colors: Fresh orange, crisp white, earthy tones, bright natural lighting. Audio: Upbeat, friendly instrumental music throughout. Female voiceover: 'Remembering to take all of my supplements is a lot sometimes.' Male voiceover: 'I don't need to take a bunch of different things. It's all in here.' Female voiceover: 'All you have to do is scoop, mix, drink, and you're done.' Male voiceover: 'Order SuperBelly now to receive a year's supply of liquid Vitamin D and 5 free travel packs!`;
    const testPrompt = `8 seconds; vertical 9:16, handheld smartphone look with a 35mm‑equivalent lens, shallow depth of field. Quick‑cut UGC sequence showing SuperBelly Mango Passion Fruit.\nSubject + action: Scene 1 (0–1.5s) close-up of a mango‑yellow and passion‑fruit‑purple SuperBelly Mango Passion Fruit pouch standing upright in a recyclable cardboard insert; a hand enters from bottom right and lifts the pouch slightly, logo facing camera, label legible. Scene 2 (1.5–3s) medium shot of a young woman in a bright, natural‑light kitchen holding a clear reusable bottle filled with a vibrant mango‑orange drink; she smiles and looks into camera. Scene 3 (3–5s) medium shot of a young man in casual hoodie and cap holding the pouch, nodding and gesturing confidently to camera. Scene 4 (5–6.5s) overhead close-up: clear water pours into the bottle with SuperBelly powder, cap twists on, then vigorous shake; visible bubbles and swirling, a few condensation droplets. Scene 5 (6.5–8s) product hero: pouch beside the filled bottle on a light wood counter with minimal props (fresh mango slice and a halved passion fruit), soft light flare across the bottle; brand mark centered and sharp.\nAesthetic: clean, bright, authentic UGC; minimal, modern kitchen; subtle cool‑neutral grading; crisp texture.\nCamera movement: subtle handheld micro‑movements, natural breathing; hard cuts between scenes; slight overhead pan during pour.\nPacing: fast, rhythmic edits in time with actions (lift, smile, gesture, pour, shake, hero hold). \nColors: mango yellow, passion‑fruit purple, vivid citrus orange, white walls, light wood neutrals; accurate skin tones and high contrast.\nAudio: upbeat, light electronic pop bed at low volume; realistic foley for pouch rustle, water pour, cap twist, and bottle shake; clean voiceover.\nText overlay: clean sans‑serif, high‑contrast captions. 0.2–1.2s top-left: “SuperBelly Mango Passion Fruit”. 1.6–3.0s lower-third: “More than a daily probiotic”. 6.6–8.0s bottom-center: “Daily gut‑friendly drink — Tap to try”.\nDialogue: Female VO 0.0s: “Remembering to take all of my supplements is a lot sometimes.” Female VO 1.6s: “And this is so much more than just a probiotic.” Male VO 3.0s: “This helps me support my gut, digestion, and steady energy.” Male VO 6.6s: “Try SuperBelly Mango Passion Fruit today.”\nEnd with: CTA visual and audio: final hero shot holds for ~1.4s while music hits a soft button; a subtle pulse appears around a button‑style graphic reading “Shop now”; bottle catches a gentle light glint; VO tag: “Tap to try.”`;

    // Prepare the API request payload
    const requestPayload = {
      model: 'sora-2',
      n: 1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: testPrompt,
            },
          ],
        },
      ],
    };

    // Add reference image if provided
    if (options.referenceImage) {
      console.log(`🖼️ Adding reference image: ${options.referenceImage}`);
      const imageBase64 = imageToBase64(options.referenceImage);
      requestPayload.messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: imageBase64,
        },
      });
      console.log('✅ Reference image added to request');
    }

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
    console.log(JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received from laozhang.ai API');
    }

    // Extract image URLs from the response
    const content = response.choices[0].message.content;
    const imageUrls = extractImageUrls(content);

    if (imageUrls.length === 0) {
      throw new Error('No image or video URLs found in laozhang.ai API response');
    }

    console.log(`📸 Found ${imageUrls.length} media URL(s) in response`);

    // Download all images/videos and convert to base64
    const imageData = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log(`⬇️ Downloading media file ${i + 1}/${imageUrls.length}...`);

      try {
        const base64Data = await downloadImageAsBase64(url);
        imageData.push({
          b64_json: base64Data,
          original_url: url,
        });
        console.log(`✅ Successfully downloaded media file ${i + 1}`);
      } catch (downloadError) {
        console.error(
          `❌ Failed to download media file ${i + 1}: ${downloadError.message}`,
        );
        throw new Error(
          `Failed to download media from ${url}: ${downloadError.message}`,
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

const TEST_PROMPT = `8 seconds; Dynamic cuts, bright, natural lighting. A hand holds a vibrant orange 'SuperBelly' daily nutrition pouch in a sleek, sustainable box. Text overlay: 'Free Year Supply of Vitamin D & 5 Free Travel Packs'. Cut to a charismatic man with a beard, glasses, and a orange cap, smiling and confidently holding the 'SuperBelly' pouch. Cut to a woman in a modern kitchen, effortlessly pouring water into a clear shaker bottle containing orange 'SuperBelly' powder, shaking it vigorously, and then smiling contentedly while holding the mixed drink. Cut back to the man, holding up a small dark orange dropper bottle of 'Liquid Vitamin D'. Aesthetic: Clean, modern, health-focused, approachable, vibrant. Camera movement: Rapid, deliberate cuts to maintain engagement. Pacing: Fast and energetic. Colors: Fresh orange, crisp white, earthy tones, bright natural lighting. Audio: Upbeat, friendly instrumental music throughout. Female voiceover: 'Remembering to take all of my supplements is a lot sometimes.' Male voiceover: 'I don't need to take a bunch of different things. It's all in here.' Female voiceover: 'All you have to do is scoop, mix, drink, and you're done.' Male voiceover: 'Order SuperBelly now to receive a year's supply of liquid Vitamin D and 5 free travel packs!`;
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

    console.log('⏳ Generating video...\n');

    // Prepare reference image path
    const referenceImagePath = path.join(__dirname, 'superbelly.png');
    
    // Check if reference image exists
    if (!fs.existsSync(referenceImagePath)) {
      throw new Error(`Reference image not found at: ${referenceImagePath}`);
    }
    
    
    console.log(`🖼️ Using reference image: ${referenceImagePath}\n`);

    // Call the image generation function with reference image
    const result = await generateVideo(TEST_PROMPT, { 
      n: 1,
      duration: 15,
      referenceImage: referenceImagePath 
    });

    console.log('\n✅ Video generation successful!');
    console.log(`📊 Generated ${result.data.length} video(s)`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save generated images/videos
    result.data.forEach((imageData, index) => {
      const timestamp = Date.now();
      // Determine file extension based on original URL
      const isVideo = imageData.original_url && imageData.original_url.endsWith('.mp4');
      const extension = isVideo ? 'mp4' : 'png';
      const filename = `laozhang-test-${timestamp}-${index + 1}.${extension}`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      fs.writeFileSync(filepath, buffer);

      console.log(`💾 Saved ${isVideo ? 'video' : 'image'} to: ${filepath}`);
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

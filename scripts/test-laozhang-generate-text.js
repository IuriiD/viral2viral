/* eslint-disable no-undef */
/**
 * Test script for laozhang.ai text generation API
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY environment variable
 * 2. Run: node scripts/test-laozhang-generate-text.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

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
// Text Generation Function
// ============================================================================

const generateText = async (prompt, options = {}) => {
  try {
    console.log('💬 Generating text with laozhang.ai');
    console.log(`📝 Prompt: ${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`);

    // Validate inputs
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Set default options
    const defaultOptions = {
      model: 'gpt-5',
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Merge default options with provided options
    const textOptions = {
      ...defaultOptions,
      ...options,
    };

    // Prepare the API request payload
    const requestPayload = {
      model: textOptions.model,
      temperature: textOptions.temperature,
      max_tokens: textOptions.max_tokens,
      messages: [
        {
          role: 'user',
          content: prompt,
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
    console.log(JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received from laozhang.ai API');
    }

    // Extract text content from the response
    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('No content found in laozhang.ai API response');
    }

    console.log('✅ Successfully generated text with laozhang.ai');

    // Return response in OpenAI-compatible format
    return {
      content: content,
      usage: response.usage,
      model: response.model,
      finish_reason: response.choices[0].finish_reason,
    };
  } catch (error) {
    console.error(`❌ Error generating text with laozhang.ai: ${error.message}`);
    throw new Error(
      `Failed to generate text with laozhang.ai: ${error.message}`,
    );
  }
};

// ============================================================================
// Test Configuration
// ============================================================================

const PROMPT_TEMPLATE = `You are an expert AI video prompt engineer specializing in Sora 2. 
Below isn a detailed description of an existing viral UGC video which includes scene breakdown and Dialogue/voiceover.
[[SCENE_BREAKDOWN]]

Your task is to analyze all the scenes and generate a single, detailed video generation prompt that Sora could use to recreate the 8-second video but tailored for a product [[PRODUCT_DESCRIPTION]].
Format as: "[Duration] seconds; [Camera style/lens]. [Subject + action]. Aesthetic: [visual style]. Camera movement: [specific movements]. Pacing: [fast/medium/slow with rhythm description]. Colors: [palette]. Audio: [music/sound style]. Text overlay: [if needed]. Dialogue: [original dialogue but adapted for [[PRODUCT_DESCRIPTION]]]. End with: [CTA visual and audio].

Please respond with a valid JSON object only with a key "prompt" containing the generated prompt.
The "prompt" value should be a complete, ready-to-use prompt for text-to-video generation, without any conversational filler.
`;

const productDescription = 'SuperBelly Mango Passion Fruit';
const sceneBreakdown = JSON.stringify({
  "sceneBreakdown": [
    {
      "Timestamp from original video": "0:00",
      "Duration": "1.5s",
      "Scene Purpose": "Hook/Problem",
      "Visual Details": {
        "Camera angle and movement": "Medium close-up, slightly tilted down, hand holding AG1 pouch enters from bottom right, moves slightly up.",
        "Subject positioning and action": "Hand holding a large green AG1 pouch, which is standing upright in a cardboard box insert.",
        "Lighting": "Bright, even, natural light, no harsh shadows. White balance suggests daylight.",
        "Color palette": "Dominantly dark green (AG1 pouch, box), white (AG1 logo text), light brown (cardboard), cool grading.",
        "On-screen elements": "Large white 'AG1' logo with a green 'TH' symbol. Text on pouch: 'Comprehensive + Convenient Daily Nutrition'. Yellow-green text overlay: 'Free Year Supply of Vitamin D & 5 Free Travel Packs'. 'TikTok: Business Creative Center' watermarks.",
        "Visual effects or transitions": "None, direct cut."
      },
      "Cinematic Details": {
        "Shot type": "Medium close-up/Detail shot",
        "Pacing/rhythm": "Slow, steady visual.",
        "Style and aesthetic": "Product demo, informative, clean."
      },
      "Audio Details": {
        "Dialogue/voiceover": "Remembering to take all of my supplements is a lot sometimes.",
        "Sound design": "Upbeat, light background music, female voice is calm and conversational.",
        "Timing": "Dialogue starts immediately with the visual."
      }
    },
    {
      "Timestamp from original video": "0:03",
      "Duration": "1.5s",
      "Scene Purpose": "Solution",
      "Visual Details": {
        "Camera angle and movement": "Medium shot, static camera, eye-level.",
        "Subject positioning and action": "Young woman with long brown hair, white t-shirt, standing in a bright room, holding a green AG1 bottle with a green liquid. She smiles and looks directly at the camera.",
        "Lighting": "Bright, natural light, soft shadows, warm-neutral color temperature.",
        "Color palette": "White (t-shirt, background wall), green (drink, bottle), natural skin tones, warm grading.",
        "On-screen elements": "Yellow-green text overlay: 'Free Year Supply of Vitamin D & 5 Free Travel Packs'. 'TikTok: Business Creative Center' watermarks.",
        "Visual effects or transitions": "None, direct cut."
      },
      "Cinematic Details": {
        "Shot type": "Medium shot",
        "Pacing/rhythm": "Moderate, engaging.",
        "Style and aesthetic": "Vlog/influencer style, product demonstration."
      },
      "Audio Details": {
        "Dialogue/voiceover": "And this is so much more than just a greens powder.",
        "Sound design": "Upbeat background music continues, female voice is energetic and positive.",
        "Timing": "Dialogue starts immediately with the visual."
      }
    },
    {
      "Timestamp from original video": "0:11.5",
      "Duration": "2s",
      "Scene Purpose": "Solution/Benefit",
      "Visual Details": {
        "Camera angle and movement": "Medium shot, static camera, eye-level.",
        "Subject positioning and action": "Young man with a beard, glasses, and a green cap, wearing a blue zip-up hoodie over a green t-shirt. He holds an AG1 pouch, smiles, and gestures towards the camera.",
        "Lighting": "Bright, even lighting, subtle shadows, neutral color temperature.",
        "Color palette": "Blue (hoodie), green (cap, shirt, pouch), natural skin tones, white (background wall), cool-neutral grading.",
        "On-screen elements": "'AG1' pouch prominently displayed. 'TikTok: Business Creative Center' watermarks.",
        "Visual effects or transitions": "None, direct cut."
      },
      "Cinematic Details": {
        "Shot type": "Medium shot",
        "Pacing/rhythm": "Moderate, informative.",
        "Style and aesthetic": "Vlog/influencer style, testimonial."
      },
      "Audio Details": {
        "Dialogue/voiceover": "This helps me support my immune system, my gut health, and energy,",
        "Sound design": "Upbeat background music continues, male voice is clear and enthusiastic.",
        "Timing": "Dialogue starts immediately with the visual."
      }
    },
    {
      "Timestamp from original video": "0:24",
      "Duration": "1.5s",
      "Scene Purpose": "Solution/Ease of Use",
      "Visual Details": {
        "Camera angle and movement": "Close-up, overhead shot, slight pan as the bottle is picked up and shaken.",
        "Subject positioning and action": "Hand pouring clear water into a glass bottle containing green AG1 liquid, then capping and shaking the bottle vigorously.",
        "Lighting": "Bright, even overhead light, minimal shadows, neutral color temperature.",
        "Color palette": "Green (liquid), clear (water, bottle), light grey (countertop), metallic (bottle lid), cool grading.",
        "On-screen elements": "'TikTok: Business Creative Center' watermarks.",
        "Visual effects or transitions": "None, direct cut."
      },
      "Cinematic Details": {
        "Shot type": "Close-up/Detail shot",
        "Pacing/rhythm": "Fast, quick action.",
        "Style and aesthetic": "Product demonstration, instructional."
      },
      "Audio Details": {
        "Dialogue/voiceover": "None (visuals and sound effects are key here).",
        "Sound design": "Pouring sound, liquid gurgling, shaking sound (strong, distinct). Background music continues, slightly louder to emphasize action.",
        "Timing": "Sounds synchronized with visual actions."
      }
    },
    {
      "Timestamp from original video": "0:28.5",
      "Duration": "1.5s",
      "Scene Purpose": "CTA",
      "Visual Details": {
        "Camera angle and movement": "Medium shot for man, then quick cut to close-up for travel packs. Man holds the bottle, then the shot transitions to a flat lay of the travel packs.",
        "Subject positioning and action": "Man holding a small dark green dropper bottle (Vitamin D), smiling. Immediately followed by a flat lay of five dark green AG1 travel packs on a wooden surface.",
        "Lighting": "Bright, even lighting for both shots, neutral color temperature.",
        "Color palette": "Dark green (bottle, packs), natural skin tones (man), light brown wood (surface for packs), cool-neutral grading.",
        "On-screen elements": "Bottle label 'D3 + K2'. Text on packs: 'Comprehensive + Convenient Daily Nutrition'. 'TikTok: Business Creative Center' watermarks.",
        "Visual effects or transitions": "Quick cut between the Vitamin D bottle and the travel packs."
      },
      "Cinematic Details": {
        "Shot type": "Medium shot (man), Close-up (packs)",
        "Pacing/rhythm": "Fast, urgent for CTA.",
        "Style and aesthetic": "Product offer, direct marketing."
      },
      "Audio Details": {
        "Dialogue/voiceover": "you'll receive this year supply of this liquid Vitamin D and five free travel packs.",
        "Sound design": "Upbeat background music continues, male voice is clear and persuasive.",
        "Timing": "Dialogue starts immediately with the visual."
      }
    }
  ]
});
const TEST_PROMPT = PROMPT_TEMPLATE
  .replace('[[SCENE_BREAKDOWN]]', sceneBreakdown)
  .replaceAll('[[PRODUCT_DESCRIPTION]]', productDescription);

// ============================================================================
// Test Function
// ============================================================================

async function testTextGeneration() {
  console.log('🧪 Starting laozhang.ai text generation test...\n');

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. Please set it before running this test.',
      );
    }

    console.log('⏳ Generating text...\n');

    // Call the text generation function
    const result = await generateText(TEST_PROMPT, {
      model: 'gpt-5',
      temperature: 0.7,
      max_tokens: 4000,
    });

    console.log('\n✅ Text generation successful!');
    console.log('\n📄 Generated Content:');
    console.log('─'.repeat(80));
    console.log(result.content);
    console.log('─'.repeat(80));

    // Display model information
    if (result.model) {
      console.log(`\n🤖 Model used: ${result.model}`);
    }

    // Display finish reason
    if (result.finish_reason) {
      console.log(`🏁 Finish reason: ${result.finish_reason}`);
    }

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

testTextGeneration();

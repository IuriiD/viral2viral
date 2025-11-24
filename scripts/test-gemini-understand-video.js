import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import path from "path";

const fileName = 'sample_file.mp4';
const productName = 'SuperBelly';

const ai = new GoogleGenAI({});
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const base64VideoFile = fs.readFileSync(
  path.join(__dirname, fileName),
  { encoding: "base64" }
);

const promptTemplate1 = `You are analyzing a video to extract key scenes for recreating an 8-second viral video using AI video generation tools. Your output will be used directly as a prompt for Sora or similar text-to-video generators.
Focus ONLY on the most impactful, engaging moments that follow this viral video structure:
HOOK (0-2 seconds): Opening that stops the scroll - visually striking, unexpected, or emotionally compelling
PROBLEM (2-4 seconds): State or show the core issue your audience faces
SOLUTION (4-7 seconds): Demonstrate or explain the solution/value proposition
CTA (7-8 seconds): Clear call-to-action directing viewers what to do next
Ignore filler, transitions, credits, or non-essential content. Prioritize intensity, visual impact, and message clarity.
For each scene, provide:
SCENE BREAKDOWN:
[Timestamp from original video]
Duration: [seconds needed in 8-sec format]
Scene Purpose: [Hook/Problem/Solution/CTA]
Visual Details:
Camera angle and movement: [specific framing and any dolly, pan, or zoom]
Subject positioning and action: [what's happening, who/what is visible, direction of movement]
Lighting: [dominant color temperature, intensity, shadows, mood]
Color palette: [primary colors, grading, emotional tone]
On-screen elements: [text, graphics, overlays, props visible]
Visual effects or transitions: [any special effects, cuts, or stylistic elements]
Cinematic Details:
Shot type: [wide, medium, close-up, detail shot]
Pacing/rhythm: [speed of action, cut timing]
Style and aesthetic: [documentary, cinematic, animated, product demo, etc.]
Audio Details:
Dialogue/voiceover: [exact words if present, tone, emotional delivery]
Sound design: [music genre, ambient sounds, sound effects, music intensity]
Timing: [when sounds occur relative to visuals]
Final 8-Second Video Prompt:
[After analyzing all scenes, synthesize into a single, detailed video generation prompt that Sora could use to recreate the 8-second video. Format as: "[Duration] seconds; [Camera style/lens]. [Subject + action]. Aesthetic: [visual style]. Camera movement: [specific movements]. Pacing: [fast/medium/slow with rhythm description]. Colors: [palette]. Audio: [music/sound style]. Text overlay: [if needed]. End with: [CTA visual and audio]."]
IMPORTANT REQUIREMENTS:
Prioritize the MOST COMPELLING moment from each phase (Hook, Problem, Solution, CTA).
If the original video exceeds 8 seconds, condense by eliminating redundancy and keeping only the absolute best moments.
Ensure smooth visual and narrative flow between scenes.
The final output should be a complete, ready-to-use prompt for text-to-video generation.
Maintain the original video's core message and visual identity.
Replace the name of the product with [[PRODUCT_NAME]] in the final prompt.
Optimize for maximum virality: emotional impact, pattern interrupts, clarity, and urgency`;

const promptTemplate2 = `You are an expert AI video prompt engineer specializing in Sora 2. Your task is to analyze a provided video and generate a single, high-fidelity text-to-video prompt based on the provided video concept.

**YOUR GOAL:**
Create one continuous, highly detailed prompt that recreates an 8-second viral video. You must compress the narrative into this specific structure:
1.  **HOOK (0-2s):** Visually striking or unexpected scroll-stopper.
2.  **PROBLEM (2-4s):** The core issue or friction point.
3.  **SOLUTION (4-7s):** Value proposition and satisfaction.
4.  **CTA (7-8s):** Clear visual instruction on what to do next.

**OUTPUT FORMAT:**
Return ONLY the final prompt string. Do not include "Here is the prompt," scene breakdowns, explanations, or timestamps. Start directly with the duration.

**PROMPT CONSTRUCTION GUIDELINES:**
* **Format:** "[Duration] seconds. [Cinematic Style/Lens]. [Visual Flow & Action]. Lighting: [Details]. Colors: [Palette]. Camera: [Movement]. Audio: [Sound design/Dialogue]. Text Overlay: [Text details]."
* **Content:** Seamlessly blend the Hook, Problem, Solution, and CTA into a fluid visual narrative.
* **Placeholders:** Replace the specific product name with [[PRODUCT_NAME]].
* **Quality:** Use photorealistic, cinematic adjectives. Focus on lighting, texture, and specific camera movements (dolly, pan, rack focus).

**STRICT CONSTRAINTS:**
* If the input is longer than 8 seconds, condense it to the best 8 seconds.
* Output **strictly** the final text block. No conversational filler.`;

const promptTemplate3 = `You are an expert AI video prompt engineer specializing in Sora 2. Your task is to analyze a provided video and generate a single, high-fidelity text-to-video prompt based on the provided video concept.
Generate a Sora 2 prompt to recreate this exact 9:16 Tiktok UGC video with realistic camera movement, lightning and mood, but for a different product called [[PRODUCT_NAME]].`;


const promptTemplate4 = `You are analyzing a video to extract key scenes for recreating an 8-second viral video using AI video generation tools. Your output will be used directly as a prompt for Sora or similar text-to-video generators.
Focus ONLY on the most impactful, engaging moments that follow this viral video structure:
HOOK (0-2 seconds): Opening that stops the scroll - visually striking, unexpected, or emotionally compelling
PROBLEM (2-4 seconds): State or show the core issue your audience faces
SOLUTION (4-7 seconds): Demonstrate or explain the solution/value proposition
CTA (7-8 seconds): Clear call-to-action directing viewers what to do next
Ignore filler, transitions, credits, or non-essential content. Prioritize intensity, visual impact, and message clarity.
Respond with a final 8-Second Video Prompt that Sora could use to recreate the 8-second video:
Format as: "[Duration] seconds; [Camera style/lens]. [Subject + action]. Aesthetic: [visual style]. Camera movement: [specific movements]. Pacing: [fast/medium/slow with rhythm description]. Colors: [palette]. Audio: [music/sound style]. Text overlay: [if needed]. Dialogue/voiceover. End with: [CTA visual and audio]."]
IMPORTANT REQUIREMENTS:
Prioritize the MOST COMPELLING moment from each phase (Hook, Problem, Solution, CTA).
If the original video exceeds 8 seconds, condense by eliminating redundancy and keeping only the absolute best moments.
Ensure smooth visual and narrative flow between scenes.
The final output should be a complete, ready-to-use prompt for text-to-video generation. Output **strictly** the final text block. No conversational filler.
Maintain the original video's core message and visual identity.
Replace the name of the product with [[PRODUCT_NAME]] in the final prompt.
Optimize for maximum virality: emotional impact, pattern interrupts, clarity, and urgency`;

const promptTemplate5 = `You are analyzing a video to extract key scenes for recreating an 8-second viral video using AI video generation tools. Your output will be used directly as a prompt for Sora or similar text-to-video generators.
Focus ONLY on the most impactful, engaging moments that follow this viral video structure:
HOOK (0-2 seconds): Opening that stops the scroll - visually striking, unexpected, or emotionally compelling
PROBLEM (2-4 seconds): State or show the core issue your audience faces
SOLUTION (4-7 seconds): Demonstrate or explain the solution/value proposition
CTA (7-8 seconds): Clear call-to-action directing viewers what to do next
Ignore filler, transitions, credits, or non-essential content. Prioritize intensity, visual impact, and message clarity.

You must respond with a valid JSON object containing the scene breakdown and the final 8-second video prompt, like so:
{
  "sceneBreakdown": "",
  "finalPrompt": ""
}

For each scene, provide:
SCENE BREAKDOWN:
[Timestamp from original video]
Duration: [seconds needed in 8-sec format]
Scene Purpose: [Hook/Problem/Solution/CTA]
Visual Details:
Camera angle and movement: [specific framing and any dolly, pan, or zoom]
Subject positioning and action: [what's happening, who/what is visible, direction of movement]
Lighting: [dominant color temperature, intensity, shadows, mood]
Color palette: [primary colors, grading, emotional tone]
On-screen elements: [text, graphics, overlays, props visible]
Visual effects or transitions: [any special effects, cuts, or stylistic elements]
Cinematic Details:
Shot type: [wide, medium, close-up, detail shot]
Pacing/rhythm: [speed of action, cut timing]
Style and aesthetic: [documentary, cinematic, animated, product demo, etc.]
Audio Details:
Dialogue/voiceover: [exact words if present, tone, emotional delivery]
Sound design: [music genre, ambient sounds, sound effects, music intensity]
Timing: [when sounds occur relative to visuals]
Final 8-Second Video Prompt:
[After analyzing all scenes, synthesize into a single, detailed video generation prompt that Sora could use to recreate the 8-second video. Format as: "[Duration] seconds; [Camera style/lens]. [Subject + action]. Aesthetic: [visual style]. Camera movement: [specific movements]. Pacing: [fast/medium/slow with rhythm description]. Colors: [palette]. Audio: [music/sound style]. Text overlay: [if needed]. End with: [CTA visual and audio]."]

IMPORTANT REQUIREMENTS:
Prioritize the MOST COMPELLING moment from each phase (Hook, Problem, Solution, CTA).
If the original video exceeds 8 seconds, condense by eliminating redundancy and keeping only the absolute best moments.
Ensure smooth visual and narrative flow between scenes.
Maintain the original video's core message and visual identity.
Replace the name of the product with [[PRODUCT_NAME]] in the final prompt.
Optimize for maximum virality: emotional impact, pattern interrupts, clarity, and urgency.
Respond with a valid JSON with 2 keys, "sceneBreakdown" and "finalPrompt", without any additional explanation or text outside the JSON object.
The finalPrompt should be a complete, ready-to-use prompt for text-to-video generation, without any conversational filler.
`;

const promptTemplate = `You are analyzing a video to extract key scenes for recreating an 8-second viral video using AI video generation tools. Your output will be used directly as a prompt for Sora or similar text-to-video generators.
Focus ONLY on the most impactful, engaging moments. Ignore filler, transitions, credits, or non-essential content. Prioritize intensity, visual impact, and message clarity.

You must respond with a valid JSON object with a single key "sceneBreakdown" containing the scene breakdown, like so:
{
  "sceneBreakdown": ""
}

For each scene, provide:
SCENE BREAKDOWN:
[Timestamp from original video]
Duration: [seconds needed in 8-sec format]
Scene Purpose: [Hook/Problem/Solution/CTA]
Visual Details:
Camera angle and movement: [specific framing and any dolly, pan, or zoom]
Subject positioning and action: [what's happening, who/what is visible, direction of movement]
Lighting: [dominant color temperature, intensity, shadows, mood]
Color palette: [primary colors, grading, emotional tone]
On-screen elements: [text, graphics, overlays, props visible]
Visual effects or transitions: [any special effects, cuts, or stylistic elements]
Cinematic Details:
Shot type: [wide, medium, close-up, detail shot]
Pacing/rhythm: [speed of action, cut timing]
Style and aesthetic: [documentary, cinematic, animated, product demo, etc.]
Audio Details:
Dialogue/voiceover: [exact words if present, tone, emotional delivery]
Sound design: [music genre, ambient sounds, sound effects, music intensity]
Timing: [when sounds occur relative to visuals]

IMPORTANT REQUIREMENTS:
Maintain the original video's core message and visual identity.
Optimize for maximum virality: emotional impact, pattern interrupts, clarity, and urgency.
Respond with a valid JSON with 1 key "sceneBreakdown", without any additional explanation or text outside the JSON object.
`;

const prompt = promptTemplate.replace('[[PRODUCT_NAME]]', productName);

const contents = [
  {
    inlineData: {
      mimeType: "video/mp4",
      data: base64VideoFile,
    },
  },
  { text: prompt }
];
console.log("Generated prompt:", prompt);

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: contents,
});

console.log(JSON.stringify(response, null, 2));
console.log(response.text);

/**
Example output - 1:

{
  "sdkHttpResponse": {
    "headers": {
      "alt-svc": "h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000",
      "content-encoding": "gzip",
      "content-type": "application/json; charset=UTF-8",
      "date": "Sun, 23 Nov 2025 16:50:30 GMT",
      "server": "scaffolding on HTTPServer2",
      "server-timing": "gfet4t7; dur=32405",
      "transfer-encoding": "chunked",
      "vary": "Origin, X-Origin, Referer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
      "x-xss-protection": "0"
    }
  },
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "SCENE BREAKDOWN:\n\n**1. Hook**\n[0:00-0:01.5]\nDuration: 1.5 seconds\nScene Purpose: Hook\nVisual Details:\nCamera angle and movement: Medium close-up, slight upward pan as the pouch is revealed.\nSubject positioning and action: A hand (with a silver ring) pulls a dark green stand-up pouch, labeled \"SuperBelly\" (replacing \"AG1\"), from a dark green product box with internal cardboard dividers. The pouch is the central focus.\nLighting: Bright, even indoor lighting.\nColor palette: Dominantly dark green (product, box), with white text on the pouch. The background is a light, neutral color.\nOn-screen elements: Text overlay: \"Free Year Supply of Vitamin D & 5 Free Travel Packs\".\nVisual effects or transitions: Direct cut.\nCinematic Details:\nShot type: Medium close-up/product reveal.\nPacing/rhythm: Medium, revealing.\nStyle and aesthetic: Product unboxing/demonstration, clean, modern.\nAudio Details:\nDialogue/voiceover: \"Remembering to take all of my supplements is a lot sometimes.\" (starts at 0:00.8, cuts off at 0:02.0)\nSound design: Upbeat, modern, gentle background music with a light drum beat and synth elements.\nTiming: Voiceover starts almost immediately.\n\n**2. Problem**\n[0:04-0:05.5]\nDuration: 1.5 seconds\nScene Purpose: Problem\nVisual Details:\nCamera angle and movement: Medium shot, static.\nSubject positioning and action: A young woman with long dark hair, wearing a white t-shirt, stands in a brightly lit room. She holds a dark green bottle with a green drink inside, looking directly at the camera with a confident, slightly smiling expression.\nLighting: Bright, natural-looking indoor lighting.\nColor palette: White shirt, green bottle/drink, light neutral walls, warm wood tones in the background. Overall bright and fresh.\nOn-screen elements: Text overlay: \"Free Year Supply of Vitamin D & 5 Free Travel Packs\".\nVisual effects or transitions: Direct cut.\nCinematic Details:\nShot type: Medium shot.\nPacing/rhythm: Steady.\nStyle and aesthetic: Lifestyle, testimonial, clean.\nAudio Details:\nDialogue/voiceover: \"It's got all of your vitamins, minerals, probiotics.\" (starts at 0:05.0, cuts off after \"probiotics\" at 0:06.5)\nSound design: Same upbeat background music continues.\nTiming: Voiceover starts after the visual has established the subject.\n\n**3. Solution**\n[0:23-0:26]\nDuration: 3 seconds\nScene Purpose: Solution\nVisual Details:\nCamera angle and movement: Starts with a medium shot of the woman pointing to the bottle, then cuts to a close-up of water being poured into the bottle, then a quick shot of her shaking the bottle, then back to a medium shot of her smiling after drinking.\nSubject positioning and action: Woman points to bottle. Close-up of hands pouring water from a measuring spoon into the green drink bottle. The bottle is then capped and shaken briefly, followed by the woman (in a white t-shirt) smiling confidently, holding the green bottle.\nLighting: Bright, even indoor lighting, consistent across cuts.\nColor palette: Green bottle/drink, clear water, light kitchen countertops.\nOn-screen elements: None.\nVisual effects or transitions: Quick cuts between pointing, pouring, shaking, and smiling.\nCinematic Details:\nShot type: Medium shot, close-up, medium shot. Rapid cuts.\nPacing/rhythm: Fast-paced, demonstrating quick usage.\nStyle and aesthetic: Product demonstration, energetic, efficient.\nAudio Details:\nDialogue/voiceover: \"All you have to do is scoop, mix, drink, and you're done. No more taking a bunch of different things, it's all in here.\" (Original voiceover \"All you have to do is scoop, mix, drink, and you're done\" combined with \"it's all in here\" from 0:08.5 for impact.)\nSound design: Same background music, subtle sound effects of pouring liquid and shaking a bottle.\nTiming: Voiceover guides the visual sequence.\n\n**4. CTA**\n[0:28-0:29 (man) + 0:30-0:31 (travel packs) + 0:34-0:35 (woman drinking)]\nDuration: 2 seconds\nScene Purpose: CTA\nVisual Details:\nCamera angle and movement: Starts with a medium close-up of a man holding a small green liquid Vitamin D bottle, smiling confidently. Then a quick cut to a close-up of five \"SuperBelly\" travel packs laid out on a wooden surface. Ends with a quick medium shot of the woman (now in a blue top) taking a satisfied sip from her green \"SuperBelly\" bottle.\nSubject positioning and action: Man presents product. Travel packs are shown. Woman drinks.\nLighting: Bright, even indoor lighting.\nColor palette: Green bottles/packs, neutral backgrounds.\nOn-screen elements: None.\nVisual effects or transitions: Rapid cuts.\nCinematic Details:\nShot type: Medium close-up, detail shot, medium shot. Very fast cuts.\nPacing/rhythm: Extremely fast, urgent.\nStyle and aesthetic: Promotional, direct, urgent.\nAudio Details:\nDialogue/voiceover: \"Order SuperBelly now for a free year supply of Vitamin D and travel packs! Check it out!\" (Condensed from original dialogue for brevity and urgency).\nSound design: Same upbeat background music intensifies slightly, with a final uplifting flourish.\nTiming: Voiceover is punchy and direct, matching quick visuals.\n\n---\n\n**Final 8-Second Video Prompt:**\n\n8 seconds; Dynamic, clean lens. A hand pulls out a dark green \"SuperBelly\" pouch from a matching box, revealing the product. Followed by a confident young woman in a white t-shirt holding a green SuperBelly drink bottle, looking directly at the camera. Then, quick cuts: the woman points to the bottle, water pours into the bottle from a measuring spoon, the bottle is shaken, and she smiles after drinking. Finally, a man smiles, holding up a small liquid Vitamin D bottle, quickly cutting to a stack of five SuperBelly travel packs, and ending with the woman in a blue top taking a satisfied sip from her SuperBelly drink. Aesthetic: Modern, clean product demo with lifestyle elements. Camera movement: Slight upward pan on reveal, static shots for testimonial, rapid cuts and close-ups for demonstration, and fast cuts for CTA. Pacing: Fast-paced, energetic, with quick cuts to convey efficiency and urgency. Colors: Dominantly vibrant dark green, clean whites, and warm natural wood tones. Audio: Upbeat, modern, synth-pop background music throughout, with subtle sounds of liquid pouring and bottle shaking. Dialogue: \"Remembering to take all my supplements is a lot sometimes. This is so much more, it's got all your vitamins, minerals, probiotics. All you have to do is scoop, mix, drink, and you're done. No more taking a bunch of different things, it's all in here. Order SuperBelly now for a free year supply of Vitamin D and travel packs! Check it out!\" Text overlay: (0-3 seconds) \"Free Year Supply of Vitamin D & 5 Free Travel Packs\". End with: Visual of woman drinking SuperBelly, positive audio tone for \"Check it out!\"."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "modelVersion": "gemini-2.5-flash",
  "responseId": "VjsjacygJ8SVvdIP9orEgQE",
  "usageMetadata": {
    "promptTokenCount": 11546,
    "candidatesTokenCount": 1661,
    "totalTokenCount": 17649,
    "promptTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 654
      },
      {
        "modality": "VIDEO",
        "tokenCount": 9731
      },
      {
        "modality": "AUDIO",
        "tokenCount": 1161
      }
    ],
    "thoughtsTokenCount": 4442
  }
}

Final 8-Second Video Prompt:**\n\n8 seconds; Dynamic, clean lens. A hand pulls out a dark green \"SuperBelly\" pouch from a matching box, revealing the product. Followed by a confident young woman in a white t-shirt holding a green SuperBelly drink bottle, looking directly at the camera. Then, quick cuts: the woman points to the bottle, water pours into the bottle from a measuring spoon, the bottle is shaken, and she smiles after drinking. Finally, a man smiles, holding up a small liquid Vitamin D bottle, quickly cutting to a stack of five SuperBelly travel packs, and ending with the woman in a blue top taking a satisfied sip from her SuperBelly drink. Aesthetic: Modern, clean product demo with lifestyle elements. Camera movement: Slight upward pan on reveal, static shots for testimonial, rapid cuts and close-ups for demonstration, and fast cuts for CTA. Pacing: Fast-paced, energetic, with quick cuts to convey efficiency and urgency. Colors: Dominantly vibrant dark green, clean whites, and warm natural wood tones. Audio: Upbeat, modern, synth-pop background music throughout, with subtle sounds of liquid pouring and bottle shaking. Dialogue: \"Remembering to take all my supplements is a lot sometimes. This is so much more, it's got all your vitamins, minerals, probiotics. All you have to do is scoop, mix, drink, and you're done. No more taking a bunch of different things, it's all in here. Order SuperBelly now for a free year supply of Vitamin D and travel packs! Check it out!\" Text overlay: (0-3 seconds) \"Free Year Supply of Vitamin D & 5 Free Travel Packs\". End with: Visual of woman drinking SuperBelly, positive audio tone for \"Check it out!\

 */

/**
 * Example output - 2:
 8 seconds. Cinematic style, macro lens focus with shallow depth of field, bright, clean aesthetic. Opens with a top-down, slightly angled shot of a sleek, dark green SuperBelly pouch nestled within minimalist, eco-friendly packaging. A slender hand gracefully lifts the pouch, revealing the "Comprehensive + Convenient Daily Nutrition" text. A quick, smooth cut transitions to a well-lit kitchen counter cluttered with various supplement bottles, signifying overwhelm, then a rack focus sharply zeroes in on a single SuperBelly bottle, held by a woman with a relieved, confident smile. The scene then dynamically cuts to a close-up of a spoonful of vibrant green SuperBelly powder dropping into a clear shaker bottle, followed by a gentle pour of pristine water. The bottle is then vigorously yet elegantly shaken, creating a smooth, inviting green liquid. The final shot is an artfully arranged flat lay on a warm wooden surface featuring the SuperBelly pouch alongside a small, elegant dropper bottle labeled "liquid Vitamin D" and five individual, perfectly stacked SuperBelly "travel packs." Lighting: Soft, natural studio lighting highlights the texture of the packaging and the vibrance of the powder, maintaining an airy and clean ambiance throughout. Colors: Dominantly deep forest green, crisp white, and warm natural wood tones, accented by the bright, energetic green of the SuperBelly mixture. Camera: Slow, deliberate dolly in on the initial pouch, followed by a quick cut and smooth rack focus. Dynamic, handheld-style close-ups for the powder, water, and shaking, concluding with a static, clean overhead shot for the final product display. Audio: Gentle, uplifting acoustic background music plays throughout. Soft rustling sounds as the pouch is handled, a subtle "whoosh" during the rack focus transition, delicate powder falling, smooth water pouring, and a satisfying, rhythmic shake. The music swells slightly for the final CTA. Text Overlay: "Juggling too many daily supplements?" appears subtly at 0-2s, fading as the problem is shown visually. "All-in-one daily nutrition for gut, immunity, and energy!" appears confidently at 4-7s. "Order now: FREE Vitamin D + 5 Travel Packs!" is prominently displayed and bold at 7-8s.
 */

 /**
  Example output - 5 (only scene breakdown):

  {
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
}
  */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface ScriptScene {
  scene: number;
  content: string;
  duration: string;
}

export interface ScriptPreviewResult {
  title: string;
  hook: string;
  script: ScriptScene[];
  visualStyle: { description: string; colors: string[] };
  cameraMovements: { scene: number; movement: string }[];
  timeline: { scene: number; start: string; end: string; label: string }[];
  loop: string;
  tags: string[];
  thumbnailConcept: string;
}

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly defaultModel = 'google/gemini-2.0-flash-001';
  private readonly fallbackModel = 'google/gemini-flash-1.5';

  async generateScriptPreview(
    topic: string,
    durationSecs: number,
    genre: string,
    aspectRatio: string,
    market: string,
  ): Promise<ScriptPreviewResult> {
    if (!this.apiKey) {
      throw new HttpException('GEMINI_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const sceneCount = Math.max(3, Math.min(10, Math.floor(durationSecs / 15)));
    const sceneDuration = Math.floor(durationSecs / sceneCount);
    const wordCount = Math.round(durationSecs * 130 / 60);

    const aspectContext: Record<string, string> = {
      '16:9': 'Widescreen landscape — standard YouTube/documentary, cinematic wide shots',
      '9:16': 'Vertical portrait — YouTube Shorts/TikTok/Reels, fast-paced, close-ups, mobile-first',
      '1:1': 'Square — Instagram/Facebook feed, balanced centered composition',
      '4:5': 'Portrait — Instagram feed, slightly vertical, lifestyle feel',
    };

    const genreInstructions: Record<string, string> = {
      'Documentary': 'Authoritative, fact-driven narration. Deep dives with expert tone and credible storytelling.',
      'Dark History': 'Mysterious, suspenseful atmosphere. Reveal dark truths with dramatic buildup.',
      'True Crime': 'Gripping narrative with tension building scene by scene. Shocking reveals at key moments.',
      'Educational': 'Clear, engaging explanations that simplify complex ideas using relatable examples.',
      'Funny': 'Comedic timing, wit, and humor throughout. Light, entertaining, and shareable.',
      'History': 'Epic storytelling with historical context, dramatic recreations, and immersive detail.',
      'Horror': 'Eerie atmosphere with growing tension. Unsettling facts that leave the viewer disturbed.',
      'Science': 'Mind-blowing discoveries and curiosity-driven narrative. Make complex science accessible.',
      'News': 'Breaking news style — urgent, factual, fast-paced, and impactful.',
      'Motivation': 'Emotionally powerful and inspiring. Build to a strong call-to-action that uplifts the viewer.',
    };

    const marketLanguage: Record<string, string> = {
      'en-us': 'American English',
      'en-uk': 'British English',
      'fr': 'French',
      'ar': 'Arabic',
    };

    // Build timeline entries for all scenes
    const timelineEntries = Array.from({ length: sceneCount }, (_, i) => ({
      scene: i + 1,
      start: `${i * sceneDuration}s`,
      end: `${(i + 1) * sceneDuration}s`,
      label: i === 0 ? 'Hook' : i === sceneCount - 1 ? 'Loop' : `Scene ${i + 1}`,
    }));

    const prompt = `You are a professional viral video scriptwriter specializing in high-retention content.
Write a complete video script using the HOOK & LOOP retention method.

HOOK & LOOP METHOD:
- HOOK: The first 3-5 seconds must immediately grab attention (shocking stat, bold question, or powerful visual cue). Make it impossible to scroll past.
- LOOP: The ending must visually and emotionally connect back to the opening, making viewers want to rewatch from the beginning.

Video Parameters:
- Topic: ${topic}
- Genre: ${genre} — ${genreInstructions[genre] || 'Engaging, high-quality content'}
- Aspect Ratio: ${aspectRatio} (${aspectContext[aspectRatio] || 'Standard format'})
- Duration: ${durationSecs} seconds (~${wordCount} spoken words total)
- Number of scenes: ${sceneCount}, each approximately ${sceneDuration} seconds
- Language: Write ALL narration in ${marketLanguage[market] || 'English'}

Return ONLY valid JSON (absolutely no markdown, no code blocks, no extra text before or after) with this exact structure:
{
  "title": "Compelling clickable title in ${marketLanguage[market] || 'English'}",
  "hook": "The exact opening hook — the first words and visual action viewers experience in seconds 0-5",
  "script": [
    { "scene": 1, "content": "Full narration for this scene in ${marketLanguage[market] || 'English'}", "duration": "${sceneDuration}s" }
  ],
  "visualStyle": {
    "description": "Cinematic visual style description matching the genre and ${aspectRatio} format",
    "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
  },
  "cameraMovements": [
    { "scene": 1, "movement": "Specific camera movement description for scene 1" }
  ],
  "timeline": ${JSON.stringify(timelineEntries)},
  "loop": "The closing moment that mirrors the opening hook — creating a perfect loop for rewatches",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "thumbnailConcept": "Detailed thumbnail concept optimized for maximum click-through rate"
}

Requirements:
- Fill ALL ${sceneCount} scenes with rich narration totaling ~${wordCount} words
- Scene 1 must deliver the HOOK
- Scene ${sceneCount} must deliver the LOOP that connects back to the opening
- Use the ${genre} genre characteristics throughout
- All spoken content must be in ${marketLanguage[market] || 'English'}`;

    const axiosConfig = {
      timeout: 120_000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidrush.app',
        'X-Title': 'VidRush',
      },
    };

    const tryModel = async (model: string) => axios.post(
      this.baseUrl,
      { model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 },
      axiosConfig,
    );

    try {
      let response;
      try {
        response = await tryModel(this.defaultModel);
      } catch (firstErr: any) {
        console.warn('Primary model failed, retrying with fallback:', firstErr.message);
        response = await tryModel(this.fallbackModel);
      }

      let raw: string = response.data.choices[0].message.content;
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      const parsed: ScriptPreviewResult = JSON.parse(raw);
      return parsed;
    } catch (error: any) {
      const detail = error.response?.data;
      console.error('OpenRouter Error:', JSON.stringify(detail, null, 2) || error.message);
      const msg = detail?.error?.message || detail?.error?.metadata?.raw || error.message;
      throw new Error(`Script preview generation failed: ${msg}`);
    }
  }

  async generateScript(topic: string, duration: number, genre: string, market: string): Promise<string> {
    if (!this.apiKey) {
      throw new HttpException('GEMINI_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const axiosConfig = {
      timeout: 120_000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidrush.app',
        'X-Title': 'VidRush',
      },
    };

    const body = {
      messages: [
        {
          role: 'user',
          content: `You are a professional documentary scriptwriter.\nWrite continuous voiceover narration only.\nNo headers, no sections, no [MUSIC] tags.\nNo stage directions. Just the spoken words.\n\nWrite a ${duration}-minute ${genre} script about: ${topic}\nTarget Market/Language: ${market}\nWrite in the primary language of: ${market}.\nWrite approximately ${duration * 130} words.\nStart immediately with the narration.`,
        },
      ],
      temperature: 0.7,
    };

    try {
      let response;
      try {
        response = await axios.post(this.baseUrl, { ...body, model: this.defaultModel }, axiosConfig);
      } catch (firstErr: any) {
        console.warn('Primary model failed for generateScript, retrying with fallback:', firstErr.message);
        response = await axios.post(this.baseUrl, { ...body, model: this.fallbackModel }, axiosConfig);
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      const detail = error.response?.data;
      console.error('OpenRouter generateScript error:', JSON.stringify(detail, null, 2) || error.message);
      const msg = detail?.error?.message || detail?.error?.metadata?.raw || error.message;
      throw new Error(`Script generation failed: ${msg}`);
    }
  }

  async generateVisualPrompt(segment: string): Promise<string> {
    if (!this.apiKey) {
      throw new HttpException('GEMINI_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.defaultModel,
          messages: [
            {
              role: 'user',
              content: `You write concise visual prompts without any quotes or extra formatting.\n\nGenerate a 10-word visual scene description for: ${segment}`,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vidrush.app',
            'X-Title': 'VidRush',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`Visual prompt generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

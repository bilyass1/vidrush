"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let GeminiService = class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }
    async generateScriptPreview(topic, durationSecs, genre, aspectRatio, market) {
        if (!this.apiKey) {
            throw new common_1.HttpException('GEMINI_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const sceneCount = Math.max(3, Math.min(10, Math.floor(durationSecs / 15)));
        const sceneDuration = Math.floor(durationSecs / sceneCount);
        const wordCount = Math.round(durationSecs * 130 / 60);
        const aspectContext = {
            '16:9': 'Widescreen landscape — standard YouTube/documentary, cinematic wide shots',
            '9:16': 'Vertical portrait — YouTube Shorts/TikTok/Reels, fast-paced, close-ups, mobile-first',
            '1:1': 'Square — Instagram/Facebook feed, balanced centered composition',
            '4:5': 'Portrait — Instagram feed, slightly vertical, lifestyle feel',
        };
        const genreInstructions = {
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
        const marketLanguage = {
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
        try {
            const response = await axios_1.default.post(`${this.baseUrl}?key=${this.apiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: Math.max(4000, durationSecs * 25),
                    temperature: 0.8,
                },
            }, { headers: { 'Content-Type': 'application/json' } });
            let raw = response.data.candidates[0].content.parts[0].text;
            raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(raw);
            return parsed;
        }
        catch (error) {
            throw new Error(`Script preview generation failed: ${error.message || error}`);
        }
    }
    async generateScript(topic, duration, genre, market) {
        if (!this.apiKey) {
            throw new common_1.HttpException('GEMINI_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const response = await axios_1.default.post(`${this.baseUrl}?key=${this.apiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: `You are a professional documentary scriptwriter.\nWrite continuous voiceover narration only.\nNo headers, no sections, no [MUSIC] tags.\nNo stage directions. Just the spoken words.\n\nWrite a ${duration}-minute ${genre} script about: ${topic}\nTarget Market/Language: ${market}\nWrite in the primary language of: ${market}.\nWrite approximately ${duration * 130} words.\nStart immediately with the narration.`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: Math.max(2000, duration * 200),
                    temperature: 0.7,
                },
            }, { headers: { 'Content-Type': 'application/json' } });
            return response.data.candidates[0].content.parts[0].text;
        }
        catch (error) {
            throw new Error(`Script generation failed: ${error.message || error}`);
        }
    }
    async generateVisualPrompt(segment) {
        if (!this.apiKey) {
            throw new common_1.HttpException('GEMINI_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const response = await axios_1.default.post(`${this.baseUrl}?key=${this.apiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: `You write concise visual prompts without any quotes or extra formatting.\n\nGenerate a 10-word visual scene description for: ${segment}`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.7,
                },
            }, { headers: { 'Content-Type': 'application/json' } });
            return response.data.candidates[0].content.parts[0].text;
        }
        catch (error) {
            throw new Error(`Visual prompt generation failed: ${error.message || error}`);
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = __decorate([
    (0, common_1.Injectable)()
], GeminiService);
//# sourceMappingURL=gemini.service.js.map
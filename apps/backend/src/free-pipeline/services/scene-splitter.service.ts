import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface Scene {
  index: number;
  text: string;
  durationSec: number;
  searchQuery: string;
  sfxQuery: string;
  mood: 'dramatic' | 'calm' | 'upbeat' | 'tense';
  isHistorical: boolean;
}

@Injectable()
export class SceneSplitterService {
  private readonly logger = new Logger(SceneSplitterService.name);
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model = 'google/gemini-2.0-flash-001';

  async splitIntoScenes(script: string, totalDuration: number, style: string): Promise<Scene[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a documentary video editor. Split scripts into visual scenes. Return ONLY valid JSON array, no markdown, no explanation.',
            },
            {
              role: 'user',
              content: `Split this ${totalDuration}-minute script into scenes.\nFor each scene return JSON with:\n- index (number)\n- text (the narration for this scene)\n- durationSec (seconds, based on 130 words/min)\n- searchQuery (4-6 English words describing the EXACT visual content of this scene — be specific, e.g. "soldiers storming beach normandy 1944" not "war battle")\n- sfxQuery (2 words for sound effect)\n- mood: dramatic|calm|upbeat|tense\n- isHistorical: true if content is pre-1950\nIMPORTANT: searchQuery must reflect the specific subject of each scene's narration text, not the general topic.\nScript: ${script}\nReturn ONLY the JSON array.`,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vidrush.app',
            'X-Title': 'VidRush',
          },
        },
      );

      let raw: string = response.data.choices[0].message.content as string;
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');

      const scenes = parsed as Scene[];
      const totalSec = scenes.reduce((s, sc) => s + sc.durationSec, 0);
      const expectedSec = totalDuration * 60;

      if (Math.abs(totalSec - expectedSec) > expectedSec * 0.3) {
        this.logger.warn(`Scene duration mismatch: got ${totalSec}s, expected ~${expectedSec}s. Normalizing.`);
        const factor = expectedSec / totalSec;
        scenes.forEach(sc => { sc.durationSec = Math.round(sc.durationSec * factor); });
      }

      return scenes;
    } catch (err: unknown) {
      this.logger.warn(`Gemini scene split failed, using fallback: ${(err as Error).message}`);
      return this.fallbackSplit(script, totalDuration);
    }
  }

  private fallbackSplit(script: string, totalDuration: number): Scene[] {
    const paragraphs = script.split(/\n\n+/).filter(p => p.trim().length > 0);
    const secPerScene = Math.round((totalDuration * 60) / paragraphs.length);

    return paragraphs.map((text, index) => {
      // Extract meaningful words from the scene text for a relevant search query
      const words = text
        .replace(/[^a-zA-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4)
        .slice(0, 5)
        .join(' ')
        .toLowerCase() || 'cinematic documentary footage';

      return {
        index,
        text: text.trim(),
        durationSec: secPerScene,
        searchQuery: words,
        sfxQuery: 'ambient sound',
        mood: 'dramatic' as const,
        isHistorical: false,
      };
    });
  }
}

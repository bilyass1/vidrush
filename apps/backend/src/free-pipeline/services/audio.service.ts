import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import { ElevenLabsService } from '../../video-generation/services/elevenlabs.service';

export interface AudioResult {
  url: string;
  duration: number;
  title: string;
}

const STYLE_TO_QUERY: Record<string, string> = {
  Documentary: 'cinematic ambient documentary',
  'Dark History': 'dark orchestral dramatic',
  'True Crime': 'suspense tension thriller',
  Educational: 'upbeat corporate positive',
};

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(private readonly elevenlabs: ElevenLabsService) {}

  async generateVoiceover(
    script: string,
    language: string,
  ): Promise<{ buffer: Buffer; duration: number }> {
    // Use a default ElevenLabs voice — George (multilingual)
    const defaultVoiceId = 'JBFqnCBsd6RMkjVDRZzb';
    const buffer = await this.elevenlabs.generateVoiceBuffer(script, defaultVoiceId);
    const duration = (script.split(' ').length / 130) * 60;
    return { buffer, duration };
  }

  async searchBackgroundMusic(style: string): Promise<AudioResult[]> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) return [];

    const query = STYLE_TO_QUERY[style] ?? 'cinematic ambient';

    try {
      const res = await axios.get<{
        hits: Array<{ audio: { url: string }; duration: number; tags: string }>;
      }>('https://pixabay.com/api/', {
        params: {
          key: apiKey,
          q: encodeURIComponent(query),
          media_type: 'music',
          per_page: 3,
        },
      });

      return (res.data.hits ?? []).slice(0, 3).map(h => ({
        url: h.audio?.url ?? '',
        duration: h.duration,
        title: h.tags,
      })).filter(r => r.url);
    } catch (err: unknown) {
      this.logger.warn(`Background music search failed: ${(err as Error).message}`);
      return [];
    }
  }

  async searchSFX(sfxQuery: string): Promise<AudioResult | null> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await axios.get<{
        hits: Array<{ audio: { url: string }; duration: number; tags: string }>;
      }>('https://pixabay.com/api/', {
        params: {
          key: apiKey,
          q: encodeURIComponent(sfxQuery),
          media_type: 'music',
          per_page: 1,
        },
      });

      const hit = res.data.hits?.[0];
      if (!hit?.audio?.url) return null;

      return { url: hit.audio.url, duration: hit.duration, title: hit.tags };
    } catch (err: unknown) {
      this.logger.warn(`SFX search failed for "${sfxQuery}": ${(err as Error).message}`);
      return null;
    }
  }

  async downloadAudio(url: string, destPath: string): Promise<string> {
    try {
      const response = await axios.get<NodeJS.ReadableStream>(url, {
        responseType: 'stream',
        timeout: 60_000,
      });

      await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        (response.data as NodeJS.ReadableStream).pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return destPath;
    } catch (err: unknown) {
      throw new Error(`Failed to download audio: ${url} — ${(err as Error).message}`);
    }
  }

  private splitIntoChunks(text: string, maxLen: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > maxLen) {
      const slice = remaining.slice(0, maxLen);
      const lastDot = slice.lastIndexOf('.');
      const cutAt = lastDot > 0 ? lastDot + 1 : maxLen;
      chunks.push(remaining.slice(0, cutAt).trim());
      remaining = remaining.slice(cutAt).trim();
    }

    if (remaining.length > 0) chunks.push(remaining);
    return chunks;
  }
}

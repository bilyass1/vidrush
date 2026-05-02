import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { LocalStorageService } from '../../storage/local-storage.service';

@Injectable()
export class ElevenLabsService {
  private readonly apiBaseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly storage: LocalStorageService) {}

  async getAvailableVoices(): Promise<Array<{ voice_id: string; name: string; preview_url?: string; gender?: string; language?: string; accent?: string; age?: string }>> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new HttpException('ELEVENLABS_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/voices`, {
        headers: {
          'xi-api-key': apiKey,
        },
      });
      return response.data.voices.map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        gender: v.labels?.gender ?? null,
        language: v.labels?.language ?? null,
        accent: v.labels?.accent ?? null,
        age: v.labels?.age ?? null,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data: unknown }; message?: string };
      const msg = err.response ? JSON.stringify(err.response.data) : (err.message ?? String(error));
      throw new HttpException(
        `Failed to fetch voices: ${msg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async testVoice(text: string, voiceId: string, modelId: string = 'eleven_turbo_v2_5'): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new HttpException('ELEVENLABS_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/text-to-speech/${voiceId}`,
        {
          text: text.slice(0, 500), // Limit test text
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        },
      );
      return Buffer.from(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data: unknown }; message?: string };
      const msg = err.response ? JSON.stringify(err.response.data) : (err.message ?? String(error));
      throw new HttpException(
        `Voice test failed: ${msg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateVoiceBuffer(script: string, voiceId: string, modelId: string = 'eleven_turbo_v2_5'): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new HttpException('ELEVENLABS_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const chunks = this.splitScript(script, 4500);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const response = await axios.post(
        `${this.apiBaseUrl}/text-to-speech/${voiceId}`,
        {
          text: chunk,
          model_id: modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
        },
        {
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          responseType: 'arraybuffer',
        },
      );
      buffers.push(Buffer.from(response.data));
    }

    return Buffer.concat(buffers);
  }

  async generateVoice(
    script: string,
    voiceId: string,
    userId: string,
    jobId: string,
    modelId: string = 'eleven_turbo_v2_5',
  ): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new HttpException('ELEVENLABS_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const chunks = this.splitScript(script, 4500);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/text-to-speech/${voiceId}`,
          {
            text: chunk,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          },
          {
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            responseType: 'arraybuffer',
          },
        );
        audioBuffers.push(Buffer.from(response.data));
      } catch (error: unknown) {
        const err = error as { response?: { data: unknown }; message?: string };
        const msg = err.response ? JSON.stringify(err.response.data) : (err.message ?? String(error));
        throw new Error(`ElevenLabs voice generation failed: ${msg}`);
      }
    }

    const combined = Buffer.concat(audioBuffers);
    return this.storage.saveBuffer(combined, `audio/${userId}/${jobId}.mp3`);
  }

  private splitScript(script: string, maxLength: number): string[] {
    const sentences = script.match(/[^.!?]+[.!?]+/g) ?? [script];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLength) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += ' ' + sentence;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks;
  }
}

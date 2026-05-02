import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { LocalStorageService } from '../../storage/local-storage.service';

export interface RenderParams {
  clips: string[];       // Local HTTP URLs of video clips
  audioUrl: string;      // Local HTTP URL of voiceover MP3
  duration: number;      // total minutes
  format: 'mp4' | 'mp4-short';
  userId: string;
  jobId: string;
}

@Injectable()
export class ShotstackService {
  constructor(private readonly storage: LocalStorageService) {}

  async renderVideo(params: RenderParams): Promise<string> {
    const { clips, audioUrl, duration, userId, jobId } = params;

    const SEGMENT_DURATION_MIN = 5;
    const CLIPS_PER_SEGMENT = Math.ceil((SEGMENT_DURATION_MIN * 60) / 8);

    if (duration > SEGMENT_DURATION_MIN) {
      const segmentCount = Math.ceil(duration / SEGMENT_DURATION_MIN);
      const segmentPromises: Promise<string>[] = [];

      for (let i = 0; i < segmentCount; i++) {
        const start = i * CLIPS_PER_SEGMENT;
        const segClips = clips.slice(start, start + CLIPS_PER_SEGMENT);
        if (segClips.length > 0) {
          segmentPromises.push(this.renderSegment({ clips: segClips, audioUrl }));
        }
      }

      const segmentUrls = await Promise.all(segmentPromises);
      const mergedUrl = await this.mergeSegments(segmentUrls);
      return this.downloadToLocal(mergedUrl, userId, jobId);
    }

    const shotstackUrl = await this.renderSegment({ clips, audioUrl });
    return this.downloadToLocal(shotstackUrl, userId, jobId);
  }

  private async renderSegment({
    clips,
    audioUrl,
  }: {
    clips: string[];
    audioUrl?: string;
  }): Promise<string> {
    const apiKey = process.env.SHOTSTACK_API_KEY;
    if (!apiKey) {
      throw new HttpException('SHOTSTACK_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload: Record<string, unknown> = {
      timeline: {
        tracks: [{
          clips: clips.map((url, i) => ({
            asset: { type: 'video', src: url },
            start: i * 8,
            length: 8,
            transition: { in: 'fade', out: 'fade' },
          })),
        }],
      },
      output: { format: 'mp4', resolution: '1080', fps: 30 },
    };

    if (audioUrl) {
      (payload.timeline as Record<string, unknown>).soundtrack = {
        src: audioUrl,
        effect: 'fadeOut',
      };
    }

    try {
      const response = await axios.post('https://api.shotstack.io/v1/render', payload, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      });

      const renderId: string = response.data.response.id;
      return this.pollRender(renderId, apiKey);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Shotstack render request failed: ${msg}`);
    }
  }

  private async mergeSegments(segmentUrls: string[]): Promise<string> {
    const apiKey = process.env.SHOTSTACK_API_KEY;
    if (!apiKey) {
      throw new HttpException('SHOTSTACK_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payload = {
      timeline: {
        tracks: [{
          clips: segmentUrls.map((url, i) => ({
            asset: { type: 'video', src: url },
            start: i * 300,
          })),
        }],
      },
      output: { format: 'mp4', resolution: '1080', fps: 30 },
    };

    const response = await axios.post('https://api.shotstack.io/v1/render', payload, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });

    const renderId: string = response.data.response.id;
    return this.pollRender(renderId, apiKey);
  }

  private async pollRender(renderId: string, apiKey: string): Promise<string> {
    const maxRetries = 40;
    const pollInterval = 15_000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const res = await axios.get(`https://api.shotstack.io/v1/render/${renderId}`, {
          headers: { 'x-api-key': apiKey },
        });
        const status: string = res.data.response.status;
        if (status === 'done') return res.data.response.url as string;
        if (status === 'failed') throw new Error(`Shotstack render failed: ${res.data.response.error}`);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith('Shotstack render failed')) throw err;
        // transient network error — keep polling
      }
    }
    throw new Error('Timeout waiting for Shotstack render');
  }

  private async downloadToLocal(url: string, userId: string, jobId: string): Promise<string> {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);
    return this.storage.saveBuffer(buffer, `final/${userId}/${jobId}/output.mp4`);
  }
}

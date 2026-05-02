import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GrokService {
  async generateScript(topic: string, duration: number, style: string): Promise<string> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new HttpException('GROK_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-fast',
          messages: [
            {
              role: 'system',
              content: 'You are a professional documentary scriptwriter.\nWrite continuous voiceover narration only.\nNo headers, no sections, no [MUSIC] tags.\nNo stage directions. Just the spoken words.'
            },
            {
              role: 'user',
              content: `Write a ${duration}-minute documentary script about: ${topic}\nStyle: ${style}\nWrite approximately ${duration * 130} words.\nStart immediately with the narration.`
            }
          ],
          max_tokens: duration * 200,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`Script generation failed: ${error.message || error}`);
    }
  }

  async generateVisualPrompt(segment: string): Promise<string> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new HttpException('GROK_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-fast',
          messages: [
            {
              role: 'system',
              content: 'You write concise visual prompts without any quotes or extra formatting.'
            },
            {
              role: 'user',
              content: `Generate a 10-word visual scene description for: ${segment}`
            }
          ],
          max_tokens: 50,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`Visual prompt generation failed: ${error.message || error}`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { Scene } from '../../free-pipeline/services/scene-splitter.service';

const STYLE_MODIFIERS: Record<string, string> = {
  Documentary:
    'cinematic documentary footage, natural lighting, slow steady camera movement, photorealistic, high quality 4K',
  'Dark History':
    'dark cinematic footage, dramatic shadows, moody atmosphere, desaturated colors, slow ominous camera movement, cinematic 4K',
  'True Crime':
    'tense cinematic footage, harsh contrast lighting, suspicious atmosphere, slow creeping camera, noir style, cinematic 4K',
  Educational:
    'bright clear cinematic footage, clean lighting, smooth camera movement, vibrant colors, professional quality 4K',
};

const MOOD_MODIFIERS: Record<string, string> = {
  dramatic: 'dramatic composition, intense framing',
  calm: 'peaceful serene composition',
  upbeat: 'dynamic energetic framing',
  tense: 'tight claustrophobic framing, shadows',
};

const CAMERA_MOVEMENTS = [
  'slow pan',
  'gentle tracking shot',
  'subtle dolly move',
];

@Injectable()
export class PromptBuilderService {
  buildScenePrompt(
    scene: Scene,
    style: string,
    sceneIndex: number,
    totalScenes: number,
  ): string {
    const styleModifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['Documentary'];
    const moodModifier = MOOD_MODIFIERS[scene.mood] ?? '';

    let cameraMovement: string;
    if (sceneIndex === 0) {
      cameraMovement = 'establishing wide shot, slow zoom in';
    } else if (sceneIndex === totalScenes - 1) {
      cameraMovement = 'slow zoom out, fade to wide';
    } else {
      cameraMovement = CAMERA_MOVEMENTS[sceneIndex % CAMERA_MOVEMENTS.length];
    }

    const historicalTag = scene.isHistorical
      ? 'historically accurate, period correct, ancient setting, no modern elements'
      : '';

    const parts = [
      scene.searchQuery,
      styleModifier,
      cameraMovement,
      moodModifier,
      historicalTag,
      'no text, no watermark, no logos',
    ].filter(Boolean);

    const prompt = parts.join(', ');
    const words = prompt.split(/\s+/);
    return words.length > 200 ? words.slice(0, 200).join(' ') : prompt;
  }

  buildContinuationPrompt(
    scene: Scene,
    style: string,
    previousPrompt: string,
  ): string {
    const styleModifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['Documentary'];
    const sceneWords = previousPrompt.split(/\s+/).slice(0, 200);
    const cameraMovement = CAMERA_MOVEMENTS[scene.index % CAMERA_MOVEMENTS.length];

    const parts = [
      `Continuing from previous scene: ${scene.searchQuery}`,
      styleModifier,
      'smooth visual continuation, same lighting and atmosphere as before',
      cameraMovement,
      'no text, no watermark, no logos',
    ];

    const prompt = parts.join(', ');
    const words = prompt.split(/\s+/);
    return words.length > 200 ? words.slice(0, 200).join(' ') : prompt;
  }
}

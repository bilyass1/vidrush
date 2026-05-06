import { Injectable } from '@nestjs/common';
import { Scene } from '../../free-pipeline/services/scene-splitter.service';

const GENRE_STYLES: Record<string, string> = {
  Documentary: 'Documentary style: handheld verite cinematography, natural lighting with slight grain, muted desaturated color grading, slow observational pacing, realistic depth of field, journalistic composition.',
  'Dark History': 'Dark historical aesthetic: dramatic chiaroscuro lighting with deep shadows, warm sepia and amber tones, aged film grain texture, ominous foreboding atmosphere, slow contemplative camera movement, desaturated shadows with warm highlights.',
  'True Crime': 'True crime visual style: cold blue-grey color palette, surveillance camera grain and distortion, harsh unflattering lighting, tense claustrophobic framing, gritty realistic textures, documentary realism with dramatic tension.',
  Educational: 'Educational video aesthetic: clean bright studio lighting, neutral white and blue color palette, clear uncluttered compositions, crisp sharp focus throughout, professional corporate presentation style, accessible and approachable visual tone.',
  Funny: 'Comedy visual style: vibrant oversaturated colors, wide angle lens distortion, bright pop aesthetic, exaggerated dynamic compositions, fast kinetic energy, playful cartoonish color grading, high contrast cheerful palette.',
  History: 'Epic historical cinematography: anamorphic widescreen composition, golden hour warm tones, cinematic film emulsion look, sweeping establishing shots, dramatic epic scale, rich amber and gold color grading, grand majestic atmosphere.',
  Horror: 'Horror visual style: extreme high contrast with crushed blacks, cold desaturated palette with teal shadows, unsettling Dutch angle compositions, oppressive dark negative space, slow creeping camera movement, single harsh key light, deeply uncomfortable framing.',
  Science: 'Science documentary aesthetic: macro lens precision photography, clean clinical lighting, electric blue and teal color palette, microscopic and technical visual language, extreme sharp focus on details, sterile professional atmosphere, crisp high-definition clarity.',
  News: 'Broadcast news visual style: locked-off professional camera work, neutral flat color grading, clean negative space for graphics, broadcast-quality sharp focus, professional studio lighting, authoritative composed framing, neutral journalistic tone.',
  Motivation: 'Motivational cinematic style: warm golden hour lighting with intentional lens flares, upward heroic camera angles, high energy dynamic movement, sunrise amber and gold color palette, triumphant sweeping compositions, radiant backlit silhouettes, inspiring epic scale.',
};

const BASE_PROMPT = 'Dynamic cinematic close-up of high-tech modular machinery self-assembling in midair, precision robotic parts, magnetic connectors, and glowing circuits clicking together, subtle smoke and light flares, extremely detailed titanium textures. The final product displays a clean, clear surface with large glowing engraved text \'LTX-2.3\' centered and unobstructed, dramatic lighting, photorealism, 8K, sharp focus.';

const STYLE_MODIFIERS: Record<string, string> = GENRE_STYLES;

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
  /**
   * Build a prompt with genre-specific styling
   * Uses the BASE_PROMPT + genre style approach
   */
  buildPromptWithGenre(genre: string, customPrompt?: string): string {
    const style = GENRE_STYLES[genre] || '';
    const baseText = customPrompt || BASE_PROMPT;
    return style ? `${baseText}\n\n${style}` : baseText;
  }

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

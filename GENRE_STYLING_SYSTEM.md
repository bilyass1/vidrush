# Genre-Based Styling System

## Overview

The video generation system now uses genre-specific visual styling to enhance the cinematic quality of generated videos. Each genre has a detailed style description that influences lighting, color grading, camera movement, and overall aesthetic.

## Implementation

### Architecture

The genre styling system is implemented in two main services:

1. **PromptBuilderService** (`apps/backend/src/video-generation/services/prompt-builder.service.ts`)
   - Contains the `GENRE_STYLES` dictionary with detailed style descriptions
   - Provides `buildPromptWithGenre()` method to combine prompts with genre styling
   - Used by both free pipeline and direct video generation

2. **DirectVideoService** (`apps/backend/src/video-generation/services/direct-video.service.ts`)
   - Integrates genre styling into the prompt expansion workflow
   - Applies genre styles after AI prompt expansion via Gemini
   - Falls back to genre styling if API is unavailable

### Genre Styles

Each genre has a comprehensive visual style description:

#### Documentary
- Handheld verite cinematography
- Natural lighting with slight grain
- Muted desaturated color grading
- Slow observational pacing
- Realistic depth of field
- Journalistic composition

#### Dark History
- Dramatic chiaroscuro lighting with deep shadows
- Warm sepia and amber tones
- Aged film grain texture
- Ominous foreboding atmosphere
- Slow contemplative camera movement
- Desaturated shadows with warm highlights

#### True Crime
- Cold blue-grey color palette
- Surveillance camera grain and distortion
- Harsh unflattering lighting
- Tense claustrophobic framing
- Gritty realistic textures
- Documentary realism with dramatic tension

#### Educational
- Clean bright studio lighting
- Neutral white and blue color palette
- Clear uncluttered compositions
- Crisp sharp focus throughout
- Professional corporate presentation style
- Accessible and approachable visual tone

#### Funny
- Vibrant oversaturated colors
- Wide angle lens distortion
- Bright pop aesthetic
- Exaggerated dynamic compositions
- Fast kinetic energy
- Playful cartoonish color grading
- High contrast cheerful palette

#### History
- Anamorphic widescreen composition
- Golden hour warm tones
- Cinematic film emulsion look
- Sweeping establishing shots
- Dramatic epic scale
- Rich amber and gold color grading
- Grand majestic atmosphere

#### Horror
- Extreme high contrast with crushed blacks
- Cold desaturated palette with teal shadows
- Unsettling Dutch angle compositions
- Oppressive dark negative space
- Slow creeping camera movement
- Single harsh key light
- Deeply uncomfortable framing

#### Science
- Macro lens precision photography
- Clean clinical lighting
- Electric blue and teal color palette
- Microscopic and technical visual language
- Extreme sharp focus on details
- Sterile professional atmosphere
- Crisp high-definition clarity

#### News
- Locked-off professional camera work
- Neutral flat color grading
- Clean negative space for graphics
- Broadcast-quality sharp focus
- Professional studio lighting
- Authoritative composed framing
- Neutral journalistic tone

#### Motivation
- Warm golden hour lighting with intentional lens flares
- Upward heroic camera angles
- High energy dynamic movement
- Sunrise amber and gold color palette
- Triumphant sweeping compositions
- Radiant backlit silhouettes
- Inspiring epic scale

## Usage

### Direct Video Generation

When a user generates a video directly, the system:

1. Takes the user's idea and expands it via Gemini AI
2. Applies the genre-specific styling to the expanded prompt
3. Sends the combined prompt to LTX video generation

Example flow:
```
User idea: "The mysterious story of the Hiroshima bomb"
Genre: Dark History

→ Gemini expands to cinematic description
→ Genre style appended: "Dark historical aesthetic: dramatic chiaroscuro lighting..."
→ Final prompt sent to LTX
```

### Free Pipeline

The free pipeline uses the same `GENRE_STYLES` dictionary through the `STYLE_MODIFIERS` constant, ensuring consistent styling across both generation methods.

## Code Example

```typescript
// Build a prompt with genre styling
const prompt = promptBuilder.buildPromptWithGenre('Horror', userIdea);

// Result format:
// [User's expanded idea]
//
// Horror visual style: extreme high contrast with crushed blacks, cold desaturated palette...
```

## Benefits

1. **Consistent Visual Identity**: Each genre has a distinct, recognizable look
2. **Professional Quality**: Detailed cinematographic descriptions improve output quality
3. **User Experience**: Videos match user expectations for each genre
4. **Flexibility**: Easy to add new genres or modify existing styles
5. **Fallback Support**: Works even without AI prompt expansion

## Future Enhancements

- Add more genres (Thriller, Romance, Adventure, etc.)
- Allow users to customize or blend genre styles
- A/B test different style descriptions for optimal results
- Add aspect-ratio-specific style variations
- Implement style intensity controls (subtle vs. dramatic)

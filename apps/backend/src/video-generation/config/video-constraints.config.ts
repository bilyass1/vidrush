/**
 * Video Generation Constraints Configuration
 * 
 * This file defines the maximum allowed values for video generation parameters.
 * These constraints ensure optimal performance and prevent resource exhaustion.
 */

export const VIDEO_CONSTRAINTS = {
  // Maximum video duration in seconds
  MAX_DURATION: 10,
  
  // Maximum frames per second
  MAX_FPS: 30,
  
  // Maximum resolution (width x height)
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  
  // Default values when not specified
  DEFAULT_FPS: 25,
  DEFAULT_DURATION: 5,
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 720,
} as const;

/**
 * Aspect ratio presets with HD quality dimensions
 * All dimensions are divisible by 32 for optimal AI model performance
 */
export const ASPECT_RATIO_PRESETS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 }, // Full HD landscape
  '9:16': { width: 608, height: 1080 },  // Vertical HD (mobile)
  '1:1':  { width: 1024, height: 1024 }, // Square HD
  '4:5':  { width: 864, height: 1080 },  // Portrait HD (Instagram)
};

/**
 * Quality presets for easy selection
 */
export const QUALITY_PRESETS = {
  LOW: { width: 640, height: 360, fps: 15 },      // 360p
  MEDIUM: { width: 1280, height: 720, fps: 25 },  // 720p
  HIGH: { width: 1920, height: 1080, fps: 30 },   // 1080p
} as const;

/**
 * Validates and constrains video generation parameters
 */
export function constrainVideoParams(params: {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
}): {
  width: number;
  height: number;
  fps: number;
  duration: number;
} {
  return {
    width: Math.min(params.width ?? VIDEO_CONSTRAINTS.DEFAULT_WIDTH, VIDEO_CONSTRAINTS.MAX_WIDTH),
    height: Math.min(params.height ?? VIDEO_CONSTRAINTS.DEFAULT_HEIGHT, VIDEO_CONSTRAINTS.MAX_HEIGHT),
    fps: Math.min(params.fps ?? VIDEO_CONSTRAINTS.DEFAULT_FPS, VIDEO_CONSTRAINTS.MAX_FPS),
    duration: Math.min(params.duration ?? VIDEO_CONSTRAINTS.DEFAULT_DURATION, VIDEO_CONSTRAINTS.MAX_DURATION),
  };
}

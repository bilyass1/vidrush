export interface ScriptScene {
    scene: number;
    content: string;
    duration: string;
}
export interface ScriptPreviewResult {
    title: string;
    hook: string;
    script: ScriptScene[];
    visualStyle: {
        description: string;
        colors: string[];
    };
    cameraMovements: {
        scene: number;
        movement: string;
    }[];
    timeline: {
        scene: number;
        start: string;
        end: string;
        label: string;
    }[];
    loop: string;
    tags: string[];
    thumbnailConcept: string;
}
export declare class GeminiService {
    private readonly apiKey;
    private readonly baseUrl;
    generateScriptPreview(topic: string, durationSecs: number, genre: string, aspectRatio: string, market: string): Promise<ScriptPreviewResult>;
    generateScript(topic: string, duration: number, genre: string, market: string): Promise<string>;
    generateVisualPrompt(segment: string): Promise<string>;
}
//# sourceMappingURL=gemini.service.d.ts.map
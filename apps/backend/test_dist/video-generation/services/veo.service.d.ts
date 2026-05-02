import { GeminiService } from './gemini.service';
export declare class VeoService {
    private readonly geminiService;
    private s3Client;
    constructor(geminiService: GeminiService);
    generateClip(prompt: string, style: string, userId: string, jobId: string, index: number): Promise<string>;
    private pollOperation;
    private downloadVideo;
    generateClipsForScript(script: string, duration: number, style: string, userId: string, jobId: string): Promise<string[]>;
}
//# sourceMappingURL=veo.service.d.ts.map
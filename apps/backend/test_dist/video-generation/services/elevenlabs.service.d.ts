export declare class ElevenLabsService {
    private s3Client;
    constructor();
    generateVoice(script: string, voiceId: string, userId: string, jobId: string): Promise<string>;
    private splitScript;
}
//# sourceMappingURL=elevenlabs.service.d.ts.map
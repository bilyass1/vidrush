export interface RenderParams {
    clips: string[];
    audioUrl: string;
    duration: number;
    format: 'mp4' | 'mp4-short';
    userId: string;
    jobId: string;
}
export declare class ShotstackService {
    private s3Client;
    constructor();
    renderVideo(params: RenderParams): Promise<string>;
    private renderSegment;
    private mergeSegments;
    private mergeUsingShotstack;
    private pollRender;
    private downloadAndUploadToS3;
}
//# sourceMappingURL=shotstack.service.d.ts.map
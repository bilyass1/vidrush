import { Request } from "express";
import { VideoService } from "./video.service";
import { UsersService } from "../users/users.service";
import { VideoGenerationService } from "../video-generation/video-generation.service";
import { GenerateVideoDto } from "../video-generation/dto/generate-video.dto";
export declare class VideoController {
    private readonly videoService;
    private readonly usersService;
    private readonly videoGenerationService;
    constructor(videoService: VideoService, usersService: UsersService, videoGenerationService: VideoGenerationService);
    previewScript(dto: GenerateVideoDto): Promise<import("../video-generation/services/gemini.service").ScriptPreviewResult>;
    generate(req: Request, dto: GenerateVideoDto): Promise<{
        jobId: string;
    }>;
    getStatus(req: Request, jobId: string): Promise<{
        status: import(".prisma/client").$Enums.VideoStatus;
        progress: number;
        outputUrl: string | null;
        error: null;
    }>;
    getList(req: Request): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.VideoStatus;
        userId: string;
        type: import(".prisma/client").$Enums.VideoType;
        inputPrompt: string;
        outputUrl: string | null;
        durationMin: number | null;
        costUsd: number | null;
        youtubeVideoId: string | null;
        youtubeUrl: string | null;
    }[]>;
    getStats(req: Request): Promise<{
        totalVideos: number;
        minutesUsed: number;
        minutesLimit: number;
        publishedCount: number;
        thisMonthCount: number;
    }>;
    getRecent(req: Request, limit?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.VideoStatus;
        userId: string;
        type: import(".prisma/client").$Enums.VideoType;
        inputPrompt: string;
        outputUrl: string | null;
        durationMin: number | null;
        costUsd: number | null;
        youtubeVideoId: string | null;
        youtubeUrl: string | null;
    }[]>;
    deleteVideo(req: Request, id: string): Promise<{
        success: boolean;
    }>;
    saveProject(req: Request, body: {
        title: string;
        videoPath: string;
        timeline: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        timeline: import("@prisma/client/runtime/library").JsonValue;
        exportUrl: string | null;
    }>;
    listProjects(req: Request): Promise<{
        id: string;
        updatedAt: Date;
        title: string;
    }[]>;
    getProject(req: Request, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        timeline: import("@prisma/client/runtime/library").JsonValue;
        exportUrl: string | null;
    } | null>;
}
//# sourceMappingURL=video.controller.d.ts.map
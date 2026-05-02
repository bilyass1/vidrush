import { PrismaService } from "../prisma/prisma.service";
import { Plan } from "@prisma/client";
export declare class VideoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(userId: string, userPlan: Plan): Promise<{
        totalVideos: number;
        minutesUsed: number;
        minutesLimit: number;
        publishedCount: number;
        thisMonthCount: number;
    }>;
    getRecentVideos(userId: string, limit?: number): Promise<{
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
    saveProject(userId: string, title: string, videoPath: string, timeline: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        timeline: import("@prisma/client/runtime/library").JsonValue;
        exportUrl: string | null;
    }>;
    listProjects(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        title: string;
    }[]>;
    getProject(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        timeline: import("@prisma/client/runtime/library").JsonValue;
        exportUrl: string | null;
    } | null>;
}
//# sourceMappingURL=video.service.d.ts.map
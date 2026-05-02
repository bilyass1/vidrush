import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Plan } from "@prisma/client";

const PLAN_LIMITS: Record<Plan, number> = {
  FREE: 5,
  STARTER: 15,
  PRO: 50,
  PAYG: 9999,
};

@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, userPlan: Plan) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalVideos, thisMonthVideos, publishedCount, minutesAgg] =
      await Promise.all([
        this.prisma.videoGeneration.count({
          where: { userId },
        }),
        this.prisma.videoGeneration.count({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.videoGeneration.count({
          where: {
            userId,
            type: "YOUTUBE",
            outputUrl: { not: null },
          },
        }),
        this.prisma.videoGeneration.aggregate({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
          _sum: { durationMin: true },
        }),
      ]);

    return {
      totalVideos,
      minutesUsed: minutesAgg._sum.durationMin ?? 0,
      minutesLimit: PLAN_LIMITS[userPlan],
      publishedCount,
      thisMonthCount: thisMonthVideos,
    };
  }

  async getRecentVideos(userId: string, limit = 6) {
    return this.prisma.videoGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async saveProject(userId: string, title: string, videoPath: string, timeline: any) {
    // We try to find by title + userId to "upsert" manually since title isn't unique in schema
    const existing = await this.prisma.videoProject.findFirst({
      where: { userId, title },
    });

    if (existing) {
      return this.prisma.videoProject.update({
        where: { id: existing.id },
        data: { timeline, updatedAt: new Date() },
      });
    }

    return this.prisma.videoProject.create({
      data: {
        userId,
        title,
        timeline,
      },
    });
  }

  async listProjects(userId: string) {
    return this.prisma.videoProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
  }

  async getProject(userId: string, id: string) {
    return this.prisma.videoProject.findFirst({
      where: { id, userId },
    });
  }
}

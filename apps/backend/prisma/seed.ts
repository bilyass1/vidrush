import { PrismaClient, Plan, VideoType, VideoStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@vidrush.com" },
    update: {},
    create: {
      email: "test@vidrush.com",
      name: "Test User",
      passwordHash: await bcrypt.hash("password123", 10),
      plan: Plan.PRO,
    },
  });

  console.log(`✅ User created: ${testUser.email} (plan: ${testUser.plan})`);

  // Sample VideoGeneration 1 — YouTube
  const gen1 = await prisma.videoGeneration.upsert({
    where: { id: "seed-gen-youtube-001" },
    update: {},
    create: {
      id: "seed-gen-youtube-001",
      userId: testUser.id,
      type: VideoType.YOUTUBE,
      status: VideoStatus.DONE,
      inputPrompt:
        "Create a 10-minute documentary about the history of artificial intelligence",
      outputUrl: "https://s3.example.com/vidrush/seed-gen-youtube-001.mp4",
      durationMin: 9.85,
      costUsd: 0.82,
    },
  });

  console.log(`✅ VideoGeneration 1 created: ${gen1.id} (${gen1.type})`);

  // Sample VideoGeneration 2 — E-Commerce
  const gen2 = await prisma.videoGeneration.upsert({
    where: { id: "seed-gen-ecommerce-001" },
    update: {},
    create: {
      id: "seed-gen-ecommerce-001",
      userId: testUser.id,
      type: VideoType.ECOMMERCE,
      status: VideoStatus.RENDERING,
      inputPrompt: "Luxury skincare product ad targeting US market",
      outputUrl: null,
      durationMin: 0.5,
      costUsd: 0.21,
    },
  });

  console.log(`✅ VideoGeneration 2 created: ${gen2.id} (${gen2.type})`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { generateMockCreatorVideoUrls, mockDownloadTikTokVideo } from "../services/mockIntegrations";
import { autoMatchVideo } from "../services/videoMatching";

const router = Router();

const createSchema = z.object({
  tiktokUsername: z.string().min(2),
  autoCheck: z.boolean().default(true),
});

router.get("/", async (req: AuthRequest, res) => {
  const creators = await prisma.creator.findMany({ where: { userId: req.userId } });
  res.json(creators);
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const creator = await prisma.creator.create({
    data: {
      userId: req.userId!,
      tiktokUsername: parsed.data.tiktokUsername,
      autoCheck: parsed.data.autoCheck,
    },
  });

  res.status(201).json(creator);
});

router.post("/:id/check", async (req: AuthRequest, res) => {
  const creator = await prisma.creator.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!creator) {
    return res.status(404).json({ error: "Creator not found" });
  }

  const urls = generateMockCreatorVideoUrls(creator.tiktokUsername, 3);
  const created = [];

  for (const url of urls) {
    const downloaded = await mockDownloadTikTokVideo(url);
    const video = await prisma.video.create({
      data: {
        userId: req.userId!,
        creatorId: creator.id,
        sourceUrl: downloaded.sourceUrl,
        status: downloaded.status,
        watermarkRemoved: downloaded.watermarkRemoved,
      },
    });

    await autoMatchVideo(req.userId!, video.id, video.sourceUrl);

    const enriched = await prisma.video.findUnique({ where: { id: video.id }, include: { productMatch: true } });
    if (enriched) created.push(enriched);
  }

  await prisma.creator.update({ where: { id: creator.id }, data: { lastCheckedAt: new Date() } });

  res.json({ videosImported: created.length, videos: created });
});

export default router;

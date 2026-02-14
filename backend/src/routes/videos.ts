import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { mockDownloadTikTokVideo } from "../services/mockIntegrations";

const router = Router();

const intakeSchema = z.object({
  sourceUrl: z.string().url(),
  creatorId: z.string().optional(),
});

router.get("/", async (req: AuthRequest, res) => {
  const videos = await prisma.video.findMany({
    where: { userId: req.userId },
    orderBy: { importedAt: "desc" },
  });
  res.json(videos);
});

router.post("/intake", async (req: AuthRequest, res) => {
  const parsed = intakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const downloaded = await mockDownloadTikTokVideo(parsed.data.sourceUrl);
  const video = await prisma.video.create({
    data: {
      userId: req.userId!,
      creatorId: parsed.data.creatorId,
      sourceUrl: downloaded.sourceUrl,
      status: downloaded.status,
      watermarkRemoved: downloaded.watermarkRemoved,
    },
  });

  res.status(201).json(video);
});

export default router;

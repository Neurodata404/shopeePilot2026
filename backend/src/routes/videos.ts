import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import {
  estimateProfit,
  generateAffiliateLink,
  generateCaption,
  getMockAlternativeProducts,
  mockDownloadTikTokVideo,
} from "../services/mockIntegrations";
import { autoMatchVideo } from "../services/videoMatching";

const router = Router();

const intakeSchema = z.object({
  sourceUrl: z.string().url(),
  creatorId: z.string().optional(),
});

const confirmMatchSchema = z.object({
  productName: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  commission: z.number().positive().optional(),
  shopeeUrl: z.string().url().optional(),
});

router.get("/", async (req: AuthRequest, res) => {
  const videos = await prisma.video.findMany({
    where: { userId: req.userId },
    include: { productMatch: true },
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

  await autoMatchVideo(req.userId!, video.id, video.sourceUrl);

  const enriched = await prisma.video.findUnique({ where: { id: video.id }, include: { productMatch: true } });
  res.status(201).json(enriched);
});

router.get("/:id/alternatives", async (req: AuthRequest, res) => {
  const video = await prisma.video.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { productMatch: true },
  });

  if (!video || !video.productMatch) {
    return res.status(404).json({ error: "Video or product match not found" });
  }

  const alternatives = getMockAlternativeProducts(video.productMatch.category).filter(
    (item) => item.productName !== video.productMatch!.productName,
  );

  return res.json({ alternatives });
});

router.get("/review-queue", async (req: AuthRequest, res) => {
  const reviewItems = await prisma.video.findMany({
    where: {
      userId: req.userId,
      status: "needs_review",
      productMatch: { confidence: { lt: 70 } },
    },
    include: { productMatch: true },
    orderBy: { importedAt: "desc" },
  });

  res.json(reviewItems);
});

router.post("/:id/confirm-match", async (req: AuthRequest, res) => {
  const parsed = confirmMatchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const video = await prisma.video.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { productMatch: true },
  });

  if (!video || !video.productMatch) {
    return res.status(404).json({ error: "Video or product match not found" });
  }

  await prisma.$transaction([
    prisma.productMatch.update({
      where: { videoId: video.id },
      data: {
        productName: parsed.data.productName ?? video.productMatch.productName,
        category: parsed.data.category ?? video.productMatch.category,
        commission: parsed.data.commission ?? video.productMatch.commission,
        shopeeUrl: parsed.data.shopeeUrl ?? video.productMatch.shopeeUrl,
        confidence: 100,
      },
    }),
    prisma.video.update({ where: { id: video.id }, data: { status: "ready" } }),
  ]);

  const updated = await prisma.video.findUnique({ where: { id: video.id }, include: { productMatch: true } });
  return res.json(updated);
});

router.post("/:id/reanalyze", async (req: AuthRequest, res) => {
  const video = await prisma.video.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  await prisma.video.update({ where: { id: video.id }, data: { status: "processing" } });
  await autoMatchVideo(req.userId!, video.id, video.sourceUrl);

  const updated = await prisma.video.findUnique({ where: { id: video.id }, include: { productMatch: true } });
  return res.json(updated);
});

router.post("/:id/post", async (req: AuthRequest, res) => {
  const video = await prisma.video.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { productMatch: true },
  });

  if (!video || !video.productMatch) {
    return res.status(404).json({ error: "Video or product match not found" });
  }

  if (video.status !== "ready") {
    return res.status(400).json({ error: "Video is not ready to post" });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const accounts = await prisma.shopeeAccount.findMany({ where: { userId: req.userId, active: true } });
  if (accounts.length === 0) {
    return res.status(400).json({ error: "No active accounts available" });
  }

  const usage = await prisma.videoPost.groupBy({
    by: ["shopeeAccountId"],
    where: { userId: req.userId, postedAt: { gte: startOfDay } },
    _count: { _all: true },
  });

  const usageMap = new Map<string, number>(
    (usage as Array<{ shopeeAccountId: string; _count: { _all: number } }>).map((u) => [u.shopeeAccountId, u._count._all]),
  );

  const available = (accounts as Array<{ id: string; dailyLimit: number; username: string }> )
    .map((account) => ({ account, used: usageMap.get(account.id) ?? 0 }))
    .filter((entry: { account: { dailyLimit: number }; used: number }) => entry.used < entry.account.dailyLimit)
    .sort((a: { used: number }, b: { used: number }) => a.used - b.used);

  if (available.length === 0) {
    return res.status(400).json({ error: "Daily limit reached for all accounts" });
  }

  const selected = available[0].account;
  const affiliateLink = generateAffiliateLink(video.id, video.productMatch.productName);
  const caption = generateCaption(video.productMatch.productName, affiliateLink);
  const estimatedProfit = estimateProfit(video.productMatch.commission);

  const post = await prisma.videoPost.create({
    data: {
      userId: req.userId!,
      videoId: video.id,
      shopeeAccountId: selected.id,
      caption,
      affiliateLink,
      estimatedProfit,
    },
  });

  await prisma.video.update({ where: { id: video.id }, data: { status: "posted" } });

  return res.status(201).json({
    message: `Video posted successfully to @${selected.username}`,
    post,
    account: selected,
  });
});

export default router;

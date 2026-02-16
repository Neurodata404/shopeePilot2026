import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/summary", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalVideos,
    matchedVideos,
    needsReview,
    postsToday,
    accountList,
    todayUsage,
    accountProfit,
    recentPosts,
  ] = await Promise.all([
    prisma.video.count({ where: { userId } }),
    prisma.productMatch.count({ where: { userId } }),
    prisma.video.count({ where: { userId, status: "needs_review" } }),
    prisma.videoPost.count({ where: { userId, postedAt: { gte: startOfDay } } }),
    prisma.shopeeAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.videoPost.groupBy({
      by: ["shopeeAccountId"],
      where: { userId, postedAt: { gte: startOfDay } },
      _count: { _all: true },
    }),
    prisma.videoPost.groupBy({
      by: ["shopeeAccountId"],
      where: { userId },
      _sum: { estimatedProfit: true },
    }),
    prisma.videoPost.findMany({
      where: { userId },
      include: {
        video: {
          include: { productMatch: true },
        },
        shopeeAccount: true,
      },
      orderBy: { postedAt: "desc" },
      take: 10,
    }),
  ]);

  const usageMap = new Map<string, number>(
    (todayUsage as Array<{ shopeeAccountId: string; _count: { _all: number } }>).map((u) => [u.shopeeAccountId, u._count._all]),
  );
  const profitMap = new Map<string, number>(
    (accountProfit as Array<{ shopeeAccountId: string; _sum: { estimatedProfit: number | null } }>).map((p) => [
      p.shopeeAccountId,
      p._sum.estimatedProfit ?? 0,
    ]),
  );

  const accountStats = (accountList as Array<{ id: string; username: string; active: boolean; dailyLimit: number }>).map((account) => ({
    accountId: account.id,
    username: account.username,
    active: account.active,
    dailyLimit: account.dailyLimit,
    postsToday: usageMap.get(account.id) ?? 0,
    profitTotal: Number((profitMap.get(account.id) ?? 0).toFixed(2)),
  }));

  res.json({
    totals: {
      totalVideos,
      matchedVideos,
      needsReview,
      postsToday,
      profitTotal: Number(accountStats.reduce((sum: number, a: { profitTotal: number }) => sum + a.profitTotal, 0).toFixed(2)),
    },
    accountStats,
    recentPosts: (recentPosts as Array<{
      id: string;
      postedAt: Date;
      affiliateLink: string;
      estimatedProfit: number;
      shopeeAccount: { username: string };
      video: { productMatch?: { productName: string; confidence: number } | null };
    }>).map((post) => ({
      id: post.id,
      postedAt: post.postedAt,
      account: post.shopeeAccount.username,
      product: post.video.productMatch?.productName ?? "Unknown",
      confidence: post.video.productMatch?.confidence ?? null,
      affiliateLink: post.affiliateLink,
      estimatedProfit: post.estimatedProfit,
    })),
  });
});

export default router;

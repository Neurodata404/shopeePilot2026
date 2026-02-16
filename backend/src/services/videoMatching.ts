import { prisma } from "../lib/prisma";
import { mockAutoMatchProduct } from "./mockIntegrations";

export async function autoMatchVideo(userId: string, videoId: string, sourceUrl: string) {
  const match = await mockAutoMatchProduct(sourceUrl);
  const nextStatus = match.confidence < 70 ? "needs_review" : "ready";

  await prisma.$transaction([
    prisma.productMatch.upsert({
      where: { videoId },
      update: {
        productName: match.productName,
        category: match.category,
        confidence: match.confidence,
        commission: match.commission,
        shopeeUrl: match.shopeeUrl,
      },
      create: {
        userId,
        videoId,
        productName: match.productName,
        category: match.category,
        confidence: match.confidence,
        commission: match.commission,
        shopeeUrl: match.shopeeUrl,
      },
    }),
    prisma.video.update({ where: { id: videoId }, data: { status: nextStatus } }),
  ]);
}

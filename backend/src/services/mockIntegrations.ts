export async function mockDownloadTikTokVideo(url: string) {
  return {
    sourceUrl: url,
    status: "downloaded",
    watermarkRemoved: true,
  };
}

export function generateMockCreatorVideoUrls(username: string, count = 3): string[] {
  return Array.from({ length: count }, (_, i) =>
    `https://tiktok.com/@${username.replace("@", "")}/video/mock-${Date.now()}-${i}`,
  );
}

const MOCK_PRODUCTS = [
  { name: "Anker PowerCore 20000mAh Power Bank", category: "Electronics", commission: 4.5 },
  { name: "iPhone 15 Pro Max Case", category: "Accessories", commission: 5.2 },
  { name: "Korean Glass Skin Serum", category: "Beauty", commission: 6.8 },
  { name: "Ergonomic Office Chair", category: "Home", commission: 3.9 },
  { name: "Running Shoes ProFit", category: "Sports", commission: 5.7 },
];

export type MockProductMatch = {
  productName: string;
  category: string;
  confidence: number;
  commission: number;
  shopeeUrl: string;
};

export async function mockAutoMatchProduct(videoUrl: string): Promise<MockProductMatch> {
  const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
  const confidence = 55 + Math.floor(Math.random() * 45); // 55-99
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    productName: product.name,
    category: product.category,
    confidence,
    commission: product.commission,
    shopeeUrl: `https://shopee.sg/product/mock-${slug}`,
  };
}

export function generateAffiliateLink(videoId: string, productName: string): string {
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `https://shopee.sg/aff/${slug}?v=${videoId.slice(0, 8)}`;
}

export function generateCaption(productName: string, affiliateLink: string): string {
  return `Must-have: ${productName}! Grab yours here ${affiliateLink} #shopee #affiliate #trending`;
}

export function estimateProfit(commissionPercent: number): number {
  const baseSale = 20 + Math.random() * 180;
  const profit = (baseSale * commissionPercent) / 100;
  return Number(profit.toFixed(2));
}

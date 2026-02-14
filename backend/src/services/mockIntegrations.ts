export async function mockDownloadTikTokVideo(url: string) {
  return {
    sourceUrl: url,
    status: "downloaded",
    watermarkRemoved: true,
  };
}

export function generateMockCreatorVideoUrls(username: string, count = 3): string[] {
  return Array.from({ length: count }, (_, i) => `https://tiktok.com/@${username.replace("@", "")}/video/mock-${Date.now()}-${i}`);
}

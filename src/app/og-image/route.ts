import { renderSocialImage } from "@/lib/social-image";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? undefined;
  const subtitle = searchParams.get("subtitle") ?? undefined;
  const response = await renderSocialImage(title, subtitle);
  return new Response(response.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
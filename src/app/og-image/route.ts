import { renderSocialImage } from "@/lib/social-image";

export async function GET() {
  const response = await renderSocialImage();
  return new Response(response.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
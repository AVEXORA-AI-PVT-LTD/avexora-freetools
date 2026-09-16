import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db";

export type NavLocation = "HEADER" | "FOOTER";

export interface NavigationLinkItem {
  id: string;
  label: string;
  href: string;
  location: NavLocation;
  displayOrder: number;
  status: boolean;
  type: string;
  openInNewTab: boolean;
}

const safeHref = (href: string) => {
  const h = href.trim();
  const lower = h.toLowerCase();
  if (lower.startsWith("javascript:")) return false;
  if (lower.startsWith("data:")) return false;
  if (lower.startsWith("vbscript:")) return false;
  if (lower.startsWith("file:")) return false;
  if (lower.startsWith("//")) return false; // protocol relative
  return true;
};

async function fetchNavigation(location: NavLocation): Promise<NavigationLinkItem[]> {
  try {
    const links = await prisma.navigationLink.findMany({
      where: {
        location,
        status: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return links
      .filter((link: any) => safeHref(link.href))
      .map((link: any) => ({
        id: link.id,
        label: link.label.trim(),
        href: link.href.trim(),
        location: link.location as NavLocation,
        displayOrder: link.displayOrder,
        status: link.status,
        type: link.type,
        openInNewTab: link.openInNewTab,
      }));
  } catch (error) {
    console.error(`[Navigation] Error fetching ${location} navigation:`, error);
    return []; // Fail closed securely without breaking the layout
  }
}

export const getEffectiveNavigation = unstable_cache(
  async (location: NavLocation) => fetchNavigation(location),
  ["effective-navigation"],
  {
    tags: ["navigation"],
    revalidate: 3600, // Background revalidation fallback
  }
);

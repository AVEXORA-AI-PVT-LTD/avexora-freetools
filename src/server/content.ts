import { DISPLAYED_TOOL_COUNT } from "@/tools/registry";
import { prisma } from "@/server/db";

export type ContentBlockKey = 
  | "homepage.hero.title"
  | "homepage.hero.description"
  | "footer.description"
  | "footer.copyright";

export interface ContentBlockConfig {
  key: ContentBlockKey;
  label: string;
  section: string;
  type: "TEXT" | "TEXTAREA";
  default: string;
  maxLength: number;
  required: boolean;
}

export const CONTENT_BLOCKS: Record<ContentBlockKey, ContentBlockConfig> = {
  "homepage.hero.title": {
    key: "homepage.hero.title",
    label: "Hero Title",
    section: "Homepage",
    type: "TEXT",
    default: "Avexora Tools",
    maxLength: 100,
    required: true,
  },
  "homepage.hero.description": {
    key: "homepage.hero.description",
    label: "Hero Description",
    section: "Homepage",
    type: "TEXTAREA",
    default: "Avexora Tools, by Avexora, provides {DISPLAYED_TOOL_COUNT}+ practical online calculators, generators, PDF utilities, image utilities, AI writing tools, and business utilities for everyday work.",
    maxLength: 300,
    required: true,
  },
  "footer.description": {
    key: "footer.description",
    label: "Footer Description",
    section: "Footer",
    type: "TEXTAREA",
    default: "Avexora Tools, by Avexora, provides practical online business tools. {EBOS_LINK} Tools are provided as-is without warranty; verify important calculations independently.",
    maxLength: 500,
    required: true,
  },
  "footer.copyright": {
    key: "footer.copyright",
    label: "Copyright",
    section: "Footer",
    type: "TEXT",
    default: "© {YEAR} Avexora · {HOST} —",
    maxLength: 100,
    required: true,
  },
};

export const CONTENT_BLOCKS_LIST = Object.values(CONTENT_BLOCKS);


function replacePlaceholders(text: string): string {
  return text
    .replace(/{DISPLAYED_TOOL_COUNT}/g, DISPLAYED_TOOL_COUNT.toString())
    .replace(/{YEAR}/g, new Date().getFullYear().toString())
    .replace(/{HOST}/g, "tools.avexora.in");
}

export async function getEffectiveContent(key: ContentBlockKey): Promise<string> {
  const config = CONTENT_BLOCKS[key];
  if (!config) return "";

  try {
    const block = await prisma.contentBlock.findUnique({ where: { key } });
    if (block && block.status) {
      return replacePlaceholders(block.value);
    }
  } catch (err) {
    console.error(`Failed to load content block ${key}`, err);
  }

  return replacePlaceholders(config.default);
}

export async function getEffectiveContents(): Promise<Record<ContentBlockKey, string>> {
  const result = {} as Record<ContentBlockKey, string>;
  
  for (const k of Object.keys(CONTENT_BLOCKS) as ContentBlockKey[]) {
    result[k] = CONTENT_BLOCKS[k].default; // we replace this later for the admin UI to see the raw text
  }

  try {
    const blocks = await prisma.contentBlock.findMany({
      where: {
        key: { in: Object.keys(CONTENT_BLOCKS) },
        status: true
      }
    });
    
    for (const block of blocks) {
      if (CONTENT_BLOCKS[block.key as ContentBlockKey]) {
        result[block.key as ContentBlockKey] = block.value; // intentionally raw for admin UI editing
      }
    }
  } catch (err) {
    console.error("Failed to load content blocks", err);
  }
  
  return result;
}

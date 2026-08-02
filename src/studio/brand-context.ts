import type { Brand, BrandKit } from "@prisma/client";
import { type BrandTokens, resolveTokens } from "./engine/tokens";
import type { ComplianceInput, EntityType } from "./compliance/india";
import type { MarkStyle } from "./engine/marks";
import type { LogoLayout } from "./engine/tokens";

/**
 * Bridge between the database rows and the pure engine types.
 *
 * The engine deliberately knows nothing about Prisma — it takes plain tokens
 * and a compliance input. This is the single place that adapts one to the
 * other, so every route and page builds them identically.
 */

export function toComplianceInput(brand: Brand): ComplianceInput {
  return {
    entityType: brand.entityType as EntityType,
    name: brand.name,
    legalName: brand.legalName,
    cin: brand.cin,
    llpin: brand.llpin,
    gstin: brand.gstin,
    pan: brand.pan,
    registeredAddress: brand.registeredAddress,
    city: brand.city,
    state: brand.state,
    pincode: brand.pincode,
    phone: brand.phone,
    email: brand.email,
  };
}

export function toTokens(brand: Brand, kit: BrandKit | null): BrandTokens {
  return resolveTokens(
    {
      name: brand.name,
      legalName: brand.legalName ?? undefined,
      tagline: kit?.tagline ?? undefined,
    },
    {
      // A brand without a saved kit still renders — it falls back to the
      // first curated palette and pairing rather than erroring, so previews
      // work mid-onboarding.
      paletteId: kit?.paletteId ?? "indigo-slate",
      fontPairId: kit?.fontPairId ?? "inter-inter",
      markStyle: (kit?.markStyle as MarkStyle) ?? "monogram",
      markSeed: kit?.markSeed,
      logoLayout: (kit?.logoLayout as LogoLayout) ?? "horizontal",
      tagline: kit?.tagline ?? undefined,
    },
  );
}

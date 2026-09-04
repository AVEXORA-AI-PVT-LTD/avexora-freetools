"use client";

export type LeadEvent = "email_gate" | "newsletter" | "cta_click";

export interface LeadPayload {
  event: LeadEvent;
  toolSlug: string;
  category: string;
  email?: string;
  name?: string;
}

function utmParams(): Record<string, string> {
  try {
    const qs = new URLSearchParams(window.location.search);
    return {
      ...(qs.get("utm_source") && { utmSource: qs.get("utm_source")! }),
      ...(qs.get("utm_medium") && { utmMedium: qs.get("utm_medium")! }),
      ...(qs.get("utm_campaign") && { utmCampaign: qs.get("utm_campaign")! }),
    };
  } catch {
    return {};
  }
}

/**
 * Send a lead event. Returns true on success. The empty `website` field is a
 * honeypot the API rejects when filled by bots. keepalive lets CTA clicks
 * survive navigation away from the page.
 */
export async function submitLead(payload: LeadPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ ...payload, ...utmParams(), website: "" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

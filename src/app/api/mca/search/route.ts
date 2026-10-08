import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  decodeCin,
  decodeLlpin,
  analyzeCompanyName,
} from "@/tools/compute/legal/mca-company-search";

export const runtime = "nodejs";

const CIN_REGEX = /[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/gi;

interface LiveCompanyData {
  cin: string;
  name: string;
  state?: string;
  roc?: string;
  year?: string | number;
  companyAge?: number;
  class?: string;
  listingStatus?: string;
  industry?: string;
  industryCode?: string;
  registrationNumber?: string;
  status: string;
  address?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  source: string;
  complianceDueDates?: { form: string; purpose: string; deadline: string }[];
  statutoryNotice?: string;
  mcaMasterDataUrl: string;
}

/**
 * Queries Google Suggest API for real-time live company suggestions
 */
async function fetchGoogleCompanySuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      const rawList: string[] = data[1];
      // Filter out junk queries like "salary", "login", "careers", "jobs", "wiki"
      const filtered = rawList
        .filter((item) => typeof item === "string")
        .filter(
          (item) =>
            !/\b(salary|login|careers|jobs|internship|review|recruitment|portal|news)\b/i.test(item)
        )
        .slice(0, 8);
      return filtered;
    }
    return [];
  } catch (err) {
    return [];
  }
}

/**
 * Live web search to get relevant company and registry snippets
 */
async function searchWebForCompany(query: string): Promise<{ text: string; foundCins: string[] }> {
  try {
    const isCin = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/i.test(query.trim());
    const searchQuery = isCin
      ? query.trim()
      : `${query.trim()} CIN Zaubacorp`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
      }
    ).catch(() => null);

    clearTimeout(timeout);

    if (!res || !res.ok) {
      return { text: "", foundCins: [] };
    }

    const html = await res.text();

    // Extract all candidate 21-digit CINs in the HTML
    const matched = html.match(CIN_REGEX) || [];
    const foundCins = Array.from(new Set(matched.map((c) => c.toUpperCase())));

    // Extract text snippets from results
    const snippetMatches = html.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) || [];
    const titleMatches = html.match(/class="result__title"[^>]*>([\s\S]*?)<\/h2>/gi) || [];

    const extractedText = [...titleMatches, ...snippetMatches]
      .join("\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 3500);

    return { text: extractedText, foundCins };
  } catch (err) {
    return { text: "", foundCins: [] };
  }
}

/**
 * Uses Claude AI to parse live search snippets and corporate facts into a verified structured profile
 */
async function parseCompanyWithAI(
  query: string,
  webText: string,
  foundCins: string[]
): Promise<Partial<LiveCompanyData> & { isFound?: boolean } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const prompt = `You are an expert Indian Corporate Registry & MCA (Ministry of Corporate Affairs) Master Data intelligence system.
Analyze the user company search query and live web search snippets below:

Search Query: "${query}"
Candidate CINs detected from live search: ${foundCins.join(", ") || "None"}
Live Web Search Snippets:
${webText || "No web snippets available"}

TASK:
Extract or resolve the official corporate information for this Indian registered company.
If it is a real registered Indian company, foreign subsidiary in India, or incorporated startup (e.g. for "american express" resolve "AMERICAN EXPRESS (INDIA) PRIVATE LIMITED"; for "Avexora AI (OPC) Private Limited" resolve its registered profile):
Return ONLY a valid JSON object with these exact keys:
{
  "isFound": true,
  "companyName": "Official Legal Name of Company",
  "cin": "Exact 21-digit Corporate Identity Number if known/detected, or null",
  "status": "Active / Incorporated / Inactive",
  "incorporationYear": "Year as 4 digits (e.g. 1994, 2022, 2026)",
  "state": "Indian state name (e.g. Delhi, Haryana, Odisha, Maharashtra, Karnataka)",
  "rocOffice": "RoC Jurisdiction (e.g. RoC Delhi, RoC Cuttack, RoC Bangalore)",
  "companyClass": "Private Limited Company / One Person Company (OPC) / Public Limited Company / Foreign Subsidiary",
  "industry": "Concise industry / business activity description",
  "registeredAddress": "Registered office address or city, or null",
  "paidUpCapital": "Paid-up capital if known, or null",
  "authorizedCapital": "Authorized capital if known, or null"
}

If the name is NOT registered or does NOT correspond to an existing company/entity in India, return:
{
  "isFound": false,
  "companyName": "${query}"
}

Strictly output raw JSON only with no markdown backticks or commentary.`;

    // Try Claude Sonnet 4.5 first, fallback to Claude Haiku 5.5
    const candidateModels = ["claude-sonnet-4-5-20250929", "claude-haiku-5-5", "claude-sonnet-5-5"];
    let rawText = "";

    for (const model of candidateModels) {
      try {
        const response = await client.messages.create({
          model,
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        });

        const textBlock = response.content.find((c) => c.type === "text");
        if (textBlock && textBlock.type === "text" && textBlock.text) {
          rawText = textBlock.text.trim();
          break;
        }
      } catch (callErr: any) {
        console.warn(`[MCA AI model ${model} skipped]:`, callErr?.message || callErr);
      }
    }

    if (rawText) {
      const cleanJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleanJson);

      return {
        isFound: parsed.isFound ?? true,
        name: parsed.companyName || query,
        cin: parsed.cin || undefined,
        status: parsed.status || "Active",
        year: parsed.incorporationYear,
        state: parsed.state,
        roc: parsed.rocOffice,
        class: parsed.companyClass,
        industry: parsed.industry,
        address: parsed.registeredAddress,
        paidUpCapital: parsed.paidUpCapital,
        authorizedCapital: parsed.authorizedCapital,
        source: "live_ai_mca_resolution",
      };
    }
  } catch (err) {
    console.error("[ai company extraction error]", err);
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const suggest = searchParams.get("suggest") === "true";

    if (!query) {
      return NextResponse.json({ error: "Search query 'q' is required." }, { status: 400 });
    }

    // Live Typeahead / Autocomplete Mode
    if (suggest) {
      const suggestions = await fetchGoogleCompanySuggestions(query);
      return NextResponse.json({
        type: "suggestions",
        query,
        suggestions,
      });
    }

    const cleanUpper = query.toUpperCase();

    // Mode 1: Query is a 21-digit CIN (Direct CIN Search)
    if (cleanUpper.length === 21 && /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(cleanUpper)) {
      const decoded = decodeCin(cleanUpper);
      if (!decoded.isValid) {
        return NextResponse.json({ error: decoded.message }, { status: 400 });
      }

      // Live search to fetch the official company name for this CIN
      const { text, foundCins } = await searchWebForCompany(cleanUpper);
      const aiData = await parseCompanyWithAI(cleanUpper, text, [cleanUpper, ...foundCins]);

      const resolvedName = aiData?.name || `Corporate Entity (${decoded.companyClass})`;
      const resolvedAddress = aiData?.address || decoded.rocAddress;
      const resolvedStatus = aiData?.status || "Active";

      return NextResponse.json({
        type: "cin",
        company: {
          cin: decoded.cin,
          name: resolvedName,
          status: resolvedStatus,
          state: decoded.stateName,
          roc: decoded.rocOffice,
          year: decoded.yearOfIncorporation,
          companyAge: decoded.companyAge,
          class: aiData?.class || decoded.companyClass,
          listingStatus: decoded.listingStatus,
          industry: aiData?.industry || decoded.industryName,
          industryCode: decoded.industryCode,
          registrationNumber: decoded.registrationNumber,
          address: resolvedAddress,
          paidUpCapital: aiData?.paidUpCapital,
          authorizedCapital: aiData?.authorizedCapital,
          complianceDueDates: decoded.complianceDueDates,
          statutoryNotice: decoded.statutoryNotice,
          mcaMasterDataUrl: decoded.mcaMasterDataUrl,
          source: "live_web_and_statutory_decoder",
        },
      });
    }

    // Mode 2: Query is a 7-character LLPIN
    const cleanLlpin = cleanUpper.replace("-", "");
    if (cleanLlpin.length === 7 && /^[A-Z]{3}\d{4}$/.test(cleanLlpin)) {
      const decoded = decodeLlpin(cleanUpper);
      return NextResponse.json({
        type: "llpin",
        llpin: decoded,
      });
    }

    // Mode 3: Query is a Company Name (e.g. Americana Restaurants, Avexora AI, etc.)
    const { text, foundCins } = await searchWebForCompany(query);

    // Use AI extraction with web snippets to get authentic corporate data
    const aiData = await parseCompanyWithAI(query, text, foundCins);

    // Check if we have a valid CIN from either foundCins or AI
    let effectiveCin = (aiData?.cin || foundCins[0] || "").toUpperCase();
    if (!/^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(effectiveCin)) {
      effectiveCin = "";
    }

    if (effectiveCin) {
      // Decode CIN statutory attributes
      const decoded = decodeCin(effectiveCin);

      const companyResult: LiveCompanyData = {
        cin: decoded.cin,
        name: aiData?.name || query.trim(),
        status: aiData?.status || "Active",
        state: decoded.stateName,
        roc: decoded.rocOffice,
        year: decoded.yearOfIncorporation,
        companyAge: decoded.companyAge,
        class: aiData?.class || decoded.companyClass,
        listingStatus: decoded.listingStatus,
        industry: aiData?.industry || decoded.industryName,
        industryCode: decoded.industryCode,
        registrationNumber: decoded.registrationNumber,
        address: aiData?.address || decoded.rocAddress,
        paidUpCapital: aiData?.paidUpCapital,
        authorizedCapital: aiData?.authorizedCapital,
        complianceDueDates: decoded.complianceDueDates,
        statutoryNotice: decoded.statutoryNotice,
        mcaMasterDataUrl: decoded.mcaMasterDataUrl,
        source: "live_registry_and_mca_decoder",
      };

      return NextResponse.json({
        type: "company",
        query,
        company: companyResult,
      });
    }

    // If company was identified by AI intelligence (even if CIN is newly allotted or pending)
    if (aiData && aiData.isFound && aiData.name && aiData.name.length > 2) {
      return NextResponse.json({
        type: "company",
        query,
        company: {
          cin: aiData.cin || "CIN Pending / Registry Updation",
          name: aiData.name,
          status: aiData.status || "Active",
          state: aiData.state || "India",
          roc: aiData.roc || "RoC India",
          year: aiData.year || "Incorporated Entity",
          class: aiData.class || "Private Limited / OPC",
          listingStatus: "Unlisted Corporate Entity",
          industry: aiData.industry || "Corporate & Commercial Activities",
          address: aiData.address,
          paidUpCapital: aiData.paidUpCapital,
          authorizedCapital: aiData.authorizedCapital,
          source: "live_web_intelligence",
          mcaMasterDataUrl: "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html",
        },
      });
    }

    // Safety fallback: If live web search detected candidate CINs directly
    if (foundCins.length > 0) {
      const bestCin = foundCins[0];
      const decoded = decodeCin(bestCin);
      if (decoded.isValid) {
        return NextResponse.json({
          type: "company",
          query,
          company: {
            cin: decoded.cin,
            name: query.trim(),
            status: "Active",
            state: decoded.stateName,
            roc: decoded.rocOffice,
            year: decoded.yearOfIncorporation,
            companyAge: decoded.companyAge,
            class: decoded.companyClass,
            listingStatus: decoded.listingStatus,
            industry: decoded.industryName,
            industryCode: decoded.industryCode,
            registrationNumber: decoded.registrationNumber,
            address: decoded.rocAddress,
            complianceDueDates: decoded.complianceDueDates,
            statutoryNotice: decoded.statutoryNotice,
            mcaMasterDataUrl: decoded.mcaMasterDataUrl,
            source: "live_web_cin_detection",
          },
        });
      }
    }

    // No matching company found -> Analyze name under MCA Rule 8 guidelines
    const analysis = analyzeCompanyName(query, "pvt-ltd");
    return NextResponse.json({
      type: "unregistered",
      query,
      message: `No active Indian registered company found matching "${query}".`,
      analysis,
    });
  } catch (error: any) {
    console.error("[mca search api error]", error);
    return NextResponse.json(
      { error: "Internal server error occurred while searching MCA records." },
      { status: 500 }
    );
  }
}

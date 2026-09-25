import { getEligibleAds } from "@/server/ads";
import Script from "next/script";

interface AdSlotProps {
  placement: "header" | "homepage" | "tool_page" | "sidebar" | "footer";
  device?: "desktop" | "mobile" | "tablet" | "all";
  categorySlug?: string;
  toolSlug?: string;
  className?: string;
}

export async function AdSlot({ placement, device, categorySlug, toolSlug, className = "" }: AdSlotProps) {
  const ads = await getEligibleAds(placement, { device, categorySlug, toolSlug });

  if (!ads || ads.length === 0) {
    return null; // Render nothing if no eligible active ad exists
  }

  // Select highest priority eligible ad (first item after priority sorting)
  const ad = ads[0];

  return (
    <div className={`ad-slot-container ad-placement-${placement} my-4 overflow-hidden text-center ${className}`}>
      
      {/* INTERNAL PROMO BANNER */}
      {ad.adProvider === "internal" && (
        ad.imageUrl ? (
          <a 
            href={ad.destinationUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block rounded-xl overflow-hidden shadow-sm hover:opacity-95 transition-opacity border border-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.name} className="max-w-full h-auto mx-auto object-cover max-h-[120px] sm:max-h-[250px]" />
          </a>
        ) : ad.destinationUrl ? (
          <a 
            href={ad.destinationUrl} 
            className="inline-block px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-xl text-sm shadow-sm hover:from-orange-700 hover:to-amber-700 transition-colors"
          >
            {ad.name}
          </a>
        ) : null
      )}

      {/* CUSTOM SANITIZED HTML */}
      {ad.adProvider === "custom" && ad.customHtml && (
        <div 
          className="custom-ad-content inline-block text-left max-w-full"
          dangerouslySetInnerHTML={{ __html: ad.customHtml }}
        />
      )}

      {/* GOOGLE ADSENSE */}
      {ad.adProvider === "adsense" && ad.adReference && (
        <div className="adsense-unit-wrapper min-h-[90px] flex items-center justify-center bg-slate-50/50 rounded-lg">
          <ins 
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-0000000000000000"}
            data-ad-slot={ad.adReference}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <Script 
            id={`adsense-script-${ad.id}`} 
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-0000000000000000"}`}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* GOOGLE AD MANAGER */}
      {ad.adProvider === "admanager" && ad.adReference && (
        <div className="admanager-unit-wrapper min-h-[90px] flex items-center justify-center bg-slate-50/50 rounded-lg">
          <div id={`gam-slot-${ad.adReference}`} className="mx-auto" />
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { AVEXORA_PRODUCTS, productUrl } from "@/config/avexora-products";

/**
 * "More from Avexora": one card per Avexora product, linking out to its site.
 * `placement` tags the links (utm_campaign) so each product's analytics show
 * which page sent the visit.
 */
export function AvexoraProductCards({
  placement,
  heading = "More from Avexora",
  showAllLink = true,
}: {
  placement: string;
  heading?: string;
  showAllLink?: boolean;
}) {
  return (
    <section aria-labelledby="avexora-products-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="avexora-products-heading" className="text-xl font-semibold text-slate-900">
          {heading}
        </h2>
        {showAllLink && (
          <Link href="/products" className="text-sm font-medium text-orange-700 hover:text-orange-800">
            All Avexora products →
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Business software from the team behind these free tools.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AVEXORA_PRODUCTS.map((p) => (
          <li
            key={p.id}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-orange-300"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-orange-700">{p.kind}</span>
            <h3 className="mt-1 font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-600">{p.tagline}</p>
            <a
              href={productUrl(p, placement)}
              target="_blank"
              rel="noopener"
              className="mt-3 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              Visit {p.name} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

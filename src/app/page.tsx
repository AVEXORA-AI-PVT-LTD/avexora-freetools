import Link from "next/link";
import { categories } from "@/tools/categories";
import { allTools, toolsByCategory } from "@/tools/registry";
import { ToolSearch, type SearchItem } from "@/components/tool-search";

export default function HomePage() {
  const searchItems: SearchItem[] = categories.flatMap((c) =>
    toolsByCategory[c.slug].map((t) => ({
      name: t.name,
      slug: t.slug,
      category: c.slug,
      categoryName: c.shortName,
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Free tools that run your business faster
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          {allTools.length}+ calculators, generators, PDF &amp; image utilities and AI
          writers. No sign-up. No cost. Built by the team behind Enterprise Business OS.
        </p>
        <div className="mt-8">
          <ToolSearch items={searchItems} />
        </div>
      </section>

      <section id="categories" className="pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const tools = toolsByCategory[c.slug];
            return (
              <div
                key={c.slug}
                className="flex flex-col rounded-xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  <Link href={`/${c.slug}`} className="hover:text-indigo-700">
                    {c.name}
                  </Link>
                </h2>
                <p className="mt-1 flex-1 text-sm text-slate-600">{c.description}</p>
                {tools.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {tools.slice(0, 4).map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${c.slug}/${t.slug}`}
                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {tools.length > 0
                    ? `${tools.length} tool${tools.length > 1 ? "s" : ""} live`
                    : "Coming soon"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

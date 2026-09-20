import Link from "next/link";
import { categories } from "@/tools/categories";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-6xl font-bold text-orange-600">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        That tool page could not be found
      </h1>
      <p className="mt-3 text-slate-600">
        The page you asked for doesn&apos;t exist or may have moved. Browse the
        categories below to find the tool you need.
      </p>
      <nav aria-label="Categories" className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-orange-300 hover:text-orange-800"
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <p className="mt-8">
        <Link href="/" className="font-medium text-orange-700 hover:text-orange-900">
          Back to the Avexora Tools homepage
        </Link>
      </p>
    </div>
  );
}
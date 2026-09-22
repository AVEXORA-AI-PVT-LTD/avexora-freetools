export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl font-semibold text-slate-900">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-6 text-slate-700">{children}</p>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{children}</ul>;
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="text-orange-700">
        •
      </span>
      <span>{children}</span>
    </li>
  );
}

const STYLES = {
  pass: {
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    label: "Compliant",
  },
  warn: {
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
    label: "Needs attention",
  },
  fail: {
    className: "bg-red-50 text-red-700 ring-red-600/20",
    label: "Not compliant",
  },
} as const;

export function StatusPill({
  status,
  label,
}: {
  status: "pass" | "warn" | "fail";
  label?: string;
}) {
  const style = STYLES[status];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}
    >
      {label ?? style.label}
    </span>
  );
}

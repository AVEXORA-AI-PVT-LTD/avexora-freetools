/**
 * Shared UI tokens for tool interfaces. These are the single source of truth
 * for the small set of form/button classes reused across the tool components.
 * Both `image-shared` and `pdf-shared` re-export these so existing imports keep
 * working; new buttons/inputs should pull from here instead of hand-rolling
 * class strings.
 */
export const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export const labelCls = "mb-1 block text-sm font-medium text-slate-700";

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

/** Light "frame" used to group an uploader/preview/controls into one workflow. */
export const panelCls = "rounded-xl border border-slate-200 bg-white";
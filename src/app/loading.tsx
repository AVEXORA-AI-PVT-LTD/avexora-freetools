export default function GlobalLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 animate-pulse" />
    </div>
  );
}

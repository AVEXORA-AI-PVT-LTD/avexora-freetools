import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-extrabold text-orange-600">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-zinc-900">Page Not Found</h2>
      <p className="mt-2 text-zinc-500">
        The admin page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link 
        href="/admin" 
        className="mt-8 rounded-md bg-orange-600 px-6 py-3 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

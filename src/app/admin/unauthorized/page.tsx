export default function UnauthorizedPage() {
  return (
    <div className="fixed inset-0 z-50 flex h-full items-center justify-center p-8 bg-zinc-50">
      <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-zinc-600">
          You do not have the required permissions to access this page or perform this action.
          If you believe this is an error, please contact a Super Admin.
        </p>
      </div>
    </div>
  );
}

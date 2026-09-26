import { requireAdminAuth } from "@/server/admin-auth";
import MediaLibraryClient from "./MediaLibraryClient";

export const metadata = {
  title: "Media Library | Avex Tools Admin",
};

export default async function MediaLibraryPage() {
  await requireAdminAuth("media.view");

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
        <p className="text-slate-500 text-sm mt-1">
          Central asset management system for tool icons, thumbnails, blog images, OG assets, and documents.
        </p>
      </div>

      <MediaLibraryClient />
    </main>
  );
}

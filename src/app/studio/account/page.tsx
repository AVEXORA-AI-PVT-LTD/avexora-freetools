import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { updateAccountDetails } from "@/server/onboarding-actions";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/studio/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Account Settings
          </h2>
        </div>
      </div>

      <div className="mt-8 bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl">
        <form action={updateAccountDetails} className="px-4 py-6 sm:p-8">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            
            {/* Email (Disabled) */}
            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  defaultValue={user?.email}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 disabled:bg-slate-50 disabled:text-slate-500 sm:text-sm sm:leading-6"
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your email address cannot be changed.
              </p>
            </div>

            {/* Name */}
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900">
                Full name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={user?.name ?? ""}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-900">
                Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={user?.phone ?? ""}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {/* Company */}
            <div className="sm:col-span-3">
              <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-slate-900">
                Company Name
              </label>
              <div className="mt-2">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  defaultValue={user?.companyName ?? ""}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            {/* Role */}
            <div className="sm:col-span-3">
              <label htmlFor="jobRole" className="block text-sm font-medium leading-6 text-slate-900">
                Role / Designation
              </label>
              <div className="mt-2">
                <input
                  id="jobRole"
                  name="jobRole"
                  type="text"
                  defaultValue={user?.jobRole ?? ""}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-slate-900/10 pt-8">
            <button
              type="submit"
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

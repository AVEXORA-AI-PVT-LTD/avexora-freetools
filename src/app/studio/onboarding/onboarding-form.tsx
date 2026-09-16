"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/server/onboarding-actions";

export function OnboardingForm({ initialName }: { initialName: string }) {
  const [loading, setLoading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await completeOnboarding(formData);
      router.push("/studio/app");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initialName}
            placeholder="John Doe"
            className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            placeholder="e.g. Avexora"
            className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Job Role */}
      <div>
        <label htmlFor="jobRole" className="block text-sm font-medium text-slate-700">
          Role / Designation <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="jobRole"
            name="jobRole"
            type="text"
            required
            placeholder="e.g. Founder, Developer"
            className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Phone Number <span className="text-xs font-normal text-slate-400">(Optional)</span>
        </label>
        <div className="mt-1">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Referral Code Toggle */}
      <div className="pt-2">
        {showReferral ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label htmlFor="referralCode" className="block text-sm font-medium text-slate-700">
              Referral Code
            </label>
            <div className="mt-1">
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                placeholder="Enter your code"
                className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        ) : (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowReferral(true)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
            >
              Have a referral code?
            </button>
          </div>
        )}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-70"
        >
          {loading ? "Saving Details..." : "Complete Setup"}
        </button>
      </div>
    </form>
  );
}

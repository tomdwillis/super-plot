"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order confirmed!</h1>
        <p className="text-gray-500 mb-2">
          Your report is being generated. We&apos;ll email you when it&apos;s ready.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {sessionId ? `Session: ${sessionId.slice(0, 20)}…` : ""}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/dashboard"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            View My Reports
          </a>
          <a
            href="/order"
            className="border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Order Another Report
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
          Loading…
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

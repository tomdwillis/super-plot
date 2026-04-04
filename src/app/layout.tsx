import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Plot — Vacant Land Intelligence",
  description:
    "Instant property intelligence reports for vacant land owners. Know what your land is worth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <nav className="border-b border-gray-100 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <span className="text-xl font-bold text-brand-700">Super Plot</span>
            </a>
            <div className="flex items-center gap-6">
              <a href="/order" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Order Report
              </a>
              <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                My Reports
              </a>
              <a
                href="/order"
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-100 mt-24 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>🗺️</span>
              <span className="font-semibold text-gray-600">Super Plot</span>
              <span>— Vacant Land Intelligence</span>
            </div>
            <div className="flex gap-6">
              <a href="/order" className="hover:text-gray-600">Order a Report</a>
              <a href="/dashboard" className="hover:text-gray-600">My Reports</a>
            </div>
            <p>© {new Date().getFullYear()} Super Plot. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

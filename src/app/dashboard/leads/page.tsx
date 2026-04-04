"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type LeadStatus = "new" | "contacted" | "converted";

interface Lead {
  id: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  apn: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;
  source_crm: string | null;
  created_at: string;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-yellow-50 text-yellow-700",
  converted: "bg-green-50 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_crm", "csv_upload");

    try {
      const res = await fetch("/api/leads/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
      } else {
        setImportResult(data);
        fetchLeads();
      }
    } catch {
      setImportError("Network error — import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const fullName = (lead: Lead) =>
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—";

  const location = (lead: Lead) =>
    [lead.city, lead.state].filter(Boolean).join(", ") || lead.county || "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Leads</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total.toLocaleString()} total leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileImport}
                disabled={importing}
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                {importing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import CSV
                  </>
                )}
              </span>
            </label>
            <a
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Reports
            </a>
          </div>
        </div>

        {/* Import result banner */}
        {importResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-medium text-green-800">
              Import complete — {importResult.imported.toLocaleString()} imported,{" "}
              {importResult.skipped} skipped (dupes), {importResult.errors.length} errors
              {" "}(of {importResult.total} total rows)
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-green-700 space-y-0.5">
                {importResult.errors.slice(0, 5).map((e) => (
                  <li key={e.row}>Row {e.row}: {e.reason}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>…and {importResult.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        )}
        {importError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {importError}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, APN, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm">No leads found.</p>
              {total === 0 && (
                <p className="text-gray-400 text-xs mt-1">Import a CSV file to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">APN</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{fullName(lead)}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{location(lead)}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{lead.apn ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{lead.source ?? lead.source_crm ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {leads.length > 0 && leads.length < total && (
          <p className="text-center text-sm text-gray-400 mt-3">
            Showing {leads.length} of {total.toLocaleString()} leads
          </p>
        )}

        {/* CSV format hint */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-1">CSV format</p>
          <p>Expected columns (order flexible, header row required):</p>
          <code className="block mt-1 font-mono bg-white border border-gray-200 rounded px-2 py-1">
            email, phone, first_name, last_name, address, city, state, zip, county, apn, source, notes
          </code>
          <p className="mt-1">Duplicates (same email + APN) are automatically skipped.</p>
        </div>
      </div>
    </div>
  );
}

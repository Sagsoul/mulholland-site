"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type ImportResult = {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

type PreviewRow = {
  name: string;
  price: string;
  stock_qty: string;
  description: string;
  is_active: string;
};

function parseCsvPreview(text: string): { headers: string[]; rows: string[][] } | null {
  function parseLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return values;
  }

  const lines = text
    .replace(/\uFEFF/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return null;
  return {
    headers: parseLine(lines[0]),
    rows: lines.slice(1, 6).map(parseLine),
  };
}

export default function ImportInventoryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [serverError, setServerError] = useState("");

  async function handleFileChange(selected: File | null) {
    setFileError("");
    setPreview(null);
    setResult(null);
    setServerError("");
    if (!selected) { setFile(null); return; }
    if (!selected.name.endsWith(".csv") && selected.type !== "text/csv") {
      setFileError("Only CSV files are accepted.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("File exceeds the 10 MB limit.");
      setFile(null);
      return;
    }
    setFile(selected);
    const text = await selected.text();
    setPreview(parseCsvPreview(text));
  }

  async function handleImport() {
    if (!file) return;
    setUploading(true);
    setServerError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/inventory", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data as ImportResult);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setServerError(err.message ?? "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy">Import Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bulk-import products from a CSV file. SKU is auto-generated for each product.
        </p>
      </div>

      {/* Template download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-800">Download example CSV template</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Columns: <code>name, price, stock_qty, description, is_active</code>
          </p>
        </div>
        <a
          href="/api/import/inventory/example"
          download
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Download
        </a>
      </div>

      {/* File picker */}
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <h2 className="font-semibold text-navy">Upload CSV</h2>

        <div
          role="button"
          tabIndex={0}
          aria-label="Select CSV file"
          className="border-2 border-dashed border-gray-300 hover:border-navy rounded-lg p-6 text-center cursor-pointer transition-colors"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        >
          {file ? (
            <p className="text-sm text-navy font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Click to select a CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
        />

        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        {/* Preview */}
        {preview && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="px-2 py-1 text-left border-b border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 text-gray-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!file || uploading}
          onClick={() => void handleImport()}
          className="bg-navy text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-navy/90 transition-colors"
        >
          {uploading ? "Importing…" : "Import Products"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-5 border ${result.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
          <h2 className="font-semibold mb-2">Import Results</h2>
          <ul className="text-sm space-y-1">
            <li className="text-green-700">✅ Created: {result.created}</li>
            <li className="text-blue-700">🔄 Updated: {result.updated}</li>
            {result.failed > 0 && <li className="text-red-700">❌ Failed: {result.failed}</li>}
          </ul>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Errors:</p>
              <ul className="text-xs text-red-600 space-y-0.5 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

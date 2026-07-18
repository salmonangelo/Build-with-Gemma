"use client";

import { useState, useRef } from "react";
import { LuUpload, LuFileSpreadsheet, LuFileText, LuX, LuLoader, LuCheck } from "react-icons/lu";

interface DataImportPanelProps {
  onDataImported: () => void;
}

export default function DataImportPanel({ onDataImported }: DataImportPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "preview" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewData, setPreviewData] = useState<{ materials: any[]; orders: any[] }>({ materials: [], orders: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus("parsing");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pricing/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.json();
        throw new Error(errText.error || "Failed to parse document");
      }

      const result = await res.json();
      setPreviewData({
        materials: result.materials || [],
        orders: result.orders || []
      });
      setImportStatus("preview");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during parsing.");
      setImportStatus("error");
    }
  };

  const confirmImport = () => {
    setImportStatus("success");
    setTimeout(() => {
      onDataImported();
      setIsOpen(false);
      setImportStatus("idle");
    }, 1500);
  };

  return (
    <div className="app-card border border-border-subtle bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LuFileSpreadsheet size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              Import Billing & Quote Data
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Upload supplier PDF invoices, Excel spreadsheets, or past prices to ground calculations
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-primary hover:text-primary-dark cursor-pointer uppercase tracking-wider"
        >
          {isOpen ? "Hide Panel" : "Expand"}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.csv,.xlsx,.xls"
        className="hidden"
      />

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-100 transition-all duration-300">
          {importStatus === "idle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drag and drop trigger zones */}
              <div 
                onClick={handleZoneClick}
                className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
              >
                <LuUpload size={32} className="text-slate-400 group-hover:text-primary transition-colors mb-3" />
                <span className="text-xs font-bold text-slate-800 mb-1">Upload PDF Supplier Invoice / Quote</span>
                <span className="text-[10px] text-slate-400">Extract pricing arrays and item terms automatically</span>
              </div>

              <div 
                onClick={handleZoneClick}
                className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
              >
                <LuFileSpreadsheet size={32} className="text-slate-400 group-hover:text-primary transition-colors mb-3" />
                <span className="text-xs font-bold text-slate-800 mb-1">Upload Excel Tooling/Material Log</span>
                <span className="text-[10px] text-slate-400">Directly sync bulk stock item lists</span>
              </div>
            </div>
          )}

          {importStatus === "parsing" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <LuLoader size={36} className="text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">Processing {fileName}...</p>
                <p className="text-xs text-slate-400">Gemini is running extraction logic and updating database schemas...</p>
              </div>
            </div>
          )}

          {importStatus === "preview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LuFileText className="text-amber-600 animate-pulse" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">Review Extracted Records</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{fileName} parsed successfully.</p>
                  </div>
                </div>
                <button
                  onClick={() => setImportStatus("idle")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <LuX size={16} />
                </button>
              </div>

              {/* Data Table Preview */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="min-w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="p-4">Extracted Item</th>
                      <th className="p-4">Base Cost</th>
                      <th className="p-4">Quoted / Sell Price</th>
                      <th className="p-4">Supplier / Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {previewData.materials.map((mat, idx) => (
                      <tr key={`mat-${idx}`}>
                        <td className="p-4 font-bold text-slate-800">{mat.name}</td>
                        <td className="p-4">₹{mat.currentCost}/unit</td>
                        <td className="p-4">₹{mat.marketCost}/unit</td>
                        <td className="p-4">{mat.supplier}</td>
                      </tr>
                    ))}
                    {previewData.orders.map((ord, idx) => (
                      <tr key={`ord-${idx}`}>
                        <td className="p-4 font-bold text-slate-800">Order ID: {ord.id}</td>
                        <td className="p-4">Margin Check</td>
                        <td className="p-4 text-emerald-600">{ord.margin}</td>
                        <td className="p-4">{ord.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm CTAs */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImportStatus("idle")}
                  className="btn-secondary py-2 px-6 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  className="btn-primary py-2 px-6 text-xs cursor-pointer"
                >
                  Ground Database Records
                </button>
              </div>
            </div>
          )}

          {importStatus === "error" && (
            <div className="space-y-4 py-6 text-center">
              <div className="text-red-500 font-bold text-xs p-4 bg-red-50 border border-red-100 rounded-2xl">
                {errorMessage}
              </div>
              <button
                onClick={() => setImportStatus("idle")}
                className="btn-secondary py-2 px-6 text-xs cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {importStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <LuCheck size={20} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">Data Grounded Successfully!</p>
                <p className="text-xs text-slate-400">PostgreSQL models updated. Dashboard metrics reloading...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

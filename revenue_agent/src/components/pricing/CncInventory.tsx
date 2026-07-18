"use client";

import { useState, useEffect, useRef } from "react";
import { 
  LuBoxes, 
  LuSearch, 
  LuMapPin, 
  LuPlus, 
  LuMinus, 
  LuFolder, 
  LuTag, 
  LuRefreshCw,
  LuShieldAlert,
  LuUpload,
  LuCheck,
  LuFileText,
  LuX
} from "react-icons/lu";
import { getInventory, updateInventoryQty, addInventoryItem } from "@/app/pricing-agent/actions";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  location: string;
  minThreshold: number;
  status: string;
  image: string;
  lastUpdated: string | Date;
}

export default function CncInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // File Upload states
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // RFQ Modal states
  const [rfqText, setRfqText] = useState<string | null>(null);
  const [rfqLoading, setRfqLoading] = useState(false);
  const [rfqSupplier, setRfqSupplier] = useState("Jigani Tooling Labs Ltd");

  // New Item Form State
  const [form, setForm] = useState({
    name: "",
    category: "Tooling",
    sku: "",
    quantity: 10,
    unit: "pcs",
    location: "",
    minThreshold: 5,
    image: "/inventory/carbide-end-mill.png"
  });

  const categories = ["All", "Raw Material", "Tooling", "WIP", "Finished"];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    setLoading(true);
    getInventory().then((data: any) => {
      setItems(data);
      setLoading(false);
    });
  };

  const handleQtyChange = async (id: number, delta: number) => {
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) return;

    const newQty = Math.max(0, currentItem.quantity + delta);

    // Optimistic Update
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          let status = "In Stock";
          if (newQty <= 0) {
            status = "Out of Stock";
          } else if (newQty <= item.minThreshold) {
            status = "Low Stock";
          }
          return { ...item, quantity: newQty, status, lastUpdated: new Date() };
        }
        return item;
      })
    );

    try {
      await updateInventoryQty(id, newQty);
    } catch (err) {
      console.error("Failed to update inventory quantity", err);
      fetchInventory();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.location) {
      alert("Please fill in all fields");
      return;
    }

    setSubmitLoading(true);
    try {
      await addInventoryItem({
        name: form.name,
        category: form.category,
        sku: form.sku,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location,
        minThreshold: Number(form.minThreshold),
        image: form.image
      });
      setShowAddForm(false);
      setForm({
        name: "",
        category: "Tooling",
        sku: "",
        quantity: 10,
        unit: "pcs",
        location: "",
        minThreshold: 5,
        image: "/inventory/carbide-end-mill.png"
      });
      fetchInventory();
    } catch (err) {
      console.error("Failed to add inventory item", err);
      alert("Failed to add inventory item. SKU might already exist.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // PDF Bill & Invoice Uploader Trigger
  const triggerPdfUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus("parsing");
    setUploadMessage(`Gemma parsing ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/supplier/upload-invoice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to parse invoice");
      
      const result = await res.json();
      setUploadStatus("success");
      setUploadMessage(`Successfully parsed invoice and synced ${result.count || 0} items to PostgreSQL!`);
      fetchInventory();
      setTimeout(() => setUploadStatus("idle"), 4000);
    } catch (err: any) {
      setUploadStatus("error");
      setUploadMessage(err.message || "Invoice processing failed.");
    }
  };

  // Excel Bulk Tool Log Uploader
  const triggerExcelUpload = () => {
    if (excelInputRef.current) excelInputRef.current.click();
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus("parsing");
    setUploadMessage(`Gemma parsing bulk log ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pricing/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to import bulk sheet");

      setUploadStatus("success");
      setUploadMessage("Bulk list logs synced directly to database!");
      fetchInventory();
      setTimeout(() => setUploadStatus("idle"), 4000);
    } catch (err: any) {
      setUploadStatus("error");
      setUploadMessage(err.message || "Bulk log import failed.");
    }
  };

  // Tally ERP Sync
  const handleTallySync = async () => {
    setUploadStatus("parsing");
    setUploadMessage("Simulating Tally Prime XML/JSON synchronization...");
    try {
      const res = await fetch("/api/supplier/tally-sync", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Sync failed");
      const result = await res.json();
      setUploadStatus("success");
      setUploadMessage(`Tally Prime synced! Synchronized ${result.count} inventory tooling ledger records.`);
      fetchInventory();
      setTimeout(() => setUploadStatus("idle"), 4000);
    } catch (err: any) {
      setUploadStatus("error");
      setUploadMessage(err.message || "Tally sync failed.");
    }
  };

  // RFQ Generation
  const handleGenerateRfq = async (item: InventoryItem) => {
    setRfqLoading(true);
    setRfqText(null);
    try {
      const res = await fetch("/api/supplier/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          minThreshold: item.minThreshold,
          supplierName: rfqSupplier
        })
      });
      if (!res.ok) throw new Error("Failed to generate RFQ");
      const result = await res.json();
      setRfqText(result.rfqLetter);
    } catch (err) {
      console.error(err);
      setRfqText("Failed to compile RFQ template from Gemini.");
    } finally {
      setRfqLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="app-card border border-border-subtle bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-slate-400">Total Items</p>
            <h4 className="text-2xl font-bold text-slate-800">{items.length}</h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <LuBoxes size={20} />
          </div>
        </div>

        <div className="app-card border border-border-subtle bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-slate-400">Low Stock Alerts</p>
            <h4 className="text-2xl font-bold text-amber-600">
              {items.filter(item => item.status === "Low Stock").length}
            </h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200">
            <LuShieldAlert size={20} />
          </div>
        </div>

        <div className="app-card border border-border-subtle bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-slate-400">Out of Stock</p>
            <h4 className="text-2xl font-bold text-red-600">
              {items.filter(item => item.status === "Out of Stock").length}
            </h4>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-200">
            <LuShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* 2. Hidden File Inputs */}
      <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept=".pdf" className="hidden" />
      <input type="file" ref={excelInputRef} onChange={handleExcelUpload} accept=".csv,.xlsx" className="hidden" />

      {/* 3. Global Upload Status Banner */}
      {uploadStatus !== "idle" && (
        <div className={`p-4 rounded-[20px] border text-xs font-bold flex items-center justify-between ${
          uploadStatus === "parsing" ? "bg-amber-50 text-amber-700 border-amber-200" :
          uploadStatus === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
          "bg-red-50 text-red-700 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {uploadStatus === "parsing" ? <LuRefreshCw className="animate-spin" size={14} /> :
             uploadStatus === "success" ? <LuCheck size={14} /> : <LuShieldAlert size={14} />}
            <span>{uploadMessage}</span>
          </div>
          <button onClick={() => setUploadStatus("idle")} className="p-1 hover:bg-slate-200/50 rounded-full">
            <LuX size={14} />
          </button>
        </div>
      )}

      {/* 4. Active Integration Command Bar */}
      <div className="app-card border border-border-subtle bg-white p-5 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase text-slate-800">ERP & Vendor Synchronization</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ingest supplier quotes, invoices, Tally prime XML exports, or spreadsheets directly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={triggerPdfUpload} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold transition-all cursor-pointer">
            <LuUpload size={12} className="inline mr-1" /> PDF Supplier Bill
          </button>
          <button onClick={triggerExcelUpload} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold transition-all cursor-pointer">
            <LuUpload size={12} className="inline mr-1" /> Excel Tool Log
          </button>
          <button onClick={handleTallySync} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer">
            Sync Tally ERP
          </button>
        </div>
      </div>

      {/* 5. Main Inventory Table Section */}
      <div className="app-card border border-border-subtle bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <LuBoxes size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
                CNC Machine Shop Inventory
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Track tooling, raw materials, finished brackets, and work-in-progress components.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <LuPlus size={15} />
            Register CNC Item
          </button>
        </div>

        {/* Add Inventory Form */}
        {showAddForm && (
          <form onSubmit={handleFormSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-display font-bold text-slate-800 text-sm">Register New CNC Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cobalt Drill Bit (8mm)"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                <select
                  value={form.category}
                  onChange={e => {
                    let img = "/inventory/carbide-end-mill.png";
                    if (e.target.value === "Raw Material") img = "/inventory/aluminum-blocks.png";
                    else if (e.target.value === "Finished") img = "/inventory/aerospace-bracket.png";
                    else if (e.target.value === "WIP") img = "/inventory/battery-housing.png";
                    setForm({ ...form, category: e.target.value, image: img });
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                >
                  <option value="Tooling">Tooling</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="WIP">Work in Progress (WIP)</option>
                  <option value="Finished">Finished Goods</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">SKU / Code</label>
                <input
                  type="text"
                  placeholder="e.g. TL-DB-COB-8"
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: Math.max(0, Number(e.target.value)) })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Unit</label>
                <input
                  type="text"
                  placeholder="pcs, kg, meters"
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Alert Limit Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={form.minThreshold}
                  onChange={e => setForm({ ...form, minThreshold: Math.max(0, Number(e.target.value)) })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1 sm:col-span-2 md:col-span-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Shop Location Rack/Shelf</label>
                <input
                  type="text"
                  placeholder="e.g. Cabinet C, Shelf 1"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="btn-primary py-2 px-5 text-xs flex items-center gap-2 cursor-pointer"
              >
                {submitLoading && <LuRefreshCw className="animate-spin" size={12} />}
                Add to Inventory
              </button>
            </div>
          </form>
        )}

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-md w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <LuSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by SKU or item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 border border-border-subtle rounded-xl focus:outline-none focus:border-primary bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-12 space-y-4">
            <LuRefreshCw className="animate-spin mx-auto text-primary" size={24} />
            <p className="text-xs font-bold text-slate-500">Loading shop inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
            <LuBoxes className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-500">No inventory items matched your criteria.</p>
          </div>
        ) : (
          /* Inventory Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 hover:border-slate-300 transition-colors shadow-sm relative">
                
                {/* Product Image */}
                <div className="h-24 w-24 rounded-xl border border-slate-200/60 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <LuFolder size={10} /> {item.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        item.status === "In Stock"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : item.status === "Low Stock"
                          ? "text-amber-700 bg-amber-50 border-amber-200 animate-pulse"
                          : "text-red-700 bg-red-50 border-red-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-slate-800 text-sm truncate" title={item.name}>
                      {item.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-semibold mt-0.5">
                      <span className="flex items-center gap-1">
                        <LuTag size={11} /> {item.sku}
                      </span>
                      <span className="flex items-center gap-1">
                        <LuMapPin size={11} /> {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Adjuster & RFQ triggers */}
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQtyChange(item.id, -1)}
                        className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-sm"
                      >
                        <LuMinus size={12} />
                      </button>
                      
                      <div className="px-3 text-center min-w-[50px]">
                        <span className="text-xs font-extrabold text-slate-800">
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold">
                          {item.unit}
                        </span>
                      </div>

                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-sm"
                      >
                        <LuPlus size={12} />
                      </button>
                    </div>

                    {item.status !== "In Stock" ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateRfq(item)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
                      >
                        Generate RFQ
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-semibold italic">
                        Threshold Limit: {item.minThreshold} {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. RFQ Letter Output Modal */}
      {rfqText && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-border-subtle w-full max-w-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <LuFileText size={18} className="text-primary" />
                  <h3 className="font-black text-sm text-text-foreground font-display">Gemma Compiled Request For Quote (RFQ)</h3>
                </div>
                <button 
                  onClick={() => setRfqText(null)}
                  className="p-1 hover:bg-background-custom rounded-lg text-text-muted hover:text-text-foreground transition-colors cursor-pointer"
                >
                  <LuX size={18} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin">
                <textarea
                  value={rfqText}
                  onChange={(e) => setRfqText(e.target.value)}
                  className="w-full h-80 text-xs text-text-foreground leading-relaxed font-mono bg-background-custom p-4 rounded-[20px] border border-border-subtle focus:outline-none focus:border-primary resize-y"
                />
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4 mt-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold">You can edit the letter text directly in the box above before copy.</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(rfqText);
                    alert("RFQ Letter copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  Copy Text
                </button>
                <button 
                  onClick={() => setRfqText(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Close RFQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFQ Loading Overlay */}
      {rfqLoading && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl flex items-center gap-3 shadow-xl">
            <LuRefreshCw className="animate-spin text-primary" size={20} />
            <span className="text-xs font-bold text-slate-700">Gemma compiling RFQ template...</span>
          </div>
        </div>
      )}
    </div>
  );
}

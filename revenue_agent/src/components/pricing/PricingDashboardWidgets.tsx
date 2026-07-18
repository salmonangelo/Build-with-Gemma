"use client";

import { useState, useEffect } from "react";
import { 
  LuTrendingUp, 
  LuTrendingDown, 
  LuBoxes, 
  LuShieldAlert, 
  LuPlus, 
  LuShieldCheck, 
  LuInfo,
  LuPercent,
  LuSparkles
} from "react-icons/lu";
import { getMaterials, getOrders, getInventory, updateInventoryQty } from "@/app/pricing-agent/actions";

export default function PricingDashboardWidgets() {
  return (
    <div className="space-y-6">
      <MaterialCostWatchlist />
      <CncInventoryAlerts />
      <MarginSimulator />
    </div>
  );
}

function MaterialCostWatchlist() {
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    getMaterials().then(setMaterials);
  }, []);

  return (
    <div className="app-card border border-border-subtle bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <LuShieldCheck size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              Material Cost Watchlist
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Compare locked-in supplier costs vs. live market index rates.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
              <th className="py-3 px-1">Material</th>
              <th className="py-3 px-1">Supplier</th>
              <th className="py-3 px-1 text-right">Contract Rate</th>
              <th className="py-3 px-1 text-right">Market Index</th>
              <th className="py-3 px-1 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {materials.map((mat) => {
              const diffPct = ((mat.currentCost - mat.marketCost) / mat.marketCost) * 100;
              const isOverpaying = mat.currentCost > mat.marketCost;

              return (
                <tr key={mat.id} className="text-xs font-semibold text-slate-700 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-1 font-bold text-slate-800">{mat.name}</td>
                  <td className="py-3.5 px-1 text-slate-500">{mat.supplier}</td>
                  <td className="py-3.5 px-1 text-right font-mono font-bold text-slate-800">
                    ₹{mat.currentCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-1 text-right font-mono text-slate-500">
                    ₹{mat.marketCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-1 text-center">
                    {isOverpaying ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        <LuTrendingUp size={10} /> Overpaying (+{diffPct.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <LuTrendingDown size={10} /> Optimized ({diffPct.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CncInventoryAlerts() {
  const [lowItems, setLowItems] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    getInventory().then((data: any[]) => {
      // Find items requiring attention (low stock or out of stock)
      setLowItems(data.filter(item => item.status === "Low Stock" || item.status === "Out of Stock"));
    });
  };

  const handleRestock = async (id: number, currentQty: number) => {
    const newQty = currentQty + 20; // quick restock of 20 units
    setLowItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty, status: "In Stock" } : item));
    await updateInventoryQty(id, newQty);
    fetchAlerts();
  };

  return (
    <div className="app-card border border-border-subtle bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <LuBoxes size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              Inventory Restock Alerts
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Tooling & material items falling below minimum limits.
            </p>
          </div>
        </div>
      </div>

      {lowItems.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 font-semibold italic">
          All shop inventory levels optimized.
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
          {lowItems.map((item) => (
            <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg border border-slate-200/60 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-slate-800 text-xs truncate">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    SKU: {item.sku} • Location: {item.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase block ${
                    item.status === "Out of Stock" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {item.quantity} {item.unit} left
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">Limit: {item.minThreshold}</span>
                </div>
                <button
                  onClick={() => handleRestock(item.id, item.quantity)}
                  className="h-7 w-7 rounded-lg bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95"
                  title="Quick restock +20 units"
                >
                  <LuPlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarginSimulator() {
  const [orders, setOrders] = useState<any[]>([]);
  const [costIncrease, setCostIncrease] = useState(0);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  return (
    <div className="app-card border border-border-subtle bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <LuPercent size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              Order Margin Simulator
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Simulate raw material cost rises and trace impacts on active margins.
            </p>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500">
          <span>Simulated Material Cost Rise</span>
          <span className="text-primary">+{costIncrease}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={costIncrease}
          onChange={(e) => setCostIncrease(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((ord) => {
          // Parse original margin float
          const originalMarginVal = parseFloat(ord.margin);
          // Simple model: material represents 50% of the cost. So margin impact is costIncrease * 0.5
          const simulatedMarginVal = Math.max(0, originalMarginVal - (costIncrease * 0.4));
          const isCritical = simulatedMarginVal < 10;

          return (
            <div key={ord.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-xs">
                  {ord.client} ({ord.id})
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">
                  Material: {ord.material.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 line-through font-bold block leading-none">
                  {ord.margin}
                </span>
                <span className={`text-xs font-black block mt-1 ${
                  isCritical ? "text-red-600 animate-pulse" : "text-emerald-600"
                }`}>
                  {simulatedMarginVal.toFixed(1)}% margin
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gemma warning */}
      {costIncrease > 10 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-[11px] text-red-700 leading-normal font-semibold animate-in fade-in duration-300">
          <LuShieldAlert size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>Gemma Warning:</strong> Material rise of {costIncrease}% places client margins below sustainable thresholds. Active pricing recommendation surcharge execution is recommended.
          </span>
        </div>
      )}
    </div>
  );
}

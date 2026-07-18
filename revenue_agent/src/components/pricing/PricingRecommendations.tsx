"use client";

import { useState, useEffect } from "react";
import { LuSparkles, LuCheck, LuX, LuMessageSquare, LuChevronDown, LuChevronUp, LuInfo } from "react-icons/lu";

export default function PricingRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricingRecommendations) {
          setRecommendations(data.pricingRecommendations.map((rec: any) => ({ ...rec, expanded: false })));
        }
      })
      .catch((err) => console.error("Failed to load recommendations:", err));
  }, []);

  const toggleExpand = (id: string) => {
    setRecommendations(
      recommendations.map((rec: any) =>
        rec.id === id ? { ...rec, expanded: !rec.expanded } : rec
      )
    );
  };

  const handleAction = async (id: string, type: "accept" | "reject") => {
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: type }),
      });
      if (res.ok) {
        setRecommendations(
          recommendations.map((rec: any) =>
            rec.id === id
              ? {
                  ...rec,
                  accepted: type === "accept",
                  rejected: type === "reject",
                }
              : rec
          )
        );
      }
    } catch (err) {
      console.error("Failed to update recommendation status:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
          <LuSparkles size={16} className="text-primary animate-pulse" />
          Active Pricing Recommendations
        </h3>
        <span className="text-[10px] font-black uppercase text-slate-400">
          Ranked by Urgency
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          if (rec.rejected) return null;
          return (
            <div
              key={rec.id}
              className={`p-6 rounded-card border transition-all duration-300 relative ${
                rec.accepted
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Confident indicator Badge */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-primary tracking-wider">
                    Trigger: {rec.trigger}
                  </span>
                  <h4 className="font-display font-bold text-slate-800 text-sm sm:text-base">
                    {rec.action}
                  </h4>
                </div>
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                  rec.confidence === "high"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {rec.confidence} Confidence
                </span>
              </div>

              {/* Expandable Reasoning Trail */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span>Reasoning Trail</span>
                  {rec.expanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                </button>

                {rec.expanded && (
                  <ul className="space-y-2 list-disc list-inside text-xs text-slate-600 font-medium pl-2 leading-relaxed animate-in fade-in duration-300">
                    {rec.reasoning.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action buttons */}
              {!rec.accepted ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100/50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(rec.id, "accept")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white px-5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
                    >
                      <LuCheck size={14} />
                      Accept Price
                    </button>
                    <button
                      onClick={() => handleAction(rec.id, "reject")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2 text-xs font-bold transition-all"
                    >
                      <LuX size={14} />
                      Ignore
                    </button>
                  </div>

                  <button
                    onClick={() => alert("Simulation Mode: Chat with Gemma pre-loaded context")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    <LuMessageSquare size={14} />
                    <span>Ask Gemma</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-3 flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <LuCheck size={14} />
                  <span>Price adjustment accepted. Inventory price lines updated in database.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

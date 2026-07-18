"use client";

import { useState, useEffect } from "react";
import { LuTruck, LuSparkles, LuCheck, LuShieldAlert } from "react-icons/lu";
import { getShipments, updateShipmentStepStatus } from "@/app/pricing-agent/actions";

export default function SupplyChainTracker() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedStep, setSelectedStep] = useState<{ shipmentId: number; sequence: number } | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = () => {
    getShipments().then((data) => {
      setShipments(data);
    });
  };

  const handleStepClick = (shipmentId: number, sequence: number) => {
    if (selectedStep?.shipmentId === shipmentId && selectedStep?.sequence === sequence) {
      setSelectedStep(null);
    } else {
      setSelectedStep({ shipmentId, sequence });
    }
  };

  const handleStatusUpdate = async (status: "on-time" | "delayed") => {
    if (!selectedStep) return;
    setUpdateLoading(true);
    try {
      await updateShipmentStepStatus(selectedStep.shipmentId, selectedStep.sequence, status);
      setSelectedStep(null);
      fetchShipments();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div id="supply-chain" className="app-card border border-border-subtle bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LuTruck size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              Supply Chain Node Tracker
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Select nodes to adjust shipment tracking status manually.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400">{shipments.length} Active Shipments</span>
      </div>

      <div className="space-y-8">
        {shipments.map((ship: any, idx: number) => (
          <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-5">
            {/* Shipment Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-800">{ship.material}</h4>
                <p className="text-[10px] font-semibold text-slate-400">
                  Qty: {ship.qty} • Supplier: {ship.supplier}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                  ETA: {ship.eta}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  ship.status === "delayed" 
                    ? "bg-red-50 text-red-600 border-red-200" 
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}>
                  {ship.status}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pt-2 pb-4">
              {/* Connecting line */}
              <div className="absolute top-[28px] left-4 right-4 h-0.5 bg-slate-200 -z-0" />
              
              <div className="grid grid-cols-5 text-center relative z-10">
                {ship.steps.map((step: any, sIdx: number) => {
                  let stepColor = "bg-slate-200 text-slate-400 border-slate-200 hover:border-slate-300";
                  if (step.status === "completed") {
                    stepColor = "bg-primary text-white border-primary hover:bg-primary-dark";
                  } else if (step.status === "delayed") {
                    stepColor = "bg-red-500 text-white border-red-500 animate-pulse";
                  } else if (step.status === "on-time") {
                    stepColor = "bg-emerald-500 text-white border-emerald-500";
                  }

                  const isSelected = selectedStep?.shipmentId === ship.id && selectedStep?.sequence === step.sequence;
                  
                  return (
                    <div key={sIdx} className="flex flex-col items-center space-y-2 relative">
                      <button
                        onClick={() => handleStepClick(ship.id, step.sequence)}
                        className={`h-8 w-8 rounded-full border flex items-center justify-center font-display font-bold text-xs shadow-sm transition-all cursor-pointer ${stepColor} ${
                          isSelected ? "ring-4 ring-primary/20 scale-110" : ""
                        }`}
                      >
                        {step.status === "completed" ? <LuCheck size={14} /> : sIdx + 1}
                      </button>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter hidden sm:block">
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Change Toggles */}
            {selectedStep && shipments.some(s => s.id === selectedStep.shipmentId && ship.id === selectedStep.shipmentId) && (
              <div className="p-4 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <LuShieldAlert size={14} className="text-primary" />
                  Update active step to:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate("on-time")}
                    disabled={updateLoading}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    On-Time
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("delayed")}
                    disabled={updateLoading}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-full text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    Delayed
                  </button>
                  <button
                    onClick={() => setSelectedStep(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Gemma Advisory annotation banner */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <LuSparkles size={12} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-primary tracking-wider">Gemma Node Advisory</p>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  "{ship.gemmaAnnotation}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Building2, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  Edit2, 
  QrCode, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp, 
  OctagonX, 
  RotateCcw,
  PackageCheck,
  MessageSquare,
  FileText,
  FileCheck2,
  Users
} from 'lucide-react';

interface CustomerItem {
  id: number;
  name: string;
  company: string;
  contactChannel: string;
  whatsappJid: string;
  interestedProduct: string;
  status: string;
}

interface SalesMission {
  id: string;
  customerId?: number;
  customerName: string;
  contactChannel: string;
  whatsappJid: string;
  productName: string;
  quantity: number;
  deliveryDate?: string;
  location?: string;
  specialRequirements?: string;
  estimatedValue: number;
  estimatedCost: number;
  estimatedMargin: number;
  marginConfidence?: string;
  businessReason?: string;
  currentStage: string;
  status: string;
  milestones?: Array<{ timestamp: string; stage: string; text: string; actor: string }>;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  missionId: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  deliveryDate: string;
  location: string;
  status: string;
  createdAt: string;
}

interface ConversationMsg {
  id: string;
  workflowId: string;
  sender: string;
  senderPhone: string;
  direction: 'INCOMING' | 'OUTGOING';
  content: string;
  timestamp: string;
}

export default function SalesAgentPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [activeMission, setActiveMission] = useState<SalesMission | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [messages, setMessages] = useState<ConversationMsg[]>([]);

  // Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerCompany, setNewCustomerCompany] = useState('');
  const [newCustomerProduct, setNewCustomerProduct] = useState('CNC Mounting Bracket');
  const [newCustomerJid, setNewCustomerJid] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editingJidId, setEditingJidId] = useState<number | null>(null);
  const [editingJidValue, setEditingJidValue] = useState('');

  // Action Loading States
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [missionStatusText, setMissionStatusText] = useState('🟢 System Ready for Customer Inquiries');

  // Trigger form state
  const [triggerQty, setTriggerQty] = useState(500);

  // WhatsApp QR Modal State
  const [waConnected, setWaConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Poll WhatsApp Status
  const pollWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaConnected(Boolean(data.connected));
      if (data.qrCode) {
        setQrCodeUrl(data.qrCode);
      }
    } catch (e) {
      console.warn('[Fetch WA Status error]:', e);
    }
  };

  // Poll Customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.warn('[Fetch customers error]:', e);
    }
  };

  // Poll Active Sales Missions
  const fetchSalesMissions = async () => {
    try {
      const res = await fetch('/api/sales/missions');
      const data = await res.json();
      if (data.success && data.missions.length > 0) {
        const current = data.missions[0];

        if (current.status === 'Cancelled' || current.status === 'Completed') {
          setActiveMission(null);
          setMissionStatusText('🟢 No Active Mission — Ready for Next Customer Inquiry');
          return;
        }

        setActiveMission(current);

        // Update status text based on stage
        if (current.currentStage === 'Inquiry_Received' || current.currentStage === 'Gathering_Details') {
          setMissionStatusText(`🟡 Gathering Order Details for ${current.customerName}`);
        } else if (current.currentStage === 'Margin_Estimated') {
          setMissionStatusText(`🟢 Margin Estimated (₹${current.estimatedMargin?.toLocaleString('en-IN')}) — Awaiting Owner Approval`);
        } else if (current.currentStage === 'Quotation_Approved' || current.currentStage === 'Quotation_Sent') {
          setMissionStatusText(`🟢 Official Quotation Sent via WhatsApp — Awaiting Customer Acceptance`);
        } else if (current.currentStage === 'Order_Confirmed' || current.status === 'Completed') {
          setMissionStatusText('✅ Sales Order Confirmed & Logged in MissionOS');
        }
      }
    } catch (e) {
      console.warn('[Fetch sales missions error]:', e);
    }
  };

  // Poll Sales Orders
  const fetchSalesOrders = async () => {
    try {
      const res = await fetch('/api/sales/orders');
      const data = await res.json();
      if (data.success) {
        setSalesOrders(data.orders);
      }
    } catch (e) {
      console.warn('[Fetch sales orders error]:', e);
    }
  };

  // Poll Conversation Stream
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/procurement/conversations');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.warn('[Fetch conversations error]:', e);
    }
  };

  useEffect(() => {
    pollWhatsAppStatus();
    fetchCustomers();
    fetchSalesMissions();
    fetchSalesOrders();
    fetchConversations();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      pollWhatsAppStatus();
      fetchCustomers();
      fetchSalesMissions();
      fetchSalesOrders();
      fetchConversations();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Connect WhatsApp Button Click
  const handleConnectWhatsApp = async () => {
    setConnecting(true);
    setShowQrModal(true);
    try {
      await fetch('/api/whatsapp/status', { method: 'POST' });
    } catch (e) {
      console.error('[Connect WA error]:', e);
    } finally {
      setConnecting(false);
    }
  };

  // Save Customer
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;
    setSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName,
          phone: newCustomerPhone,
          company: newCustomerCompany,
          interestedProduct: newCustomerProduct,
          whatsappJid: newCustomerJid
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerCompany('');
        setNewCustomerJid('');
        fetchCustomers();
      }
    } catch (e) {
      console.error('[Save customer error]:', e);
    } finally {
      setSavingCustomer(false);
    }
  };

  // Inline Update JID
  const handleUpdateJid = async (id: number) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, whatsappJid: editingJidValue })
      });
      const data = await res.json();
      if (data.success) {
        setEditingJidId(null);
        fetchCustomers();
      }
    } catch (e) {
      console.error('[Update JID error]:', e);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: number) => {
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      }
    } catch (e) {
      console.error('[Delete customer error]:', e);
    }
  };

  // Trigger Inbound Customer Inquiry Simulation
  const handleTriggerInquiry = async () => {
    setIsTriggering(true);
    try {
      const targetCustomer = customers[0] || {
        name: 'Apex Engineering (Ramesh)',
        contactChannel: '+919880011223',
        whatsappJid: '202516935528474'
      };

      const res = await fetch('/api/sales/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: targetCustomer.name,
          contactChannel: targetCustomer.contactChannel,
          whatsappJid: targetCustomer.whatsappJid,
          productName: 'CNC Mounting Bracket',
          quantity: triggerQty
        })
      });
      const data = await res.json();
      if (data.success) {
        setMissionStatusText(`🟢 Margin Estimated (₹${data.mission.estimatedMargin?.toLocaleString('en-IN')}) — Awaiting Owner Approval`);
        await fetchCustomers();
        await fetchSalesMissions();
        await fetchConversations();
      }
    } catch (e) {
      console.error('[Trigger inquiry error]:', e);
    } finally {
      setIsTriggering(false);
    }
  };

  // Approve Quotation Draft & Dispatch via WhatsApp
  const handleApproveQuotation = async () => {
    if (!activeMission || isApproving) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/sales/missions/${activeMission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_quotation' })
      });
      const data = await res.json();
      if (data.success) {
        setMissionStatusText(`🟢 Official Quotation Sent via WhatsApp to ${activeMission.customerName}`);
        await fetchSalesMissions();
        await fetchConversations();
      }
    } catch (e) {
      console.error('[Approve quotation error]:', e);
    } finally {
      setIsApproving(false);
    }
  };

  // Cancel Sales Mission
  const handleCancelMission = async () => {
    if (!activeMission || isCancelling) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/sales/missions/${activeMission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      const data = await res.json();
      if (data.success) {
        setActiveMission(null);
        setMissionStatusText('🟢 No Active Mission — Ready for Next Customer Inquiry');
        await fetchCustomers();
        await fetchSalesMissions();
      }
    } catch (e) {
      console.error('[Cancel mission error]:', e);
    } finally {
      setIsCancelling(false);
    }
  };

  // Reset Mission View
  const handleResetMission = () => {
    setActiveMission(null);
    setMissionStatusText('🟢 No Active Mission — Ready for Next Customer Inquiry');
  };

  return (
    <DashboardLayout activeRoute="/sales-agent">
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-[var(--text-primary)]">
        
        {/* =================================================================== */}
        {/* 1. TOP HEADER & WHATSAPP CONNECTION BAR                            */}
        {/* =================================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-bold font-mono uppercase tracking-wider">
                  Department: Sales & Customer Acquisition
                </span>
                {waConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> WhatsApp Online
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Clock size={12} /> WhatsApp Connecting...
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display text-[var(--text-primary)] mt-2">
                AI Sales Executive (Customer Acquisition & Order Capture)
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Autonomous WhatsApp Inquiry Response ➔ Customer JID Matching ➔ Margin Estimation ➔ Quotation Approval ➔ Order Capture
              </p>
            </div>

            <button
              onClick={handleConnectWhatsApp}
              disabled={connecting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <QrCode size={16} />
              <span>{waConnected ? 'View WhatsApp Connection' : 'Scan WhatsApp QR'}</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. CUSTOMER MASTER TABLE & REGISTRATION FORM                        */}
        {/* =================================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <Users size={20} className="text-purple-500" />
                Customer Master Database
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Registered customers matched by WhatsApp JID / Phone for sales inquiries
              </p>
            </div>
          </div>

          {/* Add Customer Form */}
          <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6 p-4 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border-subtle)]">
            <input
              type="text"
              placeholder="Customer Name (e.g. Ramesh)"
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Phone (e.g. +919880011223)"
              value={newCustomerPhone}
              onChange={e => setNewCustomerPhone(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Company (e.g. Apex Engg)"
              value={newCustomerCompany}
              onChange={e => setNewCustomerCompany(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="WhatsApp JID (e.g. 202516935528474)"
              value={newCustomerJid}
              onChange={e => setNewCustomerJid(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={savingCustomer}
              className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingCustomer ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Add Customer</span>
            </button>
          </form>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">WhatsApp JID (Editable)</th>
                  <th className="py-2.5 px-3">Interested Product</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-muted)]">#{c.id}</td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{c.name}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{c.company || '—'}</td>
                    <td className="py-3 px-3 font-mono text-[var(--primary)]">{c.contactChannel}</td>
                    <td className="py-3 px-3 font-mono">
                      {editingJidId === c.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingJidValue}
                            onChange={e => setEditingJidValue(e.target.value)}
                            className="px-2 py-1 bg-[var(--bg-subtle)] border border-purple-500 rounded-lg text-xs font-mono w-40"
                          />
                          <button onClick={() => handleUpdateJid(c.id)} className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20">
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setEditingJidId(c.id); setEditingJidValue(c.whatsappJid); }}>
                          <span className="text-emerald-400 font-bold">{c.whatsappJid || 'Click to add JID'}</span>
                          <Edit2 size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-primary)] font-medium">{c.interestedProduct}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => handleDeleteCustomer(c.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Customer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. INBOUND INQUIRY SIMULATOR                                        */}
        {/* =================================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold font-display flex items-center gap-2">
                <Send size={18} className="text-purple-500" />
                Simulate Customer WhatsApp Sales Inquiry
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Simulates inbound message: "Need {triggerQty} CNC Mounting Brackets" from registered customer
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)] font-bold">Qty:</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={triggerQty}
                  onChange={e => setTriggerQty(parseInt(e.target.value, 10) || 500)}
                  className="w-24 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold text-[var(--primary)] font-mono"
                />
              </div>
              <button
                onClick={handleTriggerInquiry}
                disabled={isTriggering}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTriggering ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Simulate Sales Inquiry ({triggerQty} pcs)</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. CURRENT SALES MISSION STATUS BANNER                              */}
        {/* =================================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold font-mono">
                  {activeMission?.id || 'No Mission Active'}
                </span>
                <span className="text-xs font-bold text-[var(--text-muted)]">Current Sales Mission Status:</span>
              </div>
              <h3 className="text-base font-black font-display text-[var(--text-primary)] mt-1">
                {missionStatusText}
              </h3>
            </div>
            {activeMission && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-[var(--text-muted)]">Target Customer: </span>
                  <strong className="text-xs text-[var(--primary)] font-bold">{activeMission.customerName} ({activeMission.quantity} pcs)</strong>
                </div>
                {activeMission.status !== 'Completed' && activeMission.status !== 'Cancelled' ? (
                  <button
                    onClick={handleCancelMission}
                    disabled={isCancelling}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title="Stop / Cancel Ongoing Sales Mission"
                  >
                    {isCancelling ? <RefreshCw size={14} className="animate-spin text-red-400" /> : <OctagonX size={14} />}
                    <span>{isCancelling ? 'Stopping...' : 'Stop Mission'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetMission}
                    className="px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Mission completed or cancelled. Click to reset."
                  >
                    <RotateCcw size={14} />
                    <span>Reset Mission</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 5. MARGIN ESTIMATION & QUOTATION APPROVAL CARD                      */}
        {/* =================================================================== */}
        {activeMission && activeMission.estimatedValue > 0 && (
          <div className="bg-[var(--bg-card)] border border-purple-500/30 rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">
                    Margin Confidence: {activeMission.marginConfidence || 'High (96%)'}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Stage: <strong className="text-[var(--text-primary)]">{activeMission.currentStage}</strong></span>
                </div>
                <h3 className="text-xl font-black font-display text-[var(--text-primary)]">
                  Quotation Draft & Margin Analysis: {activeMission.productName}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-2xl">
                  {activeMission.businessReason || 'Calculated based on standard MSME precision CNC machining margin benchmark.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3">
                  <div className="p-3 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Order Quantity</span>
                    <p className="text-base font-bold font-mono text-[var(--text-primary)] mt-0.5">{activeMission.quantity} pcs</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Unit Price / Value</span>
                    <p className="text-base font-bold font-mono text-purple-400 mt-0.5">₹450 / ₹{activeMission.estimatedValue?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Est. Mfg Cost</span>
                    <p className="text-base font-bold font-mono text-[var(--text-muted)] mt-0.5">₹{activeMission.estimatedCost?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Est. Gross Margin</span>
                    <p className="text-base font-black font-mono text-emerald-400 mt-0.5">₹{activeMission.estimatedMargin?.toLocaleString('en-IN')} (37.8%)</p>
                  </div>
                </div>
              </div>

              {activeMission.currentStage !== 'Quotation_Sent' && activeMission.currentStage !== 'Order_Confirmed' ? (
                <button
                  onClick={handleApproveQuotation}
                  disabled={isApproving}
                  className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {isApproving ? <RefreshCw size={18} className="animate-spin" /> : <FileCheck2 size={18} />}
                  <span>Approve & Send Quotation via WhatsApp</span>
                </button>
              ) : (
                <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Quotation Dispatched over WhatsApp</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. CONVERSATION STREAM & CONFIRMED SALES ORDERS                      */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sales WhatsApp Conversation Stream */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold font-display flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-500" />
                Sales WhatsApp Conversation Stream
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-1 rounded-md">Live Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <MessageSquare size={32} className="opacity-30 mb-2" />
                  <p className="text-xs">No active WhatsApp messages in stream.</p>
                  <p className="text-[10px] mt-1">Simulate an inquiry or reply on WhatsApp to see messages live.</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.direction === 'OUTGOING' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">{m.sender}</span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">{m.timestamp}</span>
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${
                      m.direction === 'OUTGOING' 
                        ? 'bg-purple-600 text-white rounded-tr-none' 
                        : 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Confirmed Sales Orders Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold font-display flex items-center gap-2">
                <PackageCheck size={18} className="text-emerald-500" />
                Confirmed Sales Orders
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
                {salesOrders.length} Orders Logged
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {salesOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <FileText size={32} className="opacity-30 mb-2" />
                  <p className="text-xs">No confirmed sales orders logged yet.</p>
                  <p className="text-[10px] mt-1">When customers accept quotations, orders will be persisted here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                      <th className="py-2 px-2">Order #</th>
                      <th className="py-2 px-2">Customer</th>
                      <th className="py-2 px-2">Product</th>
                      <th className="py-2 px-2">Qty</th>
                      <th className="py-2 px-2">Total Value</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {salesOrders.map(o => (
                      <tr key={o.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="py-3 px-2 font-mono font-bold text-purple-400">{o.orderNumber}</td>
                        <td className="py-3 px-2 font-bold text-[var(--text-primary)]">{o.customerName}</td>
                        <td className="py-3 px-2 text-[var(--text-muted)]">{o.productName}</td>
                        <td className="py-3 px-2 font-mono">{o.quantity} pcs</td>
                        <td className="py-3 px-2 font-mono font-bold text-emerald-400">₹{o.totalValue.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 7. SALES MISSION TIMELINE FEED                                     */}
        {/* =================================================================== */}
        {activeMission && activeMission.milestones && activeMission.milestones.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold font-display flex items-center gap-2 mb-4">
              <Clock size={18} className="text-purple-500" />
              Sales Mission Audit Timeline
            </h3>

            <div className="space-y-4 relative pl-6 border-l-2 border-[var(--border-subtle)] ml-2">
              {activeMission.milestones.map((m, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-4 border-[var(--bg-card)] shadow-xs" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{m.timestamp}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[10px] font-bold font-mono">
                      {m.stage}
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">Actor: {m.actor}</span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] font-medium mt-1">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

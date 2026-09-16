'use client';

import React, { useState, useEffect } from 'react';
import {
  estimateProcurement,
  createProcurementOrder,
  getProcurementOrders,
  updateProcurementOrderStatus,
} from '@/lib/api';
import { ProcurementOrder, ProcurementEstimate, ProcurementOrderInput } from '@/types';
import { PageHero } from '@/components/maritime/PageHero';
import {
  Truck,
  Ship,
  Train,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Building2,
  RefreshCw,
  Sparkles,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

const COMMODITIES = ['Coal', 'Iron Ore', 'Grain', 'Bauxite'];

const COAL_GRADES = [
  'Thermal Coal',
  'Coking Coal',
  'PCI Coal',
  'Anthracite',
];


const PRESETS = [
  {
    label: '50 Tons Coal (Local Spot Top-up via Truck)',
    commodity: 'Coal',
    grade: 'Thermal Coal',
    quantityTons: 50,
    origin: 'Local Regional Depot (Visakhapatnam)',
    destination: 'Visakhapatnam Steel Complex',
    requiredDeliveryDate: '2026-09-20',
    budgetUsd: 10000,
    currentInventoryTons: 20,
    safetyStockTons: 30,
    forecastDemandTons: 40,
    supplierName: 'East Coast Coal Terminal Stockyard',
    notes: 'Urgent spot parcel top-up to maintain emergency boiler buffer.',
  },

  
  {
    label: '2,800 Tons Coal (Dedicated Rail Rake)',
    commodity: 'Coal',
    grade: 'Thermal Coal',
    quantityTons: 2800,
    origin: 'Paradip Mechanized Stockpile',
    destination: 'Rourkela Steel Secondary Hopper',
    requiredDeliveryDate: '2026-09-28',
    budgetUsd: 650000,
    currentInventoryTons: 1200,
    safetyStockTons: 2000,
    forecastDemandTons: 2000,
    supplierName: 'Tata International Raw Materials',
    notes: '58-wagon BOXN rake booking for inter-state rail transit.',
  },
  {
    label: '75,000 Tons Coking Coal (Ocean Panamax Bulker)',
    commodity: 'Coal',
    grade: 'Coking Coal',
    quantityTons: 75000,
    origin: 'Hay Point, Australia',
    destination: 'Visakhapatnam Port',
    requiredDeliveryDate: '2026-10-15',
    budgetUsd: 19500000,
    currentInventoryTons: 45000,
    safetyStockTons: 60000,
    forecastDemandTons: 60000,
    supplierName: 'BHP Mitsubishi Alliance (BMA)',
    notes: 'Deepwater Panamax vessel fixture coordinated with berth window.',
  },
];

export default function ProcurementPage() {
  // Form State
  const [commodity, setCommodity] = useState('Coal');
  const [grade, setGrade] = useState('Thermal Coal');
  const [quantityTons, setQuantityTons] = useState(50);
  const [origin, setOrigin] = useState('Local Regional Depot (Visakhapatnam)');
  const [destination, setDestination] = useState('Visakhapatnam Steel Complex');
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState('2026-09-25');
  const [budgetUsd, setBudgetUsd] = useState(10000);
  const [currentInventoryTons, setCurrentInventoryTons] = useState(20);
  const [safetyStockTons, setSafetyStockTons] = useState(30);
  const [forecastDemandTons, setForecastDemandTons] = useState(40);
  const [supplierName, setSupplierName] = useState('East Coast Regional Coal Depot');
  const [notes, setNotes] = useState('Direct dispatch for plant feed buffer.');

  // Live Estimate & Order Ledger
  const [estimate, setEstimate] = useState<ProcurementEstimate | null>(null);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<ProcurementOrder | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ProcurementOrder | null>(null);

  // Calculated Procurement Quantity Formula: Forecast Demand + Safety Stock - Current Inventory
  const calculatedBufferQuantity = Math.max(
    0,
    Number(forecastDemandTons || 0) + Number(safetyStockTons || 0) - Number(currentInventoryTons || 0)
  );

  // Fetch initial orders ledger
  useEffect(() => {
    getProcurementOrders().then((data) => setOrders(data));
  }, []);

  // Recalculate dynamic logistics estimate when inputs change
  useEffect(() => {
    let active = true;
    setIsEstimating(true);

    const timer = setTimeout(() => {
      estimateProcurement({
        commodity,
        quantityTons: Number(quantityTons) || 50,
        grade,
        origin,
        destination,
        requiredDeliveryDate,
        budgetUsd: Number(budgetUsd) || 0,
        currentInventoryTons: Number(currentInventoryTons) || 0,
        safetyStockTons: Number(safetyStockTons) || 0,
        forecastDemandTons: Number(forecastDemandTons) || 0,
        supplierName,
        notes,
      })
        .then((res) => {
          if (active) {
            setEstimate(res);
            setIsEstimating(false);
          }
        })
        .catch(() => {
          if (active) setIsEstimating(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    commodity,
    grade,
    quantityTons,
    origin,
    destination,
    requiredDeliveryDate,
    budgetUsd,
    currentInventoryTons,
    safetyStockTons,
    forecastDemandTons,
  ]);

  // Apply Quick Preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCommodity(preset.commodity);
    setGrade(preset.grade);
    setQuantityTons(preset.quantityTons);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setRequiredDeliveryDate(preset.requiredDeliveryDate);
    setBudgetUsd(preset.budgetUsd);
    setCurrentInventoryTons(preset.currentInventoryTons);
    setSafetyStockTons(preset.safetyStockTons);
    setForecastDemandTons(preset.forecastDemandTons);
    setSupplierName(preset.supplierName);
    setNotes(preset.notes);
  };

  // Submit simulated procurement order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const input: ProcurementOrderInput = {
      commodity,
      quantityTons: Number(quantityTons) || 50,
      grade,
      origin,
      destination,
      requiredDeliveryDate,
      budgetUsd: Number(budgetUsd) || 0,
      currentInventoryTons: Number(currentInventoryTons) || 0,
      safetyStockTons: Number(safetyStockTons) || 0,
      forecastDemandTons: Number(forecastDemandTons) || 0,
      supplierName,
      notes,
    };

    try {
      const order = await createProcurementOrder(input);
      setCreatedOrder(order);
      setOrders((prev) => [order, ...prev]);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Procurement order creation failed:', err);
      setIsSubmitting(false);
    }
  };

  // Update order status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const updated = await updateProcurementOrderStatus(orderId, newStatus);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
      if (selectedOrderDetails?.orderId === orderId) {
        setSelectedOrderDetails(updated);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Showcase Banner */}
      <PageHero
        badge="SIMULATED PROCUREMENT & LOGISTICS DISPATCH"
        subBadge="DECISION SUPPORT SYSTEM"
        titleLine1="Source the cargo."
        titleLine2="Simulate the procurement."
        description="Enter bulk-cargo specifications, compute inventory safety buffers, determine optimal multi-modal transport modes (trucking, rail rakes, ocean bulkers), and generate simulated procurement orders."
        primaryAction={{
          label: "View Orders Ledger",
          href: "#orders-ledger",
        }}
        secondaryAction={{
          label: "Charter Optimization",
          href: "/optimization",
        }}
        stats={[
          { value: `${orders.length} Orders`, label: "Simulated Orders", sublabel: "Demo Ledger" },
          { value: "50 MT - 230k MT", label: "Volume Coverage", sublabel: "Truck to Capesize" },
          { value: "$115 - $215/t", label: "Coal Benchmarks", sublabel: "Thermal & Coking" },
          { value: "100% Risk Free", label: "Simulation Mode", sublabel: "No Financial Debit" },
        ]}
      />

      {/* Demonstration & Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 backdrop-blur-md">
        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-cyan font-mono tracking-wide uppercase">
            Simulated Procurement Order Module — Decision Support & Demonstration Only
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            This module models landed costs, safety-stock requirements, and multi-modal transport selection (small-lot trucking vs rail vs ocean charters).
            <strong className="text-slate-100"> No actual supplier purchase, financial liability, or binding payment occurs.</strong> All pricing, order IDs, and status workflows are strictly simulated.
          </p>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="p-3 rounded-xl glass hover:bg-ocean-800/60 border border-electric/15 hover:border-cyan/40 transition-all text-left flex flex-col gap-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan transition-colors">
                  {p.quantityTons} Tons {p.commodity}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-900 border border-electric/20 text-cyan">
                  {p.quantityTons <= 100 ? 'Trucking' : p.quantityTons < 10000 ? 'Rail Rake' : 'Ocean Bulker'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans line-clamp-1">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (7 cols) + Real-time Estimate & Formula Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass rounded-xl p-6 border border-electric/20">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-electric/15">
              <div>
                <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold mb-0.5">
                  ◆ CARGO DEMAND & SPECIFICATION
                </div>
                <h3 className="font-display font-bold text-lg text-slate-100 m-0">
                  Procurement Order Specification Form
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-ocean-900 border border-electric/30 text-slate-300">
                Mode: <strong className="text-emerald-400">Simulated</strong>
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 font-mono text-xs">
              {/* Row 1: Commodity & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Commodity
                  </label>
                  <select
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Grade / Specification
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                  >
                    {COAL_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Quantity & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Quantity (Metric Tons) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={quantityTons}
                      onChange={(e) => setQuantityTons(Math.max(1, Number(e.target.value)))}
                      required
                      className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan text-xs"
                      placeholder="e.g. 50"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-bold">MT</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {quantityTons <= 100
                      ? '⚡ Micro-lot: Dispatched via Truck Fleet'
                      : quantityTons < 10000
                        ? '🚆 Mid-tier: Consolidated Rail Rake'
                        : '🚢 Large: Deep-sea Ocean Bulker'}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Available Budget (USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={budgetUsd}
                      onChange={(e) => setBudgetUsd(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan text-xs"
                      placeholder="e.g. 10000"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-bold">USD</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Origin / Source Stockyard
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                    placeholder="e.g. Local Regional Stockyard"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Destination / Plant Terminal
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                    placeholder="e.g. Visakhapatnam Plant"
                  />
                </div>
              </div>

              {/* Row 4: Delivery Date & Nominated Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Required Delivery Date
                  </label>
                  <input
                    type="date"
                    value={requiredDeliveryDate}
                    onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                    Nominated Supplier / Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs"
                    placeholder="e.g. Regional Coal Supplier"
                  />
                </div>
              </div>

              {/* Inventory Buffer Inputs (for formula) */}
              <div className="p-3.5 rounded-xl bg-ocean-950/70 border border-electric/15 space-y-2.5">
                <div className="text-[10px] text-cyan font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  <span>Inventory Buffer & Consumption Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[9px] uppercase">
                      Forecast Demand (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={forecastDemandTons}
                      onChange={(e) => setForecastDemandTons(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-ocean-900 border border-electric/20 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[9px] uppercase">
                      Safety Stock (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={safetyStockTons}
                      onChange={(e) => setSafetyStockTons(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-ocean-900 border border-electric/20 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[9px] uppercase">
                      Current Inventory (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentInventoryTons}
                      onChange={(e) => setCurrentInventoryTons(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-ocean-900 border border-electric/20 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Live Formula Display */}
                <div className="pt-2 border-t border-electric/10 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
                  <span>Formula: <code>Demand ({forecastDemandTons}) + Safety ({safetyStockTons}) - Inventory ({currentInventoryTons})</code></span>
                  <span className="font-bold text-cyan">
                    Buffer Needed: <strong>{calculatedBufferQuantity.toLocaleString()} MT</strong>
                  </span>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">
                  Special Instructions / Handling Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-ocean-950 border border-electric/25 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan text-xs font-sans"
                  placeholder="e.g. Moisture limit < 8%, sampling certificates required upon gate weighbridge."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-electric to-cyan-500 hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-electric/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generate Simulated Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Real-time Estimate & Breakdown Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-xl p-6 border border-electric/20 font-mono text-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-electric/15">
              <div>
                <div className="text-[10px] text-cyan font-bold tracking-wider uppercase mb-0.5">
                  ◆ LOGISTICS & COST BREAKDOWN
                </div>
                <h4 className="font-display font-bold text-base text-slate-100 m-0">
                  Dynamic Procurement Estimate
                </h4>
              </div>
              {isEstimating && <RefreshCw className="w-3.5 h-3.5 text-cyan animate-spin" />}
            </div>

            {/* Transport Mode Hero Card */}
            {estimate && (
              <div className="p-4 rounded-xl bg-ocean-950 border border-cyan/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                    Recommended Mode
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${estimate.riskLevel === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                    {estimate.riskLevel} RISK
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  {estimate.quantityTons <= 100 ? (
                    <Truck className="w-5 h-5 text-cyan shrink-0" />
                  ) : estimate.quantityTons < 10000 ? (
                    <Train className="w-5 h-5 text-cyan shrink-0" />
                  ) : (
                    <Ship className="w-5 h-5 text-cyan shrink-0" />
                  )}
                  <span>{estimate.recommendedTransportMode}</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-2">
                  {estimate.explanation}
                </p>

                <div className="pt-2 border-t border-electric/15 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Estimated Transit Window:</span>
                  <strong className="text-cyan">{estimate.estimatedDeliveryDays} Days</strong>
                </div>
              </div>
            )}

            {/* Detailed Cost Line Items */}
            {estimate && (
              <div className="space-y-2 text-slate-300 divide-y divide-electric/10">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Cargo Quantity:</span>
                  <span className="font-bold text-slate-100">{estimate.quantityTons.toLocaleString()} MT ({estimate.grade})</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Commodity FOB Price:</span>
                  <span>${estimate.unitCargoPriceUsd.toFixed(2)}/MT</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Estimated Cargo Subtotal:</span>
                  <span className="font-bold text-slate-200">
                    ${estimate.estimatedCargoCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Freight Cost (${estimate.unitFreightPriceUsd.toFixed(2)}/MT):</span>
                  <span className="font-bold text-cyan">
                    ${estimate.estimatedFreightCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Port & Handling (${estimate.unitHandlingPriceUsd.toFixed(2)}/MT):</span>
                  <span className="font-bold text-slate-300">
                    ${estimate.estimatedHandlingCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Total Cost Highlight */}
                <div className="flex justify-between items-center py-3 bg-ocean-950/60 px-3 rounded-lg border border-electric/20 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Estimated Landed Cost</span>
                    <span className="text-xs text-slate-500 font-sans">Inclusive of freight & handling</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      ${estimate.estimatedTotalCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {budgetUsd > 0 && (
                      <span className={`text-[10px] block ${estimate.estimatedTotalCostUsd <= budgetUsd ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {estimate.estimatedTotalCostUsd <= budgetUsd ? '✓ Within Budget' : '⚠ Exceeds Budget'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal when Order is Created */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl glass rounded-2xl border border-cyan/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-electric/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-base text-slate-100 m-0">
                  Simulated Procurement Order Created
                </h3>
              </div>
              <button
                onClick={() => setCreatedOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-ocean-950 rounded-xl border border-cyan/25 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Assigned Order ID</span>
                <div className="text-base font-bold text-cyan">{createdOrder.orderId}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Initial Status</span>
                <div className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                  {createdOrder.orderStatus}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
              <div className="p-2.5 rounded bg-ocean-900/60 border border-electric/15">
                <span className="text-[10px] text-slate-400 block">COMMODITY & VOLUME</span>
                <strong>{createdOrder.quantityTons} MT {createdOrder.commodity} ({createdOrder.grade})</strong>
              </div>
              <div className="p-2.5 rounded bg-ocean-900/60 border border-electric/15">
                <span className="text-[10px] text-slate-400 block">ESTIMATED LANDED COST</span>
                <strong className="text-emerald-400">${createdOrder.estimatedTotalCostUsd.toLocaleString()} USD</strong>
              </div>
              <div className="p-2.5 rounded bg-ocean-900/60 border border-electric/15">
                <span className="text-[10px] text-slate-400 block">TRANSPORT MODE</span>
                <span className="text-slate-200">{createdOrder.recommendedTransportMode}</span>
              </div>
              <div className="p-2.5 rounded bg-ocean-900/60 border border-electric/15">
                <span className="text-[10px] text-slate-400 block">DELIVERY WINDOW</span>
                <span className="text-slate-200">{createdOrder.requiredDeliveryDate} ({createdOrder.estimatedDeliveryDays}d transit)</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Order has been added to the simulated procurement ledger. You can inspect status progressions, track transport allocation, or simulate supplier approval.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setCreatedOrder(null)}
                className="px-4 py-2 rounded-lg bg-electric text-white text-xs font-mono font-bold hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Close & View Orders Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Orders Ledger Section */}
      <div id="orders-ledger" className="glass rounded-xl p-6 border border-electric/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-electric/15">
          <div>
            <div className="text-[10px] text-cyan font-mono tracking-wider uppercase font-bold mb-0.5">
              ◆ ORDERS REPOSITORY & WORKFLOW LEDGER
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 m-0">
              Active Simulated Procurement Orders ({orders.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Database: <strong className="text-cyan">Modular In-Memory Store</strong>
          </span>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-electric/15 bg-ocean-950/60">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Commodity</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Transport Mode</th>
                <th className="py-2.5 px-3">Total Est. Cost</th>
                <th className="py-2.5 px-3">Delivery Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-electric/10">
              {orders.map((order) => {
                const isTruck = order.quantityTons <= 100;
                const isTrain = order.quantityTons < 10000 && !isTruck;

                const statusColor =
                  order.orderStatus === 'Approved' || order.orderStatus === 'Delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : order.orderStatus === 'Dispatched'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : order.orderStatus === 'Cancelled'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                return (
                  <tr key={order.orderId} className="hover:bg-ocean-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan">{order.orderId}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-bold">{order.commodity}</div>
                      <div className="text-[10px] text-slate-400">{order.grade}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">
                      {order.quantityTons.toLocaleString()} MT
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {isTruck ? (
                          <Truck className="w-3.5 h-3.5 text-cyan shrink-0" />
                        ) : isTrain ? (
                          <Train className="w-3.5 h-3.5 text-cyan shrink-0" />
                        ) : (
                          <Ship className="w-3.5 h-3.5 text-cyan shrink-0" />
                        )}
                        <span className="truncate max-w-[170px]">{order.recommendedTransportMode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      ${order.estimatedTotalCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{order.requiredDeliveryDate}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusColor}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="text-cyan hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl glass rounded-2xl border border-electric/30 p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-electric/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan" />
                <h3 className="font-display font-bold text-base text-slate-100 m-0">
                  Procurement Order Dossier: {selectedOrderDetails.orderId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="p-3 bg-ocean-950 rounded-lg border border-electric/15">
                <span className="text-[10px] text-slate-500 block">COMMODITY & VOLUME</span>
                <strong className="text-slate-100 text-sm">{selectedOrderDetails.quantityTons} MT {selectedOrderDetails.commodity}</strong>
                <div className="text-[10px] text-cyan">{selectedOrderDetails.grade}</div>
              </div>

              <div className="p-3 bg-ocean-950 rounded-lg border border-electric/15">
                <span className="text-[10px] text-slate-500 block">TOTAL ESTIMATED COST</span>
                <strong className="text-emerald-400 text-sm">${selectedOrderDetails.estimatedTotalCostUsd.toLocaleString()} USD</strong>
                <div className="text-[10px] text-slate-400">Budget: ${selectedOrderDetails.budgetUsd?.toLocaleString() || 'N/A'}</div>
              </div>

              <div className="p-3 bg-ocean-950 rounded-lg border border-electric/15">
                <span className="text-[10px] text-slate-500 block">ORIGIN & VENDOR</span>
                <div className="text-slate-200">{selectedOrderDetails.origin}</div>
                <div className="text-[10px] text-slate-400">{selectedOrderDetails.supplierName || 'Nominated Stockyard'}</div>
              </div>

              <div className="p-3 bg-ocean-950 rounded-lg border border-electric/15">
                <span className="text-[10px] text-slate-500 block">DESTINATION & WINDOW</span>
                <div className="text-slate-200">{selectedOrderDetails.destination}</div>
                <div className="text-[10px] text-cyan">{selectedOrderDetails.requiredDeliveryDate} ({selectedOrderDetails.estimatedDeliveryDays}d transit)</div>
              </div>
            </div>

            {/* Logistics Explanation */}
            <div className="p-3 rounded-lg bg-ocean-900/60 border border-electric/20 space-y-1">
              <span className="text-[10px] text-cyan font-bold block uppercase">Logistics Recommendation & Mode</span>
              <div className="font-bold text-slate-200">{selectedOrderDetails.recommendedTransportMode}</div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {selectedOrderDetails.explanation}
              </p>
            </div>

            {/* Change Status Workflow */}
            <div className="p-3 rounded-lg bg-ocean-950 border border-electric/15 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Simulate Order Status:</span>
              <div className="flex flex-wrap gap-1">
                {(['Draft', 'Submitted', 'Supplier Confirmation Pending', 'Approved', 'Dispatched', 'Delivered', 'Cancelled'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedOrderDetails.orderId, st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${selectedOrderDetails.orderStatus === st
                          ? 'bg-cyan text-slate-950 shadow-sm'
                          : 'bg-ocean-900 text-slate-400 hover:text-white border border-electric/20'
                        }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>Timestamp: {selectedOrderDetails.createdTimestamp}</span>
              <span>Demonstration Order • Non-binding</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ShoppingBag, ArrowRight, Printer, CreditCard, Landmark, Coins } from "lucide-react";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Confetti particle configuration
const CONFETTI_COLORS = ["#FFC107", "#FF5722", "#4CAF50", "#2196F3", "#E91E63", "#9C27B0", "#00BCD4"];

function ConfettiShower() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const particles = Array.from({ length: 70 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((_, i) => {
        const size = Math.random() * 8 + 6;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const startX = Math.random() * 100; // in vw
        const delay = Math.random() * 1.5;
        const duration = Math.random() * 2.5 + 2;

        return (
          <motion.div
            key={i}
            initial={{
              x: `${startX}vw`,
              y: -20,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: "110vh",
              rotate: Math.random() * 720 - 360,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration,
              delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}

// Generate deterministic visual barcode pattern based on Order ID
function generateBarcodePattern(orderId: string) {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const lines = [];
  let currentX = 10;
  const numLines = 50;

  for (let i = 0; i < numLines; i++) {
    const seed = Math.abs(Math.sin(hash + i) * 1000);
    const width = (Math.floor(seed) % 3) + 1.2; // random width between 1.2 and 4.2px
    const gap = (Math.floor(seed / 3) % 3) + 1.2; // random gap between 1.2 and 4.2px
    lines.push({ x: currentX, width });
    currentX += width + gap;
  }

  return { lines, totalWidth: currentX + 10 };
}

function formatTicketDate(isoDate: string) {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Just now";
    
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  } catch {
    return "Just now";
  }
}

interface OrderSuccessTicketProps {
  order: Order;
}

export function OrderSuccessTicket({ order }: OrderSuccessTicketProps) {
  const router = useRouter();
  const { lines, totalWidth } = generateBarcodePattern(order.id);

  // Derive human-readable payment name and custom iconography
  const renderPaymentBadge = () => {
    const provider = order.payment?.provider ?? "cod";
    const name = order.address.fullName || "Customer";

    switch (provider) {
      case "cod":
        return (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl w-full">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-xs text-slate-500 font-medium">Cash on Delivery (Pay on arrival)</p>
            </div>
          </div>
        );
      case "upi_offline":
        return (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl w-full">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-xs text-slate-500 font-medium truncate">
                {order.payment?.upiVpa || "UPI Offline Transfer"}
              </p>
            </div>
          </div>
        );
      default:
        // Mastercard mock overlap circles
        return (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl w-full">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
              <div className="flex -space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-rose-500/90 shadow-sm"></div>
                <div className="w-5 h-5 rounded-full bg-amber-500/90 shadow-sm"></div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-xs text-slate-500 font-medium">
                Online Payment via {provider.toUpperCase()}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-200 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 p-4 sm:p-6 select-none overflow-x-hidden">
      <ConfettiShower />

      {/* Main Ticket Layout Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100/80 dark:border-slate-900/80 pt-8 pb-12 overflow-hidden flex flex-col"
      >
        {/* Left Side Ticket Cutout */}
        <div className="absolute top-[42%] -left-3.5 w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-zinc-200 dark:from-slate-950 dark:to-zinc-950 border-r border-slate-100 dark:border-slate-900 z-10"></div>
        {/* Right Side Ticket Cutout */}
        <div className="absolute top-[42%] -right-3.5 w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-zinc-200 dark:from-slate-950 dark:to-zinc-950 border-l border-slate-100 dark:border-slate-900 z-10"></div>

        {/* Top Segment: Thank You Message */}
        <div className="flex flex-col items-center text-center px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4"
          >
            <span className="text-3xl">🎉</span>
          </motion.div>
          
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Thank you!
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-[280px]">
            Your order has been placed successfully
          </p>
        </div>

        {/* Perforated Separator Line */}
        <div className="my-8 relative">
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Middle Segment: Details */}
        <div className="flex flex-col gap-6 px-8 flex-1">
          {/* Order ID & Amount Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Order ID</p>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-mono tracking-tight">
                {order.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Amount</p>
              <p className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          {/* Date & Time Row */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Date & Time</p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatTicketDate(order.createdAt)}
            </p>
          </div>

          {/* Payment Card / Method Block */}
          <div className="mt-2">
            {renderPaymentBadge()}
          </div>
        </div>

        {/* Bottom Perforated Line */}
        <div className="my-8 relative">
          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Bottom Segment: Barcode */}
        <div className="flex flex-col items-center px-8">
          <div className="w-full max-w-[280px] opacity-80 hover:opacity-100 transition-opacity">
            <svg
              width="100%"
              height="64"
              viewBox={`0 0 ${totalWidth} 64`}
              preserveAspectRatio="none"
              className="text-slate-800 dark:text-slate-200 fill-current"
            >
              {lines.map((line, i) => (
                <rect key={i} x={line.x} y="0" width={line.width} height="64" />
              ))}
            </svg>
          </div>
          <p className="mt-2.5 text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500">
            {order.id.split("").join(" ")}
          </p>
        </div>

        {/* Scalloped Edge Effect */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-3 overflow-hidden pointer-events-none translate-y-1/2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-100 to-zinc-200 dark:from-slate-950 dark:to-zinc-950 border border-slate-200/20 dark:border-slate-800/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
            ></div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md flex flex-col sm:flex-row gap-3 mt-6 px-4"
      >
        <button
          onClick={() => router.push("/")}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </button>
        <button
          onClick={() => router.replace(`/orders/${order.id}`)}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          View Full Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

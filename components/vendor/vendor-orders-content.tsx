"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Download,
  Printer,
  Truck,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  User,
  Mail,
  Phone,
  DollarSign,
  ShoppingBag,
  MoreVertical,
  RefreshCw,
  Bell,
  ArrowRight,
  CheckCheck,
  Play,
  Square,
  X,
  Star,
  TrendingUp,
  Activity,
  Zap,
  Filter as FilterIcon,
  SortDesc,
  MessageCircle,
  CreditCard,
  Archive,
  ExternalLink,
  Copy,
  Info,
  Sparkles,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Order as DBOrder, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Type definitions - Enhanced with additional order workflow statuses
type OrderStatus = "new" | "accepted" | "processing" | "packed" | "ready_to_ship" | "shipped" | "delivered" | "cancelled" | "returned" | "exchange_requested";

interface OrderItem {
  id: string;
  productName: string;
  variant: string;
  quantity: number;
  price: number;
  tax: number;
  sku?: string;
  image?: string;
}

interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  label: string;
  notes?: string;
  updatedBy?: string;
  automatic?: boolean;
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVip?: boolean;
  orderCount?: number;
  totalSpent?: number;
}

interface ShippingDetails {
  courier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingCost?: number;
  labelGenerated?: boolean;
}

interface OrderNotes {
  id: string;
  note: string;
  addedBy: string;
  addedAt: Date;
  type: "internal" | "customer_visible";
}

interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerDetails;
  orderDate: Date;
  status: OrderStatus;
  priority: "normal" | "urgent" | "express";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentStatus: "pending" | "completed" | "failed" | "refunded" | "partial_refund";
  paymentMethod: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  shippingDetails?: ShippingDetails;
  timeline: OrderTimeline[];
  notes: OrderNotes[];
  flags: {
    hasCustomImage?: boolean;
    isGift?: boolean;
    isRush?: boolean;
    hasCoupon?: boolean;
  };
  analytics: {
    viewCount?: number;
    updateCount?: number;
    lastViewed?: Date;
  };
}



const ORDER_STATUSES: { 
  value: OrderStatus; 
  label: string; 
  color: string; 
  bgColor: string; 
  icon: React.ReactNode;
  description: string;
  nextStatuses: OrderStatus[];
}[] = [
  { 
    value: "new", 
    label: "New Order", 
    color: "text-sky-700", 
    bgColor: "bg-gradient-to-r from-sky-50 to-blue-50 border-sky-300", 
    icon: <Sparkles className="w-4 h-4" />,
    description: "Fresh order just received",
    nextStatuses: ["accepted", "cancelled"]
  },
  { 
    value: "accepted", 
    label: "Accepted", 
    color: "text-indigo-700", 
    bgColor: "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300", 
    icon: <CheckCircle className="w-4 h-4" />,
    description: "Order confirmed and accepted",
    nextStatuses: ["processing", "cancelled"]
  },
  { 
    value: "processing", 
    label: "Processing", 
    color: "text-purple-700", 
    bgColor: "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-300", 
    icon: <Activity className="w-4 h-4" />,
    description: "Order is being prepared",
    nextStatuses: ["packed", "cancelled"]
  },
  { 
    value: "packed", 
    label: "Packed", 
    color: "text-orange-700", 
    bgColor: "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300", 
    icon: <Package className="w-4 h-4" />,
    description: "Order packed and ready",
    nextStatuses: ["ready_to_ship", "cancelled"]
  },
  { 
    value: "ready_to_ship", 
    label: "Ready to Ship", 
    color: "text-amber-700", 
    bgColor: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300", 
    icon: <Zap className="w-4 h-4" />,
    description: "Awaiting courier pickup",
    nextStatuses: ["shipped", "cancelled"]
  },
  { 
    value: "shipped", 
    label: "Shipped", 
    color: "text-cyan-700", 
    bgColor: "bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-300", 
    icon: <Truck className="w-4 h-4" />,
    description: "Order dispatched to customer",
    nextStatuses: ["delivered", "returned"]
  },
  { 
    value: "delivered", 
    label: "Delivered", 
    color: "text-emerald-700", 
    bgColor: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300", 
    icon: <CheckCheck className="w-4 h-4" />,
    description: "Successfully delivered",
    nextStatuses: ["returned", "exchange_requested"]
  },
  { 
    value: "cancelled", 
    label: "Cancelled", 
    color: "text-rose-700", 
    bgColor: "bg-gradient-to-r from-rose-50 to-red-50 border-rose-300", 
    icon: <X className="w-4 h-4" />,
    description: "Order was cancelled",
    nextStatuses: []
  },
  { 
    value: "returned", 
    label: "Returned", 
    color: "text-slate-700", 
    bgColor: "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300", 
    icon: <Archive className="w-4 h-4" />,
    description: "Order returned by customer",
    nextStatuses: []
  },
  { 
    value: "exchange_requested", 
    label: "Exchange Request", 
    color: "text-violet-700", 
    bgColor: "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300", 
    icon: <RefreshCw className="w-4 h-4" />,
    description: "Customer requested exchange",
    nextStatuses: ["processing", "cancelled"]
  },
];

const PRIORITY_CONFIG = {
  normal: { label: "Normal", color: "text-stone-600", bg: "bg-stone-100", icon: "📦" },
  urgent: { label: "Urgent", color: "text-orange-600", bg: "bg-orange-100", icon: "⚡" },
  express: { label: "Express", color: "text-red-600", bg: "bg-red-100", icon: "🚀" },
};

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-100", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-100", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: "Failed", color: "text-red-600", bg: "bg-red-100", icon: <X className="w-3 h-3" /> },
  refunded: { label: "Refunded", color: "text-blue-600", bg: "bg-blue-100", icon: <RefreshCw className="w-3 h-3" /> },
  partial_refund: { label: "Partial Refund", color: "text-purple-600", bg: "bg-purple-100", icon: <RefreshCw className="w-3 h-3" /> },
};

// Utility functions
function getStatusInfo(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
}

function getStatusIcon(status: OrderStatus): React.ReactNode {
  return getStatusInfo(status).icon;
}

function getPriorityInfo(priority: string) {
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
}

function getPaymentStatusInfo(status: string) {
  return PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.pending;
}

function formatCurrencyEnhanced(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

function getOrderPriorityScore(order: Order): number {
  let score = 0;
  if (order.priority === "express") score += 3;
  if (order.priority === "urgent") score += 2;
  if (order.flags.isRush) score += 2;
  if (order.flags.hasCustomImage) score += 1;
  if (order.customer.isVip) score += 1;
  return score;
}

function shouldHighlightOrder(order: Order): boolean {
  return getOrderPriorityScore(order) >= 2 ||
         ["new", "accepted"].includes(order.status) ||
         (order.customer.isVip === true);
}

// Enhanced Status Update Dialog with comprehensive workflow
function StatusUpdateDialog({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus 
}: { 
  order: Order | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedStatus(null);
      setNotes("");
      setTrackingNumber(order.shippingDetails?.trackingNumber || "");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const statusInfo = getStatusInfo(order.status);
  const nextStatuses = statusInfo.nextStatuses;

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      // Simulate API call with enhanced tracking
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add tracking number if shipping
      let finalNotes = notes;
      if (selectedStatus === "shipped" && trackingNumber) {
        finalNotes += `${finalNotes ? ' | ' : ''}Tracking: ${trackingNumber}`;
      }
      
      onUpdateStatus(order.id, selectedStatus, finalNotes);
      toast.success(`Order status updated to ${getStatusInfo(selectedStatus).label}`, {
        description: finalNotes || "Status change recorded successfully",
        icon: getStatusInfo(selectedStatus).icon,
        duration: 4000,
      });
      onClose();
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl border-2 border-stone-200 bg-gradient-to-br from-white via-stone-50 to-white shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Enhanced Header */}
        <div className="border-b border-stone-200 px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Update Order Status</h2>
                <p className="text-sm text-stone-600 mt-1">
                  Manage order {order.orderNumber} for {order.customer.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="text-stone-400 hover:text-stone-600 hover:bg-white/80 rounded-xl p-2 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-250px)] px-8 py-6 space-y-6">
          {/* Current Status Display */}
          <div className="p-5 bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl border border-stone-200">
            <p className="text-xs text-stone-600 uppercase tracking-wider font-bold mb-3">Current Status</p>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${statusInfo.bgColor}`}>
                {statusInfo.icon}
              </div>
              <div>
                <p className={`font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
                <p className="text-sm text-stone-600">{statusInfo.description}</p>
                <p className="text-xs text-stone-500 mt-1">
                  Last updated {formatTimeAgo(order.timeline[0]?.timestamp || new Date())}
                </p>
              </div>
            </div>
          </div>

          {/* Next Status Selection */}
          {nextStatuses.length > 0 ? (
            <div>
              <p className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                Select New Status
              </p>
              <div className="grid gap-3">
                {nextStatuses.map((status) => {
                  const nextStatusInfo = getStatusInfo(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        selectedStatus === status
                          ? `${nextStatusInfo.bgColor} ring-4 ring-blue-300 ring-offset-2 scale-[1.02]`
                          : `${nextStatusInfo.bgColor} hover:ring-2 hover:ring-blue-200 hover:scale-[1.01]`
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${nextStatusInfo.bgColor}`}>
                          {nextStatusInfo.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-lg ${nextStatusInfo.color}`}>{nextStatusInfo.label}</p>
                          <p className="text-sm text-stone-600">{nextStatusInfo.description}</p>
                          {status === "shipped" && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                              <Truck className="w-3 h-3" />
                              Will require tracking number
                            </div>
                          )}
                        </div>
                        {selectedStatus === status && (
                          <div className="text-blue-600">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl text-white">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-800 font-bold text-lg">Order Complete</p>
                  <p className="text-sm text-emerald-600 mt-1">This order has reached its final status</p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Fields */}
          {selectedStatus === "shipped" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">
                  Tracking Number *
                </label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="border-stone-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          )}

          {/* Notes Section */}
          {selectedStatus && (
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this status update..."
                className="w-full rounded-xl border-2 border-stone-200 p-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="border-t border-stone-200 flex items-center justify-end gap-4 px-8 py-6 bg-gradient-to-r from-stone-50 to-stone-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
            className="border-2 border-stone-300 hover:bg-white rounded-xl px-6 py-3"
          >
            Cancel
          </Button>
          {nextStatuses.length > 0 && (
            <Button 
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || isUpdating || (selectedStatus === "shipped" && !trackingNumber)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold px-8 py-3 shadow-lg"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Updating Status...
                </>
              ) : (
                <>
                  <CheckCheck className="w-5 h-5 mr-2" />
                  Update to {selectedStatus ? getStatusInfo(selectedStatus).label : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
function OrderTimeline({ timeline }: { timeline: OrderTimeline[] }) {
  return (
    <div className="relative">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
          Order Timeline
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
            Live Tracking
          </Badge>
        </h3>
        <p className="text-sm text-stone-600">Real-time status updates and delivery progress</p>
      </div>

      <div className="relative">
        {/* Enhanced Timeline line with gradient and glow */}
        <div className="absolute left-[23px] top-0 bottom-0 w-2 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 rounded-full shadow-lg" />
        <div className="absolute left-[24px] top-0 bottom-0 w-1 bg-gradient-to-b from-white/20 to-transparent rounded-full" />

        {/* Timeline items with enhanced design */}
        <div className="space-y-8">
          {timeline.map((item, idx) => {
            const statusInfo = getStatusInfo(item.status);
            const isLatest = idx === 0;
            const isCompleted = idx > 0;
            
            return (
              <div key={idx} className="relative pl-16">
                {/* Enhanced Timeline dot with rings and glow */}
                <div className={`absolute left-0 top-1 w-12 h-12 rounded-full border-4 border-white ${statusInfo.bgColor} flex items-center justify-center text-lg shadow-xl transition-all hover:scale-110 ${isLatest ? 'ring-4 ring-blue-200 ring-opacity-50 animate-pulse' : ''}`}>
                  <div className={`absolute inset-0 rounded-full ${isLatest ? 'animate-ping bg-blue-400 opacity-20' : ''}`} />
                  <span className="relative z-10">{getStatusIcon(item.status)}</span>
                </div>

                {/* Enhanced Timeline card with gradients and depth */}
                <div className={`p-5 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 ${statusInfo.bgColor} backdrop-blur-sm ${isLatest ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className={`font-bold ${statusInfo.color} text-lg`}>{item.label}</p>
                        {isLatest && (
                          <Badge className="bg-blue-600 text-white text-xs animate-bounce">
                            <span className="w-2 h-2 bg-white rounded-full inline-block mr-1 animate-pulse" />
                            Current
                          </Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-sm text-stone-600 mb-2">{formatDateTime(item.timestamp)}</p>
                      
                      {/* Progress indicators */}
                      {item.status === "processing" && (
                        <div className="mt-3 p-2 bg-white/60 rounded border">
                          <div className="flex items-center gap-2 text-xs text-stone-700">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            Processing in warehouse...
                          </div>
                        </div>
                      )}
                      
                      {item.status === "shipped" && (
                        <div className="mt-3 p-2 bg-white/60 rounded border">
                          <div className="flex items-center gap-2 text-xs text-stone-700">
                            <Truck className="w-3 h-3 text-cyan-600" />
                            In transit - Expected delivery in 1-2 days
                          </div>
                        </div>
                      )}
                      
                      {item.status === "delivered" && (
                        <div className="mt-3 p-2 bg-white/60 rounded border">
                          <div className="flex items-center gap-2 text-xs text-stone-700">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Successfully delivered to customer
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced status indicators */}
                    <div className="text-right">
                      <div className="text-xs text-stone-500">
                        {timeline.length - idx} of {timeline.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection line to next item */}
                {idx < timeline.length - 1 && (
                  <div className="absolute left-[29px] top-14 w-0.5 h-6 bg-gradient-to-b from-stone-300 to-transparent" />
                )}
              </div>
            );
          })}
        </div>

        {/* Delivery Estimate */}
        <div className="mt-8 p-4 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">Delivery Estimate</p>
              <p className="text-sm text-emerald-600">Expected delivery within 2-3 business days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Details Modal
function OrderDetailsModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus 
}: { 
  order: Order | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
}) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-stone-200 bg-white/95 backdrop-blur px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">{order.orderNumber}</h2>
              <p className="text-sm text-stone-600 mt-1">{formatDate(order.orderDate)}</p>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-700 transition-colors text-2xl">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div>
            <Badge className={`px-4 py-2 text-sm font-semibold border ${getStatusInfo(order.status).bgColor}`}>
              <span className="mr-1">{getStatusIcon(order.status)}</span>{getStatusInfo(order.status).label}
            </Badge>
          </div>

          {/* Customer Information */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-stone-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider">Name</p>
                  <p className="font-semibold text-stone-900">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-stone-900 break-all">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-rose-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-stone-900">{order.customer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-stone-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 border border-stone-200 rounded-lg hover:border-electric-blue/50 hover:shadow-soft transition-all bg-stone-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900">{item.productName}</p>
                      <p className="text-sm text-stone-600">{item.variant}</p>
                      <p className="text-xs text-stone-500 mt-2">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-xs text-stone-600">+Tax: {formatCurrency(item.tax)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
              <h3 className="font-bold text-stone-900">Shipping Address</h3>
            </div>
            <p className="text-sm text-stone-900">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p className="text-sm text-stone-900">{order.shippingAddress.line2}</p>}
            <p className="text-sm text-stone-900">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal}</p>
            {order.shippingDetails?.trackingNumber && (
              <div className="mt-3 p-2 bg-white rounded border border-emerald-300">
                <p className="text-xs text-stone-600">Tracking Number</p>
                <p className="font-mono font-semibold text-stone-900">{order.shippingDetails.trackingNumber}</p>
              </div>
            )}
          </div>

          {/* Order Totals */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-bold text-stone-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                <span className="text-stone-700">Subtotal</span>
                <span className="font-semibold text-stone-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                <span className="text-stone-700">Tax (18%)</span>
                <span className="font-semibold text-stone-900">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                <span className="text-stone-700">Shipping</span>
                <span className="font-semibold text-stone-900">{formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 bg-amber-100 px-3 py-2 rounded-lg">
                <span className="font-bold text-stone-900">Total Amount</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-stone-600">Payment Status</span>
                <Badge className={order.paymentStatus === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}>
                  {order.paymentStatus === "completed" ? "✓ Completed" : "⏳ Pending"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <OrderTimeline timeline={order.timeline} />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all">
              <Download className="w-4 h-4 mr-2" /> Download Invoice
            </Button>
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all">
              <Printer className="w-4 h-4 mr-2" /> Shipping Label
            </Button>
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all">
                Update Status
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Row Component
function OrderRow({ order, onViewDetails }: { order: Order; onViewDetails: (order: Order) => void }) {
  const statusInfo = getStatusInfo(order.status);

  return (
    <div
      className={`p-4 border rounded-xl hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer ${statusInfo.bgColor}`}
      onClick={() => onViewDetails(order)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(order.status)}</span>
            <p className="font-bold text-stone-900 truncate">{order.orderNumber}</p>
            <Badge className="text-xs">{statusInfo.label}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-wider">Customer</p>
              <p className="font-semibold text-stone-900 truncate">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-wider">Order Date</p>
              <p className="font-semibold text-stone-900">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-wider">Items</p>
              <p className="font-semibold text-stone-900">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-wider">Total</p>
              <p className="font-bold text-emerald-600">{formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Invoice downloaded"); }}>
            <Download className="w-4 h-4 text-stone-600" />
          </button>
          <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); }}>
            <MoreVertical className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VendorOrdersContent({ initialOrders, vendorProducts }: { initialOrders: DBOrder[], vendorProducts: Product[] }) {
  const productIds = new Set(vendorProducts.map(p => p.id));
  const productMap = new Map(vendorProducts.map(p => [p.id, p]));

  const MAPPED_ORDERS = useMemo(() => initialOrders.map((o) => {
    // Only include items that belong to this vendor
    const vendorItems = o.items.filter(item => productIds.has(item.productId));
    const items = vendorItems.map(item => ({
      id: item.productId,
      productName: item.name,
      variant: item.variantId || "",
      quantity: item.quantity,
      price: item.price,
      tax: (item.price * (o.taxRate || 0)) / 100,
    }));
    
    const subtotal = vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = vendorItems.reduce((acc, item) => acc + (item.price * item.quantity * (o.taxRate || 0) / 100), 0);
    return {
      id: o.id,
      orderNumber: o.id.slice(0, 8).toUpperCase(),
      customer: {
        id: o.userId,
        name: o.address.fullName,
        email: "customer@example.com",
        phone: o.address.phone,
        isVip: false,
      },
      orderDate: new Date(o.createdAt),
      status: (["pending", "confirmed"].includes(o.status) ? "new" : o.status === "refunded" ? "cancelled" : o.status) as OrderStatus,
      priority: (o.priority || "normal") as "normal" | "urgent" | "express",
      items,
      subtotal,
      tax,
      shipping: o.deliveryFee || 0,
      discount: o.discountAmount || 0,
      total: subtotal + tax + (o.deliveryFee || 0) - (o.discountAmount || 0),
      paymentStatus: (o.payment.status === "success" ? "completed" : o.payment.status === "failed" ? "failed" : "pending") as "pending" | "completed" | "failed" | "refunded" | "partial_refund",
      paymentMethod: o.payment.provider || "unknown",
      shippingAddress: {
        line1: o.address.line1,
        line2: o.address.line2,
        city: o.address.city,
        state: o.address.state,
        postal: o.address.postalCode,
        country: o.address.country || "IN",
      },
      shippingDetails: o.shipping ? {
        trackingNumber: o.shipping.trackingId,
      } : undefined,
      timeline: o.timeline?.map(t => ({
        status: (["pending", "confirmed"].includes(t.status) ? "new" : t.status === "refunded" ? "cancelled" : t.status) as OrderStatus,
        timestamp: new Date(t.at),
        label: t.note || t.status,
      })) || [],
      notes: [],
      flags: {
        hasCoupon: !!o.couponCode,
      },
      analytics: {},
    } as Order;
  }), [initialOrders, vendorProducts]);

  const [orders, setOrders] = useState<Order[]>(MAPPED_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Simulate real-time order updates (in a real app, this would come from WebSocket/Socket.io)
      // For now, we'll just update the timestamp
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle status updates
  const handleUpdateStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedTimeline = [...order.timeline];
          // Add new timeline entry
          updatedTimeline.unshift({
            status: newStatus,
            timestamp: new Date(),
            label: getStatusInfo(newStatus).label
          });
          
          return {
            ...order,
            status: newStatus,
            timeline: updatedTimeline
          };
        }
        return order;
      })
    );

    // Update selected order if it's currently open
    if (selectedOrder?.id === orderId) {
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        const updatedTimeline = [...updatedOrder.timeline];
        updatedTimeline.unshift({
          status: newStatus,
          timestamp: new Date(),
          label: getStatusInfo(newStatus).label
        });
        
        setSelectedOrder({
          ...updatedOrder,
          status: newStatus,
          timeline: updatedTimeline
        });
      }
    }

    // Show real-time notification
    toast.success(`Order ${orderId.slice(-4)} status updated to ${getStatusInfo(newStatus).label}`, {
      icon: getStatusIcon(newStatus),
      duration: 4000,
    });
  }, [orders, selectedOrder]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};
    ORDER_STATUSES.forEach((s) => {
      counts[s.value] = orders.filter((o) => o.status === s.value).length;
    });
    return counts;
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const orderDate = (d: Date) => new Date(d).toDateString();
      
      switch (dateRange) {
        case "today":
          result = result.filter((o) => orderDate(o.orderDate) === orderDate(now));
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          result = result.filter((o) => new Date(o.orderDate) >= weekAgo);
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          result = result.filter((o) => new Date(o.orderDate) >= monthAgo);
          break;
      }
    }

    return result;
  }, [orders, searchQuery, statusFilter, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter((o) => ["new", "accepted", "processing", "packed"].includes(o.status)).length;

    return { totalRevenue, totalOrders, pendingOrders };
  }, [filteredOrders]);

  const handleViewDetails = useCallback(
    (order: Order) => {
      setSelectedOrder(order);
      setIsDetailsOpen(true);
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header with Real-time Status */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-stone-900 mb-2 flex items-center gap-3">
              <span className="text-5xl">📋</span>
              Vendor Orders
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-2 animate-ping" />
                Live
              </Badge>
            </h1>
            <p className="text-stone-600 text-lg">Manage and track all customer orders with real-time status updates and timeline visualization</p>
          </div>
          
          {/* Real-time Status Indicator */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-stone-700">Live Updates</span>
            </div>
            <p className="text-xs text-stone-500">Last updated: {formatDateTime(lastUpdated)}</p>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Orders
          </Button>
          <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            Export Orders
          </Button>
          <Button className="bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white shadow-lg">
            <Bell className="w-4 h-4 mr-2" />
            Set Alerts
          </Button>
        </div>
      </div>

      {/* Enhanced Metrics Cards with Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group p-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-cyan-50 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-[0.2em] font-bold mb-1">Total Revenue</p>
              <p className="text-4xl font-black text-emerald-600 mt-2">{formatCurrency(metrics.totalRevenue)}</p>
              <div className="flex items-center gap-2 mt-2">
                <ArrowRight className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">+12.3% this month</span>
              </div>
            </div>
            <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">💰</div>
          </div>
        </div>

        <div className="group p-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-blue-50/80 to-purple-50 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-[0.2em] font-bold mb-1">Total Orders</p>
              <p className="text-4xl font-black text-blue-600 mt-2">{metrics.totalOrders}</p>
              <div className="flex items-center gap-2 mt-2">
                <ArrowRight className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">+5 new today</span>
              </div>
            </div>
            <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">📦</div>
          </div>
        </div>

        <div className="group p-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 via-rose-50/80 to-orange-50 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs text-stone-600 uppercase tracking-[0.2em] font-bold mb-1">Pending Orders</p>
              <p className="text-4xl font-black text-rose-600 mt-2">{metrics.pendingOrders}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-rose-500 animate-spin" />
                <span className="text-xs font-semibold text-rose-700">Need attention</span>
              </div>
            </div>
            <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">⏳</div>
          </div>
        </div>
      </div>



      {/* Filters Section */}
      <div className="bg-gradient-to-r from-stone-50 to-stone-100/50 border border-stone-200 rounded-xl p-5">
        <div className="space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-stone-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className="bg-white border-stone-200 hover:border-blue-500"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className="bg-white border-stone-200 hover:border-blue-500"
              >
                List
              </Button>
            </div>
          </div>

          {/* Status and Date Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus | "all")}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-stone-200 focus:border-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={(val) => setDateRange(val as any)}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-stone-200 focus:border-blue-500">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            {(searchQuery || statusFilter !== "all" || dateRange !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setDateRange("all");
                }}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview Badges */}
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              statusFilter === s.value
                ? `${s.bgColor} ring-2 ring-offset-2 ring-blue-500`
                : `${s.bgColor} opacity-70 hover:opacity-100`
            }`}
          >
            {s.icon} {s.label} ({statusCounts[s.value]})
          </button>
        ))}
      </div>

      {/* Orders Grid/List */}
      <div>
        {filteredOrders.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4" : "space-y-4"}>
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} onViewDetails={handleViewDetails} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
            <ShoppingBag className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-900 font-semibold">No orders found</p>
            <p className="text-stone-600 text-sm mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal order={selectedOrder} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
    </div>
  );
}

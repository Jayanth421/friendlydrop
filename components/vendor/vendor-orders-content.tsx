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

// Type definitions
type OrderStatus = "new" | "accepted" | "processing" | "packed" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  productName: string;
  variant: string;
  quantity: number;
  price: number;
  tax: number;
}

interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  label: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderDate: Date;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: "pending" | "completed" | "failed";
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal: string;
  };
  trackingNumber?: string;
  timeline: OrderTimeline[];
  notes?: string;
}



const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; bgColor: string; icon: string }[] = [
  { value: "new", label: "New", color: "text-sky-700", bgColor: "bg-sky-50 border-sky-200", icon: "" },
  { value: "accepted", label: "Accepted", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200", icon: "" },
  { value: "processing", label: "Processing", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: "" },
  { value: "packed", label: "Packed", color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200", icon: "" },
  { value: "shipped", label: "Shipped", color: "text-cyan-700", bgColor: "bg-cyan-50 border-cyan-200", icon: "" },
  { value: "delivered", label: "Delivered", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: "" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200", icon: "" },
];

// Utility functions
function getStatusInfo(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
}

function getStatusIcon(status: OrderStatus): string {
  return "";
}

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
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

// Status Update Dialog
function StatusUpdateDialog({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus 
}: { 
  order: Order | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  // Get next possible statuses based on current status
  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case "new": return ["accepted", "cancelled"];
      case "accepted": return ["processing", "cancelled"];
      case "processing": return ["packed", "cancelled"];
      case "packed": return ["shipped", "cancelled"];
      case "shipped": return ["delivered"];
      case "delivered": return [];
      case "cancelled": return [];
      default: return [];
    }
  };

  const nextStatuses = getNextStatuses(order.status);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdateStatus(order.id, selectedStatus);
      toast.success(`Order status updated to ${getStatusInfo(selectedStatus).label}`);
      onClose();
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-stone-900">Update Order Status</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Update the status for order {order.orderNumber}
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-250px)] px-6 py-4 space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-stone-50 rounded-lg border">
            <p className="text-xs text-stone-600 uppercase tracking-wider">Current Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{getStatusIcon(order.status)}</span>
              <span className="font-semibold text-stone-900">{getStatusInfo(order.status).label}</span>
            </div>
          </div>

          {/* Next Status Selection */}
          {nextStatuses.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-stone-900 mb-3">Select New Status:</p>
              <div className="space-y-2">
                {nextStatuses.map((status) => {
                  const statusInfo = getStatusInfo(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`w-full p-3 text-left rounded-lg border transition-all ${
                        selectedStatus === status
                          ? `${statusInfo.bgColor} ring-2 ring-blue-500 ring-offset-2`
                          : `${statusInfo.bgColor} hover:ring-1 hover:ring-blue-300`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getStatusIcon(status)}</span>
                        <div>
                          <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                          <p className="text-xs text-stone-600">
                            {status === "accepted" && "Accept this order and start processing"}
                            {status === "processing" && "Order is being prepared"}
                            {status === "packed" && "Order has been packed and ready to ship"}
                            {status === "shipped" && "Order has been shipped to customer"}
                            {status === "delivered" && "Order has been delivered successfully"}
                            {status === "cancelled" && "Cancel this order"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-emerald-700 font-semibold">No further status updates available</p>
              <p className="text-xs text-emerald-600 mt-1">This order has reached its final status</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isUpdating} className="border-stone-200 hover:bg-stone-50 rounded-lg">
            Cancel
          </Button>
          {nextStatuses.length > 0 && (
            <Button 
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Update Status
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
              {getStatusIcon(order.status)} {getStatusInfo(order.status).label}
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
                  <p className="font-semibold text-stone-900">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-stone-900 break-all">{order.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-rose-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-stone-900">{order.customerPhone}</p>
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
            {order.trackingNumber && (
              <div className="mt-3 p-2 bg-white rounded border border-emerald-300">
                <p className="text-xs text-stone-600">Tracking Number</p>
                <p className="font-mono font-semibold text-stone-900">{order.trackingNumber}</p>
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
              <p className="font-semibold text-stone-900 truncate">{order.customerName}</p>
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
    
    return {
      id: o.id,
      orderNumber: o.id.slice(0, 8).toUpperCase(),
      customerName: o.address.fullName,
      customerEmail: "customer@example.com",
      customerPhone: o.address.phone,
      orderDate: new Date(o.createdAt),
      status: (["pending", "confirmed"].includes(o.status) ? "new" : o.status === "refunded" ? "cancelled" : o.status) as OrderStatus,
      items,
      subtotal: vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      tax: vendorItems.reduce((acc, item) => acc + (item.price * item.quantity * (o.taxRate || 0) / 100), 0),
      shipping: o.deliveryFee || 0,
      total: vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      paymentStatus: (o.payment.status === "success" ? "completed" : o.payment.status) as any,
      shippingAddress: {
        line1: o.address.line1,
        line2: o.address.line2,
        city: o.address.city,
        state: o.address.state,
        postal: o.address.postalCode,
      },
      trackingNumber: o.shipping?.trackingId,
      timeline: o.timeline?.map(t => ({
        status: (["pending", "confirmed"].includes(t.status) ? "new" : t.status === "refunded" ? "cancelled" : t.status) as OrderStatus,
        timestamp: new Date(t.at),
        label: t.note || t.status,
      })) || [],
      notes: o.payment.notes,
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
    return {
      new: orders.filter((o) => o.status === "new").length,
      accepted: orders.filter((o) => o.status === "accepted").length,
      processing: orders.filter((o) => o.status === "processing").length,
      packed: orders.filter((o) => o.status === "packed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
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
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
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

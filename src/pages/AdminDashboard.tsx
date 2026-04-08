import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface AdminOrder {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  address?: string | null;
  delivery_address?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  total_price: number;
  status: string;
  created_at: string;
}

interface StatusHistoryItem {
  id: string;
  order_id: string;
  status: string;
  changed_at: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusHistoryByOrder, setStatusHistoryByOrder] = useState<Record<string, StatusHistoryItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      const orderList = (data as unknown as AdminOrder[]) ?? [];
      setOrders(orderList);

      if (orderList.length > 0) {
        const orderIds = orderList.map((o) => o.id);
        const { data: historyRows } = await supabase
          .from("company_order_status_history")
          .select("id, order_id, status, changed_at")
          .in("order_id", orderIds)
          .order("changed_at", { ascending: true });
        const grouped: Record<string, StatusHistoryItem[]> = {};
        (historyRows ?? []).forEach((row) => {
          if (!grouped[row.order_id]) grouped[row.order_id] = [];
          grouped[row.order_id].push(row as StatusHistoryItem);
        });
        setStatusHistoryByOrder(grouped);
      } else {
        setStatusHistoryByOrder({});
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user, isAdmin]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success("Order status updated");
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
      <ShieldCheck className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-2xl font-display font-bold">Access Denied</h2>
      <p className="text-muted-foreground">You need admin privileges to view this page.</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">
            Admin <span className="text-gradient-gold">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-8">Manage all incoming orders</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="glass-card rounded-xl h-32 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No orders yet.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-sm font-medium text-foreground block">{order.customer_name || "Customer"}</span>
                    <span className="text-xs text-muted-foreground block">{order.customer_email || "No email"}</span>
                    <span className="text-xs text-muted-foreground">📞 {order.phone_number || order.phone || "No phone"}</span>
                  </div>
                  <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                    <SelectTrigger className="w-48 bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  📍 {order.address || order.delivery_address || "No delivery address"}
                </div>
                <div className="rounded-lg bg-muted/40 border border-border/50 p-3 mb-3">
                  <p className="text-xs font-medium text-foreground mb-2">Status Timeline</p>
                  <div className="space-y-1">
                    {(statusHistoryByOrder[order.id] ?? []).slice(-4).map((h) => (
                      <div key={h.id} className="text-xs text-muted-foreground flex justify-between gap-3">
                        <span className="capitalize">{h.status.replaceAll("_", " ")}</span>
                        <span>{new Date(h.changed_at).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    {(statusHistoryByOrder[order.id] ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No status history yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-3">
                  <span className="font-bold text-primary text-lg">₹{order.total_price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

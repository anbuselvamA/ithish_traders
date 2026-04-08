import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Clock, ChefHat, Truck, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
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

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  Pending: { icon: <Clock className="w-4 h-4" />, label: "Pending", color: "text-yellow-500" },
  pending: { icon: <Clock className="w-4 h-4" />, label: "Pending", color: "text-yellow-500" },
  preparing: { icon: <ChefHat className="w-4 h-4" />, label: "Preparing", color: "text-warm-orange" },
  out_for_delivery: { icon: <Truck className="w-4 h-4" />, label: "Out for Delivery", color: "text-blue-400" },
  delivered: { icon: <CheckCircle className="w-4 h-4" />, label: "Delivered", color: "text-green-500" },
};

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusHistoryByOrder, setStatusHistoryByOrder] = useState<Record<string, StatusHistoryItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      const orderList = (data as unknown as Order[]) ?? [];
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
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <Package className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-display font-bold">Login to view orders</h2>
        <Link to="/login"><Button className="bg-gradient-gold text-primary-foreground">Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-2xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-8">
          My <span className="text-gradient-gold">Orders</span>
        </motion.h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="glass-card rounded-xl h-28 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet. Start ordering!</p>
            <Link to="/"><Button className="bg-gradient-gold text-primary-foreground mt-4">Browse Menu</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = statusConfig[order.status] ?? statusConfig.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3 text-sm">
                    <div className="text-muted-foreground">
                      📍 {order.address || order.delivery_address || "No delivery address"}
                    </div>
                    <div className="text-muted-foreground">
                      📞 {order.phone_number || order.phone || "No phone number"}
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold text-primary">₹{order.total_price}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border/50 p-3 mt-3">
                    <p className="text-xs font-medium text-foreground mb-2">Delivery Timeline</p>
                    <div className="space-y-1">
                      {(statusHistoryByOrder[order.id] ?? []).slice(-4).map((h) => (
                        <div key={h.id} className="text-xs text-muted-foreground flex justify-between gap-3">
                          <span className="capitalize">{h.status.replaceAll("_", " ")}</span>
                          <span>{new Date(h.changed_at).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      {(statusHistoryByOrder[order.id] ?? []).length === 0 && (
                        <p className="text-xs text-muted-foreground">No timeline yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link to="/account#feedback">
                      <Button variant="outline" size="sm">Give Feedback</Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

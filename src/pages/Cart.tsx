import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart, deliveryAddress, deliveryPhone } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const makeWebhookUrl = import.meta.env.VITE_ORDER_WEBHOOK_URL;
  const sheetDbUrl = import.meta.env.VITE_SHEETDB_API_URL;
  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Request timed out. Please try again.")), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const triggerOrderWebhook = async () => {
    if (!makeWebhookUrl) return;
    await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest",
        email: user?.email || "",
        phoneNumber: deliveryPhone || "",
        address: deliveryAddress || "",
        totalPrice,
      }),
    });
  };

  const formatTimestamp = (date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const HH = pad(date.getHours());
    const MM = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${dd}-${mm}-${yyyy} ${HH}:${MM}:${ss}`;
  };

  const pushOrderToSheetDb = async (orderID: string, productName: string, accountName: string) => {
    if (!sheetDbUrl) return;
    const payload = {
      data: [
        {
          orderID,
          productName,
          accountName,
          timestamp: formatTimestamp(),
        },
      ],
    };
    const res = await fetch(sheetDbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`SheetDB sync failed with status ${res.status}`);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }
    if (!deliveryAddress) {
      toast.error("Please set delivery address before placing order");
      return;
    }
    if (!deliveryPhone) {
      toast.error("Please set phone number before placing order");
      return;
    }

    setPlacing(true);
    try {
      const { data: authData, error: authError } = await withTimeout(supabase.auth.getUser(), 12000);
      if (authError || !authData.user) {
        toast.error("Unable to verify user session. Please login again.");
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      const customerName = profile?.display_name || authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "Customer";
      const customerEmail = authData.user.email || "";
      const orderPayload = {
        customer_name: customerName,
        customer_email: customerEmail,
        phone_number: deliveryPhone,
        address: deliveryAddress,
        total_price: totalPrice,
        user_id: authData.user.id,
        status: "Pending",
      };

      let orderID = "";
      let { data: insertedOrder, error } = await withTimeout(
        supabase.from("orders").insert(orderPayload).select("id").single(),
        12000
      );
      if (insertedOrder?.id) orderID = insertedOrder.id;
      if (error?.message?.toLowerCase().includes("status")) {
        const retryPendingLower = await withTimeout(
          supabase.from("orders").insert({ ...orderPayload, status: "pending" }).select("id").single(),
          12000
        );
        error = retryPendingLower.error;
        if (retryPendingLower.data?.id) orderID = retryPendingLower.data.id;
      }
      if (error?.message?.includes("PGRST204") || error?.message?.toLowerCase().includes("column")) {
        const legacyPayload = {
          user_id: authData.user.id,
          total_price: totalPrice,
          delivery_address: deliveryAddress,
          phone: deliveryPhone,
          status: "pending",
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        };
        const retryLegacy = await withTimeout(
          supabase.from("orders").insert(legacyPayload).select("id").single(),
          12000
        );
        error = retryLegacy.error;
        if (retryLegacy.data?.id) orderID = retryLegacy.data.id;
      }
      if (error) {
        const insertError = [error.code, error.message, error.details, error.hint]
          .filter(Boolean)
          .join(" | ");
        toast.error("Failed to place order: " + insertError);
        return;
      }

      try {
        await withTimeout(triggerOrderWebhook(), 6000);
      } catch {
        toast.warning("Order placed, but spreadsheet sync failed.");
      }
      try {
        const productName = items.map((i) => `${i.name} x${i.quantity}`).join(", ");
        await withTimeout(
          pushOrderToSheetDb(
            orderID || `TEMP-${Date.now()}`,
            productName,
            customerName || authData.user.email || "Customer"
          ),
          6000
        );
      } catch {
        toast.warning("Order placed, but Google Sheet sync failed.");
      }
      toast.success("Order placed successfully! 🎉");
      clearCart();
      navigate("/my-orders");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to place order. Please try again.";
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-display font-bold text-foreground">Your cart is empty</h2>
        <p className="text-muted-foreground">Add some delicious items to get started!</p>
        <Link to="/">
          <Button className="bg-gradient-gold text-primary-foreground mt-4">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold mb-8"
        >
          Your <span className="text-gradient-gold">Cart</span>
        </motion.h1>

        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-4 flex gap-4"
            >
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                {item.offer && <p className="text-xs text-primary mt-0.5">🎁 {item.offer}</p>}
                <p className="text-primary font-bold mt-1">₹{item.price * item.quantity}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7 border-border" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7 border-border" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 glass-card rounded-xl p-6">
          {/* Delivery address section */}
          <div className="mb-4">
            {deliveryAddress ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1">
                  <span className="text-foreground">{deliveryAddress}</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    📞 {deliveryPhone || "Phone number missing"}
                  </span>
                </div>
                <Link to="/delivery?returnTo=/cart" className="text-primary text-xs font-medium hover:underline shrink-0">
                  Change
                </Link>
              </div>
            ) : (
              <Link to="/delivery?returnTo=/cart">
                <Button variant="outline" className="w-full gap-2">
                  <MapPin className="w-4 h-4" />
                  Set Delivery Address & Phone
                </Button>
              </Link>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-display font-bold text-primary">₹{totalPrice}</span>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={placing || !deliveryAddress || !deliveryPhone}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold text-lg py-6 hover:opacity-90"
          >
            {placing ? "Placing Order..." : "Place Order"}
          </Button>
          {(!deliveryAddress || !deliveryPhone) && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Delivery address and phone number are required to place order.
            </p>
          )}
          <button
            onClick={clearCart}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-destructive transition-colors text-center"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

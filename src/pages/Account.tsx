import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, LogOut, MessageSquare, MapPin, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface UserOrderSummary {
  id: string;
  total_price: number;
  status: string;
}

interface FeedbackItem {
  id: string;
  subject: string;
  message: string;
  created_at: string;
}

const Account = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const { deliveryAddress } = useCart();
  const [orders, setOrders] = useState<UserOrderSummary[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      const [{ data: orderRows }, { data: feedbackRows }] = await Promise.all([
        supabase.from("orders").select("id, total_price, status").eq("user_id", user.id),
        supabase.from("feedbacks").select("id, subject, message, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setOrders(orderRows ?? []);
      setFeedbacks(feedbackRows ?? []);
    };
    void run();
  }, [user]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const activeOrders = orders.filter((o) => o.status !== "delivered").length;
    return { totalOrders, totalSpent, activeOrders };
  }, [orders]);

  const onSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }
    setSubmitting(true);
    const optimistic: FeedbackItem = {
      id: `temp-${Date.now()}`,
      subject: subject.trim(),
      message: message.trim(),
      created_at: new Date().toISOString(),
    };
    setFeedbacks((prev) => [optimistic, ...prev]);
    setSubject("");
    setMessage("");

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({ user_id: user.id, subject: optimistic.subject, message: optimistic.message })
      .select("id, subject, message, created_at")
      .single();

    if (error) {
      setFeedbacks((prev) => prev.filter((f) => f.id !== optimistic.id));
      toast.error("Failed to submit feedback");
      setSubmitting(false);
      return;
    }

    setFeedbacks((prev) => [data, ...prev.filter((f) => f.id !== optimistic.id)]);
    toast.success("Feedback submitted");
    setSubmitting(false);
  };

  const onLogout = async () => {
    await signOut();
  };

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-4xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-8">
          My <span className="text-gradient-gold">Account</span>
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium mt-1 break-all">{user.email}</p>
            <p className="text-xs mt-2 text-primary font-medium">
              Role: {userRole === "admin" ? "Admin" : "User"}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="font-semibold mt-1">{summary.totalOrders}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="font-semibold mt-1">₹{summary.totalSpent}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Saved Addresses</h2>
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {deliveryAddress || "No saved address yet. Add one during checkout."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {userRole === "admin" && (
            <Link to="/admin-dashboard">
              <Button variant="outline" className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
          <Link to="/my-orders">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" />
              My Orders
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Active orders: {summary.activeOrders}
          </span>
        </div>

        <div id="feedback" className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Give Feedback</h2>
          </div>
          <form onSubmit={onSubmitFeedback} className="space-y-3 mb-5">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your feedback..." />
            <Button type="submit" disabled={submitting} className="bg-gradient-gold text-primary-foreground">
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
          <div className="space-y-2">
            {feedbacks.slice(0, 5).map((f) => (
              <div key={f.id} className="rounded-lg border border-border/60 p-3">
                <p className="font-medium text-sm">{f.subject}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.message}</p>
              </div>
            ))}
            {feedbacks.length === 0 && <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message || "Admin login failed");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("Access Denied: Admin account required");
      return;
    }

    setLoading(false);
    toast.success("Admin login successful");
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm glass-card rounded-2xl p-8">
        <h1 className="text-2xl font-display font-bold text-center mb-2">Admin Login</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">Authorized admins only</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
            {loading ? "Checking..." : "Login as Admin"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Login request timed out. Please try again.")), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address (e.g. name@example.com)");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await withTimeout(supabase.auth.signUp({ email, password }), 15000);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! Please check your email to verify, then log in.");
        }
      } else {
        const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 15000);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Logged in successfully!");
          navigate("/");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login right now.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card rounded-2xl p-8"
      >
        <h1 className="text-2xl font-display font-bold text-center mb-2">
          Welcome to <span className="text-gradient-gold">Ithish Traders</span>
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center mt-4"
        >
          {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;

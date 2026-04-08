import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, MapPin, LogOut, Package, ShieldCheck, CircleUserRound } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30"
    >
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-display font-bold text-gradient-gold">
            Ithish Traders
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          {user && userRole === "admin" && (
            <Link to="/admin-dashboard" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {user && (
            <Link to="/my-orders" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </Link>
          )}

          {user && (
            <Link to="/account" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <CircleUserRound className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          )}

          <Link to="/delivery" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Location</span>
          </Link>

          <Link to="/cart" className="relative flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>

          {user ? (
            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <div className="flex items-center">
              <Link to="/admin-login" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Login</span>
              </Link>
              <Link to="/login" className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

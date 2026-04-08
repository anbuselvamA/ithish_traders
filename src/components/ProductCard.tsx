import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "meat" | "biriyani";
  offer?: string;
  description?: string;
}

const ProductCard = ({ id, name, price, image, category, offer, description }: ProductCardProps) => {
  const { items, addItem, updateQuantity } = useCart();
  const { user } = useAuth();
  const cartItem = items.find((i) => i.id === id);
  const qty = cartItem?.quantity ?? 0;
  const [rating, setRating] = useState<number>(0);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    if (!user) {
      setRating(0);
      return;
    }
    const run = async () => {
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("food_id", id)
        .maybeSingle();
      setRating(data?.rating ?? 0);
    };
    void run();
  }, [id, user]);

  const handleAdd = () => {
    addItem({ id, name, price, image, category, offer });
  };

  const handleRate = async (value: number) => {
    if (!user) {
      toast.error("Please login to rate food items");
      return;
    }
    const prev = rating;
    setRating(value);
    setSavingRating(true);
    const { error } = await supabase
      .from("ratings")
      .upsert({ user_id: user.id, food_id: id, rating: value }, { onConflict: "user_id,food_id" });
    setSavingRating(false);
    if (error) {
      setRating(prev);
      toast.error("Failed to save rating");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden group bg-card border border-border/60 shadow-[0_12px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={400}
          height={400}
        />
        {offer && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
            🎁 {offer}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{name}</h3>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        <div className="flex items-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" disabled={savingRating} onClick={() => void handleRate(value)} className="disabled:opacity-50">
              <Star className={`w-4 h-4 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">Rate this item</span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-primary">₹{price}</span>
          {qty === 0 ? (
            <Button
              onClick={handleAdd}
              size="sm"
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold"
            >
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border"
                onClick={() => updateQuantity(id, qty - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold text-foreground">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border"
                onClick={() => updateQuantity(id, qty + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

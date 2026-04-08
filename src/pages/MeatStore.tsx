import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import heroMeat from "@/assets/hero-meat.jpg";

const meatProducts = [
  {
    id: "chicken-1kg",
    name: "Fresh Chicken — 1 kg",
    price: 240,
    image: heroMeat,
    category: "meat" as const,
    offer: "4 Eggs Free per 1kg",
    description: "Farm-fresh whole chicken, cleaned and cut to your preference.",
  },
  {
    id: "chicken-500g",
    name: "Fresh Chicken — 500g",
    price: 130,
    image: heroMeat,
    category: "meat" as const,
    description: "Half kg pack, perfect for small families.",
  },
  {
    id: "boneless-1kg",
    name: "Boneless Chicken — 1 kg",
    price: 380,
    image: heroMeat,
    category: "meat" as const,
    description: "Premium boneless pieces, ready to cook.",
  },
];

const MeatStore = () => (
  <div className="min-h-screen pt-24 pb-16">
    <div className="container px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
          Fresh <span className="text-gradient-gold">Raw Meat</span>
        </h1>
        <p className="text-muted-foreground mb-8">Farm-fresh chicken, delivered daily.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {meatProducts.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  </div>
);

export default MeatStore;

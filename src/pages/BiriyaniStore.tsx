import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import heroBiriyani from "@/assets/hero-biriyani.jpg";

const biriyaniProducts = [
  {
    id: "chicken-biriyani",
    name: "Chicken Biriyani",
    price: 180,
    image: heroBiriyani,
    category: "biriyani" as const,
    description: "Aromatic basmati rice layered with tender spiced chicken.",
  },
  {
    id: "chicken-65",
    name: "Chicken 65",
    price: 160,
    image: heroBiriyani,
    category: "biriyani" as const,
    description: "Crispy, spicy deep-fried chicken — the perfect starter.",
  },
  {
    id: "mutton-biriyani",
    name: "Mutton Biriyani",
    price: 280,
    image: heroBiriyani,
    category: "biriyani" as const,
    description: "Rich, slow-cooked mutton biriyani with premium spices.",
  },
];

const BiriyaniStore = () => (
  <div className="min-h-screen pt-24 pb-16">
    <div className="container px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
          Hot <span className="text-gradient-gold">Biriyani & Starters</span>
        </h1>
        <p className="text-muted-foreground mb-8">Authentic flavors, made fresh to order.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {biriyaniProducts.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  </div>
);

export default BiriyaniStore;

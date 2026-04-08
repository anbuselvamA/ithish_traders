import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import heroMeat from "@/assets/hero-meat.jpg";
import heroBiriyani from "@/assets/hero-biriyani.jpg";

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-background/70" />
      </motion.div>

      <motion.div style={{ opacity }} className="container px-4 pt-20">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-medium tracking-[0.3em] uppercase text-sm mb-4"
          >
            Premium Quality Since Day One
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6"
          >
            Fresh Meat &{" "}
            <span className="text-gradient-gold">Authentic Biriyani</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            From farm-fresh chicken to aromatic biriyani — delivered to your doorstep.
          </motion.p>
        </div>

        {/* Dual CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <CategoryCard
            to="/meat"
            image={heroMeat}
            title="Fresh Raw Meat"
            subtitle="Farm-fresh chicken, cut to order"
            delay={1}
          />
          <CategoryCard
            to="/biriyani"
            image={heroBiriyani}
            title="Hot Biriyani & Starters"
            subtitle="Authentic flavors, ready to feast"
            delay={1.2}
          />
        </div>
      </motion.div>
    </section>
  );
};

const CategoryCard = ({
  to, image, title, subtitle, delay,
}: {
  to: string; image: string; title: string; subtitle: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 60, rotateX: 10 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="group"
  >
    <Link to={to} className="block relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.4)] transition-all duration-500">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          width={1024}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
        <div className="mt-4 inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
          Shop Now
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default HeroSection;

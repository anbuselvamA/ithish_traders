import HeroSection from "@/components/HeroSection";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

const Index = () => (
  <>
    <Helmet>
      <title>Ithish Traders — Fresh Meat & Authentic Biriyani</title>
      <meta name="description" content="Order premium fresh chicken and authentic biriyani from Ithish Traders. Farm-fresh meat and hot biriyani delivered to your doorstep." />
    </Helmet>
    <main>
      <HeroSection />
      <section className="pb-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              { title: "Premium Cuts", text: "Professional cleaning and cutting for every order." },
              { title: "Daily Fresh Cooking", text: "Biriyani and starters prepared in small fresh batches." },
              { title: "Fast Local Delivery", text: "Quick doorstep service with live address support." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  </>
);

export default Index;

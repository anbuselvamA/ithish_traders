import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DeliveryLocation = () => {
  const { deliveryAddress, setDeliveryAddress, deliveryPhone, setDeliveryPhone } = useCart();
  const [address, setAddress] = useState(deliveryAddress || "");
  const [phone, setPhone] = useState(deliveryPhone || "");
  const [detecting, setDetecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Store location for the embed
  const mapSrc = "https://maps.google.com/maps?q=Saveetha%20Engineering%20College%2C%20Thandalam&z=16&output=embed";

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data.display_name || `${latitude}, ${longitude}`;
          setAddress(addr);
          toast.success("Location detected!");
        } catch {
          setAddress(`${latitude}, ${longitude}`);
        }
        setDetecting(false);
      },
      () => {
        toast.error("Unable to retrieve your location");
        setDetecting(false);
      }
    );
  };

  const handleSetLocation = () => {
    if (!address.trim()) {
      toast.error("Please enter or detect your delivery address");
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, "");
    if (!cleanedPhone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (cleanedPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setDeliveryAddress(address.trim());
    setDeliveryPhone(cleanedPhone);
    toast.success("Delivery location set! 📍");
    const params = new URLSearchParams(location.search);
    const returnTo = params.get("returnTo") || "/cart";
    navigate(returnTo);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container px-4 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold mb-6"
        >
          Delivery <span className="text-gradient-gold">Location</span>
        </motion.h1>

        {/* Map embed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden border border-border mb-6"
        >
          <iframe
            title="Store Location"
            src={mapSrc}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>

        {/* Address input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <label className="text-sm font-medium text-foreground">
            Delivery Address
          </label>
          <Input
            placeholder="Enter your delivery address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-background"
          />
          <Input
            placeholder="Enter phone number..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-background"
          />

          <Button
            variant="outline"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full gap-2"
          >
            <Navigation className="w-4 h-4" />
            {detecting ? "Detecting..." : "Use My Current Location"}
          </Button>

          {address && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground">{address}</span>
            </motion.div>
          )}

          <Button
            onClick={handleSetLocation}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold text-lg py-6 gap-2"
          >
            <Check className="w-5 h-5" />
            Set Delivery Location
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default DeliveryLocation;

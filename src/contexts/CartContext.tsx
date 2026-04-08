import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: "meat" | "biriyani";
  offer?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryAddress: string | null;
  setDeliveryAddress: (address: string | null) => void;
  deliveryPhone: string | null;
  setDeliveryPhone: (phone: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const DELIVERY_ADDRESS_KEY = "ithish_delivery_address";
const DELIVERY_PHONE_KEY = "ithish_delivery_phone";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddressState] = useState<string | null>(() => localStorage.getItem(DELIVERY_ADDRESS_KEY));
  const [deliveryPhone, setDeliveryPhoneState] = useState<string | null>(() => localStorage.getItem(DELIVERY_PHONE_KEY));

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const setDeliveryAddress = useCallback((address: string | null) => {
    setDeliveryAddressState(address);
    if (address) {
      localStorage.setItem(DELIVERY_ADDRESS_KEY, address);
      return;
    }
    localStorage.removeItem(DELIVERY_ADDRESS_KEY);
  }, []);
  const setDeliveryPhone = useCallback((phone: string | null) => {
    setDeliveryPhoneState(phone);
    if (phone) {
      localStorage.setItem(DELIVERY_PHONE_KEY, phone);
      return;
    }
    localStorage.removeItem(DELIVERY_PHONE_KEY);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, deliveryAddress, setDeliveryAddress, deliveryPhone, setDeliveryPhone }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

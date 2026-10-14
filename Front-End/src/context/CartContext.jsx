/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "aquaBrandCart";

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.round(parsed);
};

const normalizeItem = (item, fallbackIndex = 0) => {
  const bottleType = item?.bottleType || "500ml";
  const quantity = normalizeQuantity(item?.quantity ?? item?.pricing?.quantity ?? 1);
  const seed = [
    item?.id,
    bottleType,
    item?.brandName || item?.name || "custom",
    item?.logo || "",
    item?.specialInstructions || "",
  ]
    .filter(Boolean)
    .join("-");

  return {
    ...item,
    id: item?.id || `${seed || "cart-item"}-${Date.now()}-${fallbackIndex}`,
    bottleType,
    quantity,
  };
};

const readCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  const updateItems = (nextItems) => {
    const safeNextItems = Array.isArray(nextItems) ? nextItems.map((item, index) => normalizeItem(item, index)) : [];
    setItems(safeNextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeNextItems));
  };

  const addItem = (incomingItem) => {
    const normalized = normalizeItem(incomingItem, items.length);

    setItems((currentItems) => {
      const nextItems = [...currentItems];
      const existingIndex = nextItems.findIndex(
        (item) =>
          item.bottleType === normalized.bottleType &&
          (item.brandName || "") === (normalized.brandName || "") &&
          (item.logo || "") === (normalized.logo || "")
      );

      if (existingIndex === -1) {
        const updated = [...nextItems, normalized];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }

      const merged = nextItems.map((item, index) => {
        if (index !== existingIndex) return item;

        const mergedQuantity = normalizeQuantity(Number(item.quantity || 1) + Number(normalized.quantity || 1));
        return {
          ...item,
          ...normalized,
          quantity: mergedQuantity,
          price: normalized.price ?? item.price,
          unitPrice: normalized.unitPrice ?? item.unitPrice ?? normalized.pricing?.unitPrice ?? item.pricing?.unitPrice,
          pricing: normalized.pricing ?? item.pricing ?? {},
        };
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const removeItem = (id) => {
    const filtered = items.filter((item) => item.id !== id);
    updateItems(filtered);
  };

  const updateItemQuantity = (id, quantity) => {
    const safeQuantity = normalizeQuantity(quantity);
    const updated = items.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item));
    updateItems(updated);
  };

  const clearCart = () => {
    updateItems([]);
  };

  const itemCount = items.reduce((total, item) => total + Number(item.quantity || 1), 0);

  const value = {
    items,
    itemCount,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
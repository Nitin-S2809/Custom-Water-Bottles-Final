/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "aquaBrandCart";

const readCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const updateItems = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  };
  const addItem = (item) => updateItems([...items, { ...item, id: `${Date.now()}-${items.length}` }]);
  const removeItem = (id) => updateItems(items.filter((item) => item.id !== id));
  const itemCount = items.reduce((total, item) => total + Number(item.quantity || 1), 0);
  const value = { items, itemCount, addItem, removeItem };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
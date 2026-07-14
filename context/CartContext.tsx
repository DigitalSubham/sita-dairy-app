import { CartItem, Product } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const storageKey = user?._id ? `cart_${user._id}` : null;

  useEffect(() => {
    const loadCart = async () => {
      if (!storageKey) {
        setItems([]);
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        setItems(stored ? JSON.parse(stored) : []);
      } catch {
        setItems([]);
      }
    };
    loadCart();
  }, [storageKey]);

  const persist = useCallback(
    (nextItems: CartItem[]) => {
      setItems(nextItems);
      if (storageKey) {
        AsyncStorage.setItem(storageKey, JSON.stringify(nextItems)).catch(() => {});
      }
    },
    [storageKey]
  );

  const addItem = (product: Product, quantity: number = 1) => {
    const existing = items.find((item) => item.productId === product._id);
    const next = existing
      ? items.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [
          ...items,
          {
            productId: product._id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity,
          },
        ];
    persist(next);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    persist(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    persist(items.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    persist([]);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalAmount,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

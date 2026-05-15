import React, { createContext, useContext, useReducer, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

export interface CartAction {
  type: "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_QUANTITY" | "CLEAR_CART" | "BATCH";
  itemId?: string;
  itemName?: string;
  price?: number;
  quantity?: number;
  emoji?: string;
  actions?: CartAction[];
}

interface CartState {
  items: CartItem[];
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  dispatch: (action: CartAction) => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.itemId === action.itemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.itemId === action.itemId
              ? { ...i, quantity: i.quantity + (action.quantity ?? 1) }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            itemId: action.itemId!,
            name: action.itemName!,
            price: action.price!,
            quantity: action.quantity ?? 1,
            emoji: action.emoji ?? "🍽️",
          },
        ],
      };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.itemId !== action.itemId),
      };

    case "UPDATE_QUANTITY": {
      if (!action.quantity || action.quantity <= 0) {
        return {
          items: state.items.filter((i) => i.itemId !== action.itemId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.itemId === action.itemId
            ? { ...i, quantity: action.quantity! }
            : i
        ),
      };
    }

    case "CLEAR_CART":
      return { items: [] };

    case "BATCH":
      return (action.actions ?? []).reduce(
        (acc, a) => cartReducer(acc, a),
        state
      );

    default:
      return state;
  }
}

// ─── Context + Provider ───────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items: state.items, totalItems, subtotal, dispatch }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
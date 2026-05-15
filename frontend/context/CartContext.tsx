import React, { createContext, useContext, useReducer, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  emoji?: string;
  note?: string | null; // e.g. "no mushrooms", "extra spicy"
}

interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; itemId: string; itemName: string; price: number; quantity: number; emoji?: string; note?: string | null }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "UPDATE_NOTE"; itemId: string; note: string }
  | { type: "CLEAR_CART" }
  | { type: "BATCH"; actions: CartAction[] };

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
              ? {
                  ...i,
                  quantity: i.quantity + action.quantity,
                  note: action.note !== undefined ? action.note : i.note,
                }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            itemId: action.itemId,
            name: action.itemName,
            price: action.price,
            quantity: action.quantity,
            emoji: action.emoji,
            note: action.note ?? null,
          },
        ],
      };
    }

    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.itemId !== action.itemId) };

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.itemId !== action.itemId) };
      }
      return {
        items: state.items.map((i) =>
          i.itemId === action.itemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "UPDATE_NOTE":
      return {
        items: state.items.map((i) =>
          i.itemId === action.itemId ? { ...i, note: action.note } : i
        ),
      };

    case "CLEAR_CART":
      return { items: [] };

    case "BATCH":
      return action.actions.reduce(cartReducer, state);

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, subtotal, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
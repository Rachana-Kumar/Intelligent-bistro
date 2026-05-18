import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useCart, CartItem } from "../context/CartContext";
import { useRouter } from "expo-router";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAX_RATE = 0.0875; // 8.75%

// ─── Empty cart state ─────────────────────────────────────────────────────────

function EmptyCart() {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: 32,
      }}
    >
      <Text style={{ fontSize: 64 }}>🛒</Text>
      <Text
        style={{
          color: "#1f2937",
          fontWeight: "700",
          fontSize: 20,
          marginTop: 16,
        }}
      >
        Your cart is empty
      </Text>
      <Text
        style={{
          color: "#6b7280",
          fontSize: 14,
          marginTop: 8,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Browse the menu or ask the AI assistant to add items to your order
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/")}
        style={{
          marginTop: 24,
          backgroundColor: "#f97316",
          borderRadius: 99,
          paddingHorizontal: 28,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          Browse Menu
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/chat")}
        style={{
          marginTop: 12,
          backgroundColor: "#fff7ed",
          borderRadius: 99,
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: "#fed7aa",
        }}
      >
        <Text style={{ color: "#ea580c", fontWeight: "600", fontSize: 15 }}>
          Ask AI Assistant ✨
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline note editor ───────────────────────────────────────────────────────

function NoteEditor({
  itemId,
  initialNote,
  onSave,
}: {
  itemId: string;
  initialNote: string;
  onSave: (note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNote);

  if (!editing) {
    return (
      <TouchableOpacity
        onPress={() => setEditing(true)}
        style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 4 }}
      >
        <Text style={{ fontSize: 11 }}>✏️</Text>
        <Text style={{ color: "#9ca3af", fontSize: 12 }}>
          {initialNote ? "Edit instructions" : "Add special instructions…"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="e.g. no mushrooms, extra spicy, well done…"
        placeholderTextColor="#d1d5db"
        autoFocus
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#fed7aa",
          paddingHorizontal: 10,
          paddingVertical: 6,
          fontSize: 13,
          color: "#1f2937",
        }}
      />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
        <TouchableOpacity
          onPress={() => {
            onSave(value.trim());
            setEditing(false);
          }}
          style={{
            backgroundColor: "#f97316",
            borderRadius: 99,
            paddingHorizontal: 14,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setValue(initialNote);
            setEditing(false);
          }}
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 99,
            paddingHorizontal: 14,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: "#6b7280", fontSize: 12 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Individual cart row ──────────────────────────────────────────────────────

function CartRow({ item }: { item: CartItem }) {
  const { dispatch } = useCart();

  function increment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "UPDATE_QUANTITY", itemId: item.itemId, quantity: item.quantity + 1 });
  }

  function decrement() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "UPDATE_QUANTITY", itemId: item.itemId, quantity: item.quantity - 1 });
  }

  function remove() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    dispatch({ type: "REMOVE_ITEM", itemId: item.itemId });
  }

  function saveNote(note: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "UPDATE_NOTE", itemId: item.itemId, note });
  }

  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      {/* Top row: emoji + name + line total */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Emoji */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#fff7ed",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        </View>

        {/* Name + price */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: "#111827", fontWeight: "600", fontSize: 14 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
            ${item.price.toFixed(2)} each
          </Text>
        </View>

        {/* Quantity control */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f9fafb",
            borderRadius: 99,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 6,
            paddingVertical: 4,
            marginRight: 12,
          }}
        >
          <TouchableOpacity
            onPress={decrement}
            style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#ea580c", fontSize: 18, fontWeight: "700", lineHeight: 22 }}>
              −
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#1f2937", fontWeight: "700", fontSize: 14, marginHorizontal: 8 }}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={increment}
            style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#ea580c", fontSize: 18, fontWeight: "700", lineHeight: 22 }}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Line total + remove */}
        <View style={{ alignItems: "flex-end", minWidth: 56 }}>
          <Text style={{ color: "#111827", fontWeight: "700", fontSize: 14 }}>
            ${(item.price * item.quantity).toFixed(2)}
          </Text>
          <TouchableOpacity onPress={remove} style={{ marginTop: 4 }}>
            <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "500" }}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Note chip — shown when a note exists */}
      {item.note ? (
        <View
          style={{
            marginTop: 8,
            alignSelf: "flex-start",
            backgroundColor: "#fff7ed",
            borderRadius: 99,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: "#fed7aa",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 11 }}>📝</Text>
          <Text style={{ color: "#ea580c", fontSize: 12, fontWeight: "500" }}>
            {item.note}
          </Text>
        </View>
      ) : null}

      {/* Inline note editor */}
      <NoteEditor
        itemId={item.itemId}
        initialNote={item.note ?? ""}
        onSave={saveNote}
      />
    </View>
  );
}

// ─── Order success modal ──────────────────────────────────────────────────────

function SuccessModal({
  visible,
  subtotal,
  onClose,
}: {
  visible: boolean;
  subtotal: number;
  onClose: () => void;
}) {
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 32,
            alignItems: "center",
            width: "100%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Text
            style={{
              color: "#1f2937",
              fontWeight: "800",
              fontSize: 22,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Order Placed!
          </Text>
          <Text
            style={{
              color: "#6b7280",
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Your order has been received. Estimated wait time is 20–25 minutes.
          </Text>

          <View
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              padding: 16,
              width: "100%",
              marginTop: 20,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 13 }}>Subtotal</Text>
              <Text style={{ color: "#374151", fontSize: 13 }}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 13 }}>Tax (8.75%)</Text>
              <Text style={{ color: "#374151", fontSize: 13 }}>${tax.toFixed(2)}</Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#e5e7eb",
                paddingTop: 8,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "#111827", fontWeight: "700", fontSize: 15 }}>Total</Text>
              <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 15 }}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 20,
              backgroundColor: "#f97316",
              borderRadius: 99,
              paddingHorizontal: 36,
              paddingVertical: 14,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CartScreen() {
  const { items, subtotal, dispatch } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderSubtotal, setOrderSubtotal] = useState(0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  function handlePlaceOrder() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrderSubtotal(subtotal);
    setShowSuccess(true);
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    dispatch({ type: "CLEAR_CART" });
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item count header */}
        <Text
          style={{
            color: "#9ca3af",
            fontSize: 12,
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          {items.length} item type{items.length !== 1 ? "s" : ""} ·{" "}
          {items.reduce((s, i) => s + i.quantity, 0)} total
        </Text>

        {/* Cart rows */}
        {items.map((item) => (
          <CartRow key={item.itemId} item={item} />
        ))}

        {/* Order summary card */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 8,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "700", fontSize: 15, marginBottom: 12 }}>
            Order Summary
          </Text>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>Subtotal</Text>
              <Text style={{ color: "#374151", fontSize: 14 }}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>Tax (8.75%)</Text>
              <Text style={{ color: "#374151", fontSize: 14 }}>${tax.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>Delivery</Text>
              <Text style={{ color: "#16a34a", fontSize: 14, fontWeight: "600" }}>Free</Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#f3f4f6",
                paddingTop: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "#111827", fontWeight: "700", fontSize: 16 }}>Total</Text>
              <Text style={{ color: "#ea580c", fontWeight: "800", fontSize: 18 }}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Clear cart */}
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            dispatch({ type: "CLEAR_CART" });
          }}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "500" }}>Clear cart</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky place order button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          padding: 16,
          paddingBottom: 28,
        }}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          style={{
            backgroundColor: "#f97316",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            shadowColor: "#f97316",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
            Place Order · ${total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={showSuccess}
        subtotal={orderSubtotal}
        onClose={handleSuccessClose}
      />
    </View>
  );
}
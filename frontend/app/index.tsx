import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  emoji: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Starters", "Mains", "Drinks", "Desserts"];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  spicy:           { bg: "#fee2e2", text: "#b91c1c" },
  vegetarian:      { bg: "#dcfce7", text: "#15803d" },
  popular:         { bg: "#ffedd5", text: "#c2410c" },
  seafood:         { bg: "#dbeafe", text: "#1d4ed8" },
  "gluten-free":   { bg: "#fef9c3", text: "#a16207" },
  healthy:         { bg: "#ccfbf1", text: "#0f766e" },
  chocolate:       { bg: "#fef3c7", text: "#92400e" },
  classic:         { bg: "#ede9fe", text: "#6d28d9" },
  shareable:       { bg: "#fce7f3", text: "#be185d" },
  creamy:          { bg: "#f0fdf4", text: "#166534" },
};

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: 99,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>
        {tag}
      </Text>
    </View>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, dispatch } = useCart();
  const cartItem = items.find((i) => i.itemId === item.id);
  const count = cartItem?.quantity ?? 0;

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({
      type: "ADD_ITEM",
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      quantity: 1,
      emoji: item.emoji,
    });
  }

  function handleDecrement() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({
      type: "UPDATE_QUANTITY",
      itemId: item.id,
      quantity: count - 1,
    });
  }

  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        overflow: "hidden",
      }}
    >
      {/* Emoji header band */}
      <View
        style={{
          backgroundColor: "#fff7ed",
          height: 96,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 52 }}>{item.emoji}</Text>

        {item.tags.includes("popular") && (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "#f97316",
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
              ⭐ Popular
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: 12 }}>
        {/* Name + Price */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <Text
            style={{ color: "#111827", fontWeight: "700", fontSize: 15, flex: 1, paddingRight: 8 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 15 }}>
            ${item.price.toFixed(2)}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={{ color: "#6b7280", fontSize: 12, lineHeight: 17, marginBottom: 8 }}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
          {item.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </View>

        {/* Add / quantity control */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          {count === 0 ? (
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.75}
              style={{
                backgroundColor: "#f97316",
                borderRadius: 99,
                paddingHorizontal: 20,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                Add to cart
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff7ed",
                borderRadius: 99,
                borderWidth: 1,
                borderColor: "#fed7aa",
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <TouchableOpacity
                onPress={handleDecrement}
                style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#ea580c", fontSize: 20, fontWeight: "700", lineHeight: 24 }}>
                  −
                </Text>
              </TouchableOpacity>
              <Text style={{ color: "#c2410c", fontWeight: "700", fontSize: 14, marginHorizontal: 8 }}>
                {count}
              </Text>
              <TouchableOpacity
                onPress={handleAdd}
                style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#ea580c", fontSize: 20, fontWeight: "700", lineHeight: 24 }}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Category Pill ────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: active ? "#f97316" : "#ffffff",
        borderRadius: 99,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: active ? "#f97316" : "#e5e7eb",
      }}
    >
      <Text
        style={{
          color: active ? "#ffffff" : "#6b7280",
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/menu");
      setMenu(res.data.menu);
    } catch {
      setError("Could not load the menu.\nIs the backend running on port 3000?");
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    activeCategory === "All"
      ? menu
      : menu.filter((item) => item.category === activeCategory);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fafb", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: "#9ca3af", marginTop: 12, fontSize: 14 }}>
          Loading menu…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fafb", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15, marginTop: 12, textAlign: "center" }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchMenu}
          style={{ marginTop: 16, backgroundColor: "#f97316", borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Category filter bar */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
          paddingVertical: 12,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveCategory(cat);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Item count label */}
      <Text style={{ color: "#9ca3af", fontSize: 12, paddingHorizontal: 20, paddingVertical: 8 }}>
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </Text>

      {/* Menu list */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 40 }}>🍽️</Text>
          <Text style={{ color: "#374151", fontWeight: "600", fontSize: 16, marginTop: 12 }}>
            Nothing here
          </Text>
          <TouchableOpacity
            onPress={() => setActiveCategory("All")}
            style={{ marginTop: 12, backgroundColor: "#f97316", borderRadius: 99, paddingHorizontal: 20, paddingVertical: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Show all</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MenuItemCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
        />
      )}
    </View>
  );
}

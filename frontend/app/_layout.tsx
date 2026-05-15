import "../global.css";
import { Tabs } from "expo-router";
import { CartProvider, useCart } from "../context/CartContext";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function CartTabIcon({ color, size }: { color: string; size: number }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name="bag-outline" size={size} color={color} />
      {totalItems > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            backgroundColor: "#f97316",
            borderRadius: 8,
            width: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
            {totalItems > 9 ? "9+" : totalItems}
          </Text>
        </View>
      )}
    </View>
  );
}

function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          paddingBottom: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#1f2937",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menu",
          tabBarLabel: "Menu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
          headerTitle: "🍽️  Bistro Menu",
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Order",
          tabBarLabel: "AI Order",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
          headerTitle: "✨ AI Assistant",
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarLabel: "Cart",
          tabBarIcon: ({ color, size }) => (
            <CartTabIcon color={color} size={size} />
          ),
          headerTitle: "🛍️  Your Order",
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <CartProvider>
      <AppTabs />
    </CartProvider>
  );
}
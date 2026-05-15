import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

// ─── Suggested prompts shown at the top of an empty chat ─────────────────────

const SUGGESTIONS = [
  "What's popular here? 🌟",
  "Add 2 spicy chicken sandwiches",
  "I'd like a vegetarian option",
  "What's in my cart?",
  "Add a lemonade and tiramisu",
  "Clear my cart",
];

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginHorizontal: 16,
        marginVertical: 4,
      }}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#fff7ed",
            borderWidth: 1,
            borderColor: "#fed7aa",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 16 }}>🍽️</Text>
        </View>
      )}

      {/* Bubble */}
      <View
        style={{
          maxWidth: "75%",
          backgroundColor: isUser ? "#f97316" : "#ffffff",
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Text
          style={{
            color: isUser ? "#ffffff" : "#1f2937",
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {message.text}
        </Text>
        <Text
          style={{
            color: isUser ? "rgba(255,255,255,0.65)" : "#9ca3af",
            fontSize: 10,
            marginTop: 4,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

// ─── Typing indicator (three animated dots) ───────────────────────────────────

function TypingIndicator() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginVertical: 4,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#fff7ed",
          borderWidth: 1,
          borderColor: "#fed7aa",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
        }}
      >
        <Text style={{ fontSize: 16 }}>🍽️</Text>
      </View>

      {/* Dots bubble */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: "row", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: "#d1d5db",
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Cart action toast shown briefly after AI updates cart ────────────────────

function CartToast({ text }: { text: string }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 90,
        alignSelf: "center",
        backgroundColor: "#1f2937",
        borderRadius: 99,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Text style={{ fontSize: 14 }}>🛍️</Text>
      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>
        {text}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { items, dispatch } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm Bistro, your AI assistant 🍽️ I can help you browse the menu, answer questions, and add items to your cart. What can I get for you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages, loading]);

  // Show toast briefly then hide
  function showToast(text: string) {
    setToastText(text);
    setTimeout(() => setToastText(null), 2500);
  }

  // Apply an action returned by the AI to the cart
  function applyAction(action: any) {
    if (!action) return;

    if (action.type === "BATCH") {
      // For BATCH, apply each sub-action and build a summary toast
      const names = action.actions
        .filter((a: any) => a.type === "ADD_ITEM")
        .map((a: any) => a.itemName)
        .join(", ");
      dispatch(action);
      if (names) showToast(`Added: ${names}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    dispatch(action);

    if (action.type === "ADD_ITEM") {
      showToast(`Added ${action.itemName} to cart`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (action.type === "REMOVE_ITEM") {
      showToast("Item removed from cart");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (action.type === "UPDATE_QUANTITY") {
      showToast("Cart updated");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (action.type === "CLEAR_CART") {
      showToast("Cart cleared");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  async function sendMessage(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await api.post("/chat", {
        message: messageText,
        cartItems: items,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      applyAction(res.data.action);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Sorry, I couldn't connect to the server. Please check your backend is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 90}
    >
      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          showSuggestions ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Try asking...
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => sendMessage(s)}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 99,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#fed7aa",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ea580c",
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* Toast */}
      {toastText && <CartToast text={toastText} />}

      {/* Input bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          gap: 8,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything or order food..."
          placeholderTextColor="#9ca3af"
          multiline
          style={{
            flex: 1,
            backgroundColor: "#f9fafb",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 14,
            color: "#1f2937",
            maxHeight: 100,
          }}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: !input.trim() || loading ? "#e5e7eb" : "#f97316",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={{ fontSize: 18 }}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

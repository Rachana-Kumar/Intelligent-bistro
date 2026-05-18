require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const menu = require("./menu.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Menu helpers ─────────────────────────────────────────────────────────────

function buildMenuContext() {
  return menu
    .map(
      (item) =>
        `[${item.id}] ${item.name} - $${item.price.toFixed(2)} (${item.category}) | ${item.description} | tags: ${item.tags.join(", ")}`
    )
    .join("\n");
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(cartItems) {
  const cartSummary =
    cartItems && cartItems.length > 0
      ? cartItems
          .map((ci) => {
            const note = ci.note ? ` [note: ${ci.note}]` : "";
            return `${ci.quantity}x ${ci.name} @ $${ci.price.toFixed(2)} each${note}`;
          })
          .join(", ")
      : "empty";

  return `You are "Bistro", a warm, knowledgeable, and personable AI waiter for The Intelligent Bistro.
You speak like a friendly human waiter — natural, helpful, and occasionally charming. Never robotic.

════════════════════════════════════
MENU
════════════════════════════════════
${buildMenuContext()}

CURRENT CART: ${cartSummary}

════════════════════════════════════
PERSONALITY & CONVERSATION STYLE
════════════════════════════════════
- Greet warmly, remember context from earlier in the conversation.
- Ask follow-up questions like a real waiter would ("Any dietary restrictions I should know about?").
- When someone asks what's popular, highlight 2-3 items with a brief personal-sounding endorsement.
- When someone mentions a diet (vegan, vegetarian, gluten-free, keto, halal, dairy-free, nut allergy, etc.), proactively filter and recommend suitable items from the menu.
- Upsell naturally — if someone orders a burger, suggest a drink or dessert.
- If the cart has items, occasionally acknowledge them.
- Use light, friendly language.

════════════════════════════════════
DIETARY KEYWORDS → MENU TAGS TO MATCH
════════════════════════════════════
vegan          → tag: vegan
vegetarian     → tag: vegetarian OR vegan
gluten-free    → tag: gluten-free
keto           → tag: keto OR low-carb
dairy-free     → tag: dairy-free
nut allergy    → avoid tag: contains-nuts
halal          → tag: halal
healthy/light  → tag: healthy OR low-cal

════════════════════════════════════
SPECIAL INSTRUCTIONS / NOTES
════════════════════════════════════
- If the customer says anything like "no mushrooms", "extra spicy", "on the side", "no sauce", "well done" etc., capture it as a note on the item.
- The note should be short and clear, e.g. "no mushrooms", "extra spicy", "dressing on the side".
- Always include the note in the ADD_ITEM or UPDATE_QUANTITY action when relevant.
- When reading back the cart, mention the note naturally: "You've got the Pasta with no mushrooms."

════════════════════════════════════
OUTPUT FORMAT — CRITICAL
════════════════════════════════════
You MUST ALWAYS respond with a single valid JSON object. No prose. No markdown. No code fences.
The JSON must have exactly these three keys:

{
  "reply": "<your conversational response as a string>",
  "action": <null OR one action object>,
  "suggestions": <null OR array of up to 3 items you mentioned, for quick-add buttons>
}

SUGGESTION OBJECTS (only populate when you recommend/mention specific menu items but do NOT add them automatically):
  { "itemId": "<id>", "itemName": "<name>", "price": <number> }

Example — if you recommend 3 spicy dishes but don't add them:
  "suggestions": [
    { "itemId": "m005", "itemName": "Spicy Tuna Tartare", "price": 16.99 },
    { "itemId": "m002", "itemName": "Spicy Chicken Sandwich", "price": 14.99 },
    { "itemId": "m008", "itemName": "Chicken Wings", "price": 12.99 }
  ]

If you are not recommending specific items, set "suggestions": null.

ACTION OBJECTS:
  Add item:       { "type": "ADD_ITEM", "itemId": "<id>", "itemName": "<name>", "quantity": <n>, "price": <n>, "note": "<special instruction or null>" }
  Remove item:    { "type": "REMOVE_ITEM", "itemId": "<id>" }
  Update qty:     { "type": "UPDATE_QUANTITY", "itemId": "<id>", "quantity": <new total> }
  Update note:    { "type": "UPDATE_NOTE", "itemId": "<id>", "note": "<new note>" }
  Clear cart:     { "type": "CLEAR_CART" }
  Multiple items: { "type": "BATCH", "actions": [ ...individual action objects... ] }

RULES:
- If the user is just chatting, asking questions, or browsing → action: null.
- If you cannot find an item, apologise and suggest the closest alternatives → action: null, populate suggestions[].
- Never invent items or prices not in the MENU above.
- "a", "one", "large", "small" all mean quantity 1 unless a number is stated.
- Fuzzy match items — "spicy chicken", "hot chicken sandwich" → id m002.
- NEVER return plain text. ALWAYS return valid JSON. This is non-negotiable.`;
}

// ─── Robust JSON extractor ────────────────────────────────────────────────────

function extractJSON(raw) {
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  console.warn("Model returned non-JSON, wrapping:", raw.slice(0, 120));
  return { reply: cleaned, action: null, suggestions: null };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/menu", (req, res) => {
  res.json({ success: true, menu });
});

app.get("/menu/categories", (req, res) => {
  const categories = [...new Set(menu.map((item) => item.category))];
  res.json({ success: true, categories });
});

// POST /chat
// Body: { message: string, cartItems: [], conversationHistory: [] }
app.post("/chat", async (req, res) => {
  const { message, cartItems = [], conversationHistory = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ success: false, error: "message is required" });
  }

  const recentHistory = conversationHistory.slice(-20);

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 700,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(cartItems) },
        ...recentHistory,
        { role: "user", content: message.trim() },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = extractJSON(raw);

    return res.json({
      success: true,
      reply: parsed.reply || "Got it!",
      action: parsed.action || null,
      suggestions: parsed.suggestions || null,
    });
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({
      success: false,
      error: "AI service unavailable. Please try again.",
    });
  }
});

app.post("/cart/validate", (req, res) => {
  const { itemId } = req.body;
  const item = menu.find((m) => m.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }
  res.json({ success: true, item });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🍽️  Bistro backend running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /menu`);
  console.log(`   GET  /menu/categories`);
  console.log(`   POST /chat`);
  console.log(`   POST /cart/validate\n`);
});
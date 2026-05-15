require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const menu = require("./menu.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build a compact menu string to inject into the Claude system prompt
function buildMenuContext() {
  return menu
    .map(
      (item) =>
        `[${item.id}] ${item.name} - $${item.price.toFixed(2)} (${item.category}) | ${item.description} | tags: ${item.tags.join(", ")}`
    )
    .join("\n");
}

// Build the system prompt, injecting the current cart state
function buildSystemPrompt(cartItems) {
  const cartSummary =
    cartItems && cartItems.length > 0
      ? cartItems
          .map(
            (ci) =>
              `${ci.quantity}x ${ci.name} @ $${ci.price.toFixed(2)} each`
          )
          .join(", ")
      : "empty";

  return `You are "Bistro", a warm and helpful AI assistant for The Intelligent Bistro restaurant.
Your job is to help customers browse the menu and manage their order through natural conversation.

MENU:
${buildMenuContext()}

CURRENT CART: ${cartSummary}

INSTRUCTIONS:
- Always respond with a single valid JSON object — no markdown, no code fences, no extra text.
- The JSON must have exactly two keys: "reply" and "action".
- "reply": A friendly, conversational string (1-3 sentences max).
- "action": Either null (if no cart change needed) OR one of these objects:

  Add item:
  { "type": "ADD_ITEM", "itemId": "<id>", "itemName": "<name>", "quantity": <number>, "price": <number> }

  Remove item:
  { "type": "REMOVE_ITEM", "itemId": "<id>" }

  Change quantity:
  { "type": "UPDATE_QUANTITY", "itemId": "<id>", "quantity": <new total> }

  Clear cart:
  { "type": "CLEAR_CART" }

  Multiple changes:
  { "type": "BATCH", "actions": [ ...array of individual action objects... ] }

RULES:
- If asked what is in the cart, read CURRENT CART aloud and set action to null.
- If you cannot find an item on the menu, apologise and suggest alternatives, set action to null.
- Never invent items or prices not in the MENU section.
- "large", "small", "a", "one" all mean quantity 1 unless a number is explicitly given.
- Match items fuzzily — "spicy chicken", "chicken sandwich" both map to id m002.`;
}

// GET /menu — returns the full menu array
app.get("/menu", (req, res) => {
  res.json({ success: true, menu });
});

// GET /menu/categories — returns unique category list
app.get("/menu/categories", (req, res) => {
  const categories = [...new Set(menu.map((item) => item.category))];
  res.json({ success: true, categories });
});

// POST /chat — sends a user message to Claude and returns reply + action
app.post("/chat", async (req, res) => {
  const { message, cartItems = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res
      .status(400)
      .json({ success: false, error: "message is required" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: buildSystemPrompt(cartItems),
      messages: [{ role: "user", content: message.trim() }],
    });

    const raw = response.content[0].text.trim();

    // Strip markdown code fences if Claude wraps them anyway
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse error. Raw response:", raw);
      return res.json({
        success: true,
        reply: "Sorry, I had a hiccup! Could you repeat that?",
        action: null,
      });
    }

    return res.json({
      success: true,
      reply: parsed.reply || "Got it!",
      action: parsed.action || null,
    });
  } catch (err) {
    console.error("Anthropic API error:", err.message);
    return res.status(500).json({
      success: false,
      error: "AI service unavailable. Please try again.",
    });
  }
});

// POST /cart/validate — checks that an itemId exists in the menu
app.post("/cart/validate", (req, res) => {
  const { itemId } = req.body;
  const item = menu.find((m) => m.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }
  res.json({ success: true, item });
});

// GET /health — quick uptime check
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
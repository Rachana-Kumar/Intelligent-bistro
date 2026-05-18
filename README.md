# 🍽️ Intelligent Bistro

> An AI-powered restaurant ordering app where a conversational assistant manages your cart through natural language — built with React Native (Expo) and Node.js.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v20.20.0-green.svg)
![Expo](https://img.shields.io/badge/expo-SDK%2054-black.svg)
![AI](https://img.shields.io/badge/AI-Groq%20llama--3.3--70b-orange.svg)

---

## 📱 Demo

| Menu Screen                                               | AI Chat                                                                     | Cart                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Browse 18 items across 5 categories with category filters | Natural language ordering — "Add 2 spicy chicken sandwiches and a lemonade" | Full order summary with tax calculation and order placement |

---

## ✨ Features

- **Conversational ordering** — type naturally, the AI parses intent and updates the cart
- **Structured JSON responses** — Groq returns typed cart actions (`ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `BATCH`, `CLEAR_CART`)
- **Dual cart control** — cart updates from both the UI buttons and the AI stay in sync via a shared React reducer
- **Category filtering** — horizontal filter pills for Starters, Mains, Drinks, Desserts
- **Haptic feedback** — native haptics on every cart interaction
- **Cart badge** — live item count on the tab bar icon
- **Order summary** — subtotal, tax (8.75%), and total with a confirmation modal
- **Error handling** — graceful fallbacks for network failures on both frontend and backend

---

## 🏗️ Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────┐
│                    EXPO REACT NATIVE APP                  │
│                                                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐  │
│  │ Menu Screen │   │  AI Chat    │   │  Cart Screen    │  │
│  │             │   │  Screen     │   │                 │  │
│  │ • FlatList  │   │ • Messages  │   │ • CartRow items │  │
│  │ • Category  │   │ • TextInput │   │ • Order summary │  │
│  │   filters   │   │ • Typing    │   │ • Place Order   │  │
│  │ • Add/qty   │   │   indicator │   │   modal         │  │
│  │   controls  │   │ • Suggestion│   │                 │  │
│  └──────┬──────┘   │   chips     │   └────────┬────────┘  │
│         │          └──────┬──────┘            │           │
│         │                 │                   │           │
│         └────────┬────────┘                   │           │
│                  │                            │           │
│         ┌────────▼────────────────────────────▼────────┐  │
│         │              CartContext (React Reducer)     │  │
│         │                                              │  │
│         │  dispatch({ type: "ADD_ITEM", ... })         │  │
│         │  dispatch({ type: "REMOVE_ITEM", ... })      │  │
│         │  dispatch({ type: "UPDATE_QUANTITY", ... })  │  │
│         │  dispatch({ type: "BATCH", actions: [...] }) │  │
│         │  dispatch({ type: "CLEAR_CART" })            │  │
│         └──────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────┘
                           │ HTTP (axios)
                           │ POST /chat  { message, cartItems }
                           │ GET  /menu
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   NODE.JS EXPRESS BACKEND                  │
│                                                            │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────┐  │
│  │  GET /menu   │   │  POST /chat   │   │ POST /cart/   │  │
│  │              │   │               │   │   validate    │  │
│  │ Returns full │   │ 1. Build      │   │               │  │
│  │ menu.json    │   │    system     │   │ Validates     │  │
│  │              │   │    prompt     │   │ itemId exists │  │
│  │ GET /menu/   │   │    with menu  │   │ in menu.json  │  │
│  │ categories   │   │    + cart     │   │               │  │
│  │              │   │ 2. Call Groq  │   └───────────────┘  │
│  └──────────────┘   │ 3. Parse JSON │                      │
│                     │ 4. Return     │                      │
│                     │    reply +    │                      │
│                     │    action     │                      │
│                     └──────┬────────┘                      │
└────────────────────────────┼───────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      GROQ CLOUD API                         │
│                                                             │
│  Model: llama-3.3-70b-versatile                             │
│  response_format: { type: "json_object" }                   │
│                                                             │
│  System prompt includes:                                    │
│    • Full menu (id, name, price, category, tags)            │
│    • Current cart state                                     │
│    • Action schema instructions                             │
│    • Fuzzy matching rules                                   │
│                                                             │
│  Returns: { "reply": "...", "action": { ... } }             │
└─────────────────────────────────────────────────────────────┘
```

---

### AI Chat Request / Response Flow

```
User types: "Add 2 spicy chicken sandwiches and a lemonade"
                          │
                          ▼
              ┌──────────────────────┐
              │   ChatScreen.tsx     │
              │                      │
              │  1. Append user msg  │
              │     to local state   │
              │  2. Show typing      │
              │     indicator        │
              │  3. POST /chat with  │
              │     { message,       │
              │       cartItems }    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   backend/index.js   │
              │                      │
              │  buildSystemPrompt() │
              │  ┌─────────────────┐ │
              │  │ MENU:           │ │
              │  │ [m002] Spicy    │ │
              │  │ Chicken...      │ │
              │  │ [d003] Fresh    │ │
              │  │ Lemonade...     │ │
              │  │                 │ │
              │  │ CURRENT CART:   │ │
              │  │ empty           │ │
              │  └─────────────────┘ │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     GROQ API         │
              │                      │
              │  llama-3.3-70b       │
              │  json_object mode    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌───────────────────────────────────────────┐
              │  Groq Response (always valid JSON)        │
              │                                           │
              │  {                                        │
              │    "reply": "Added 2 Spicy Chicken        │
              │     Sandwiches and a Fresh Lemonade!",    │
              │    "action": {                            │
              │      "type": "BATCH",                     │
              │      "actions": [                         │
              │        {                                  │
              │          "type": "ADD_ITEM",              │
              │          "itemId": "m002",                │
              │          "itemName": "Spicy Chicken       │
              │           Sandwich",                      │
              │          "quantity": 2,                   │
              │          "price": 17.99                   │
              │        },                                 │
              │        {                                  │
              │          "type": "ADD_ITEM",              │
              │          "itemId": "d003",                │
              │          "itemName": "Fresh Lemonade",    │
              │          "quantity": 1,                   │
              │          "price": 5.99                    │
              │        }                                  │
              │      ]                                    │
              │    }                                      │
              │  }                                        │
              └──────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   ChatScreen.tsx     │
              │                      │
              │  1. Append AI reply  │
              │     bubble           │
              │  2. applyAction()    │
              │     → dispatch BATCH │
              │       to CartContext │
              │  3. Show toast:      │
              │    "Added: Spicy     │
              │     Chicken..."      │
              │  4. Haptic feedback  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    CartContext       │
              │    (Reducer)         │
              │                      │
              │  BATCH processes     │
              │  each action         │
              │  sequentially →      │
              │  cart now has        │
              │  3 items             │
              │                      │
              │  Tab badge: 3 ↑      │
              └──────────────────────┘
```

---

### Cart State Machine

```
                    ┌─────────────┐
                    │  EMPTY CART │
                    └──────┬──────┘
                           │ ADD_ITEM
                           ▼
                    ┌─────────────┐
              ┌────▶️│  HAS ITEMS  │◀️────┐
              │     └──────┬──────┘     │
              │            │            │
    ADD_ITEM  │    ┌───────┼────────┐   │ ADD_ITEM
  (existing)  │    │       │        │   │ (new item)
              │    ▼       ▼        ▼   │
              │  UPDATE  REMOVE   ADD   │
              │  _QTY    _ITEM    _ITEM─┘
              │    │       │
              │    │  qty=0│
              │    ▼       ▼
              └────────────────▶️ REMOVE (auto)
                           │
                    CLEAR_CART
                           │
                           ▼
                    ┌─────────────┐
                    │  EMPTY CART │
                    └─────────────┘
```

---

### File Structure

```
intelligent-bistro/
│
├── README.md
│
├── backend/                          # Node.js + Express API
│   ├── index.js                      # Main server — all routes + Groq integration
│   ├── menu.json                     # Static menu data (18 items)
│   ├── package.json
│   ├── .env                          # GROQ_API_KEY (not committed)
│   └── .gitignore
│
└── frontend/                         # Expo React Native app
    ├── app.json                      # Expo config — scheme, plugins
    ├── babel.config.js               # NativeWind babel transform
    ├── metro.config.js               # NativeWind metro bundler config
    ├── tailwind.config.js            # Tailwind + brand color tokens
    ├── global.css                    # Tailwind base import
    ├── package.json
    ├── .gitignore
    │
    ├── app/                          # Expo Router — file-based routes
    │   ├── _layout.tsx               # Root layout — tab navigator + CartProvider
    │   ├── index.tsx                 # Tab 1: Menu screen
    │   ├── chat.tsx                  # Tab 2: AI Chat screen
    │   └── cart.tsx                  # Tab 3: Cart screen
    │
    ├── context/
    │   └── CartContext.tsx           # Global cart state — useReducer + Context
    │
    └── lib/
        └── api.ts                    # Axios instance — base URL config
```

---

## 🛠️ Tech Stack

| Layer              | Technology                     | Purpose                                  |
| ------------------ | ------------------------------ | ---------------------------------------- |
| Mobile framework   | Expo SDK 54 + Expo Router      | File-based navigation, native modules    |
| Language           | TypeScript                     | Type-safe cart actions and API responses |
| Styling            | NativeWind v4 + Tailwind CSS   | Utility-first styling in React Native    |
| State management   | React Context + useReducer     | Global cart state shared across all tabs |
| HTTP client        | Axios                          | API calls from frontend to backend       |
| Haptics            | expo-haptics                   | Native touch feedback on cart actions    |
| Backend runtime    | Node.js v20 + Express          | REST API server                          |
| AI model           | Groq — llama-3.3-70b-versatile | Natural language → structured JSON       |
| AI response format | `json_object` mode             | Guarantees valid JSON output every time  |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed before starting:

- Node.js v20+ — `node --version`
- npm v11+ — `npm --version`
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- A free Groq API key from [console.groq.com](https://console.groq.com)

> Your phone and PC must be on the **same WiFi network**.

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/intelligent-bistro.git
cd intelligent-bistro
```

---

### Step 2 — Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```bash
# backend/.env
GROQ_API_KEY=gsk_your_key_here
PORT=3000
```

> Get your free Groq API key at [console.groq.com](https://console.groq.com) → API Keys → Create API Key. The free tier is sufficient for this project.

Start the backend:

```bash
npm run dev
```

You should see:

```
🍽️  Bistro backend running on http://localhost:3000
   GET  /health
   GET  /menu
   GET  /menu/categories
   POST /chat
   POST /cart/validate
```

**Verify it works** — open your browser and navigate to:

```
http://localhost:3000/health
```

Expected: `{ "status": "ok" }`

---

### Step 3 — Find your local IP address

Your phone connects to the backend using your PC's local IP, not `localhost`.

On Windows, open a new terminal and run:

```bash
ipconfig
```

Look for **IPv4 Address** under your active WiFi or Ethernet adapter:

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . : 192.168.1.81   ← copy this
```

---

### Step 4 — Frontend setup

```bash
cd ../frontend
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-haptics expo-font
```

Open `frontend/lib/api.ts` and replace the IP with your own:

```typescript
export const API_BASE = "http://192.168.1.81:3000"; // ← your IP here
```

Start the app:

```bash
npx expo start --clear
```

Scan the QR code with **Expo Go** on your phone. The app will load with the three-tab interface.

---

### Step 5 — Verify the full stack

Open the app on your phone and confirm:

- [ ] Menu tab loads all 18 items
- [ ] Category filter pills work
- [ ] Tapping "Add to cart" increments the cart badge
- [ ] AI Chat tab — type "Add 2 spicy chicken sandwiches" and confirm the cart updates
- [ ] Cart tab shows items with correct totals

---

## 🔌 API Reference

### `GET /health`

Returns server status.

```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

### `GET /menu`

Returns all menu items.

```json
{
  "success": true,
  "menu": [
    {
      "id": "m002",
      "name": "Spicy Chicken Sandwich",
      "description": "Crispy fried chicken thigh...",
      "price": 17.99,
      "category": "Mains",
      "tags": ["spicy", "chicken", "popular"],
      "emoji": "🌶️"
    }
  ]
}
```

### `POST /chat`

Sends a user message to Groq and returns a reply + cart action.

**Request body:**

```json
{
  "message": "Add two spicy chicken sandwiches and a lemonade",
  "cartItems": [
    {
      "itemId": "m001",
      "name": "Wagyu Smash Burger",
      "price": 22.99,
      "quantity": 1
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "reply": "Added 2 Spicy Chicken Sandwiches and a Fresh Lemonade to your cart!",
  "action": {
    "type": "BATCH",
    "actions": [
      {
        "type": "ADD_ITEM",
        "itemId": "m002",
        "itemName": "Spicy Chicken Sandwich",
        "quantity": 2,
        "price": 17.99
      },
      {
        "type": "ADD_ITEM",
        "itemId": "d003",
        "itemName": "Fresh Lemonade",
        "quantity": 1,
        "price": 5.99
      }
    ]
  }
}
```

**Supported action types:**

| Type              | Fields                                    | Effect                               |
| ----------------- | ----------------------------------------- | ------------------------------------ |
| `ADD_ITEM`        | `itemId`, `itemName`, `quantity`, `price` | Adds item or increments quantity     |
| `REMOVE_ITEM`     | `itemId`                                  | Removes item completely              |
| `UPDATE_QUANTITY` | `itemId`, `quantity`                      | Sets exact quantity (0 = remove)     |
| `CLEAR_CART`      | —                                         | Empties the cart                     |
| `BATCH`           | `actions[]`                               | Applies multiple actions in sequence |

### `POST /cart/validate`

Validates that an `itemId` exists in the menu.

**Request body:** `{ "itemId": "m002" }`  
**Response:** `{ "success": true, "item": { ...menuItem } }`

---

## 🤖 AI Integration Details

The Groq API is called with `llama-3.3-70b-versatile` using `response_format: { type: "json_object" }` which guarantees the model always returns valid, parseable JSON — no markdown fences or extra text to strip.

The system prompt injected into every request contains:

1. **Full menu context** — every item's id, name, price, category, description, and tags formatted as a compact string the model can search
2. **Current cart state** — so the model can answer "what's in my cart?" and make relative changes ("make it 3 instead")
3. **Action schema** — exact JSON shape for each action type so the model knows what structure to produce
4. **Fuzzy matching rules** — "spicy chicken", "the sandwich", "chicken sandwich" all resolve to `m002`

**Example system prompt (abbreviated):**

```
You are "Bistro", a warm AI assistant for The Intelligent Bistro.

MENU:
[m002] Spicy Chicken Sandwich - $17.99 (Mains) | Crispy fried chicken thigh... | tags: spicy, chicken, popular
[d003] Fresh Lemonade - $5.99 (Drinks) | Freshly squeezed lemonade... | tags: non-alcoholic, refreshing, popular
...

CURRENT CART: 1x Wagyu Smash Burger @ $22.99 each

Always respond with a single valid JSON object with keys "reply" and "action".
```

---

## 🔑 Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (no credit card required)
3. Click **API Keys → Create API Key**
4. Copy the key and paste it in `backend/.env`
   The free tier is generous enough for development and demos.

---

## 🪲 Common Issues

**"Could not load the menu"**
The frontend can't reach the backend. Check:

- Backend is running (`npm run dev` in the `backend/` folder)
- `lib/api.ts` has your PC's local IPv4 address, not `localhost`
- Phone and PC are on the same WiFi network
- Windows Firewall isn't blocking port 3000 — run this if needed:
  ```bash
  netsh advfirewall firewall add rule name="Node 3000" protocol=TCP dir=in localport=3000 action=allow
  ```

**"Cannot find module 'babel-preset-expo'"**

```bash
npm install babel-preset-expo
npx expo start --clear
```

**"ConfigError: Cannot resolve entry file"**
Open `frontend/package.json` and make sure `main` is set to:

```json
"main": "expo-router/entry"
```

**Version mismatch warnings on `npx expo start`**
Pin the correct versions for SDK 54:

```bash
npm install babel-preset-expo@~54.0.10 react@19.1.0 react-dom@19.1.0 react-native-gesture-handler@~2.28.0 react-native-reanimated@~4.1.1
```

**AI returning invalid JSON**
The `json_object` response format on Groq enforces valid JSON. If you see parse errors, check that your `GROQ_API_KEY` in `.env` is valid and not expired.

---

## 📄 License

MIT — feel free to use this project for learning, demos, or as a starting point for your own app.

---

<p align="center">Built with ☕ and a lot of natural language</p>

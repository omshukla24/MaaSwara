# MaaSwara: A Mother's Voice
**An AI-Powered Multilingual Antenatal Triage Engine for Low-Resource Environments.**

---

## 💡 Inspiration
Every two minutes, a woman dies during pregnancy or childbirth. The vast majority of these deaths occur in low-resource settings and are entirely preventable.

The root cause is often a simple lack of triage: a mother in a rural village experiences a symptom—like a severe headache or swollen hands—and dismisses it as a normal part of pregnancy, not realizing it is a classic sign of preeclampsia. 

**MaaSwara** (meaning "Mother's Voice") was born from a singular mission: what if any mother, regardless of her literacy level, language, or internet connection, could simply *speak* her symptoms and instantly be triaged against WHO clinical guidelines?

## 🧠 What It Does
MaaSwara is a full-stack, multimodal triage platform that bridges the gap between rural mothers and professional healthcare clinics. 

A mother can interact with MaaSwara via a simulated phone call, a text chat, or a low-bandwidth Telegram bot. She speaks in her native tongue. The AI listens, translates, analyzes her symptoms against the 11 WHO Danger Signs of Pregnancy, and assigns a severity tier (`GREEN`, `YELLOW`, or `RED`). 

If a `RED` danger sign is detected (e.g., severe bleeding), the system bypasses standard conversation, issues an immediate emergency directive to the mother, and fires a real-time, geolocated alert directly to the dashboard of the nearest partner clinic.

## 🌍 Multilingual Channels
MaaSwara supports 6 distinct languages natively (English, Hindi, Bhojpuri, Swahili, Yoruba, Hausa) across three accessibility tiers:

| Channel | Bandwidth Requirement | Description |
|---|---|---|
| 🎙️ **Voice Duel** | High | A fully immersive, real-time audio call powered by Gemini's Multimodal Live API. Mothers who cannot read or write simply talk. |
| 💬 **Web Chat** | Medium | A clean, accessible text interface for mothers with standard smartphone access. |
| 📲 **Telegram Bot** | Low / 2G | An extreme low-bandwidth integration (`@MaaSwarabot`). Mothers text the bot on standard 2G connections, bypassing the need to load web assets entirely. |

---

## 🏗️ Architecture

### System Overview
```text
┌──────────────────────────────────────────────┐
│              MaaSwara Interfaces             │
│   Voice Call (PCM16)  │  Web Chat  │  Telegram │
└─────────┬──────────────────┬─────────────┬───┘
          │ (WebSocket)      │ (HTTP)      │ (Webhook)
┌─────────▼──────────────────▼─────────────▼───┐
│              Next.js 14 Backend              │
│       /api/live-token    /api/chat           │
│       /api/telegram/webhook                  │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│        Universal Triage Engine Pipeline      │
│  1. LLM Evaluation (Gemini 2.5 Flash)        │
│  2. JSON Parsing & Validation                │
│  3. Deterministic Safety Net Override        │
└──────┬───────────────────────────────┬───────┘
       │ (If RED / URGENT)             │
┌──────▼───────────────────┐    ┌──────▼───────┐
│  Supabase PostgreSQL     │    │  User Output │
│  INSERT INTO alerts      │    │  (Audio/Text)│
└──────┬───────────────────┘    └──────────────┘
       │ (Realtime Sync)
┌──────▼───────────────────┐
│  Clinic Dashboard        │
│  (Secured via Proxy)     │
└──────────────────────────┘
```

### 🛡️ The Triage Engine Pipeline
The core of MaaSwara is the **Universal Triage Engine**, which processes input from *all* channels. To prevent AI hallucinations in life-or-death medical scenarios, the engine utilizes a dual-layered approach.

#### Layer 1: LLM Evaluation
Input is passed to Gemini 2.5 Flash with a strict `SYSTEM_PROMPT` containing WHO clinical guidelines. The LLM outputs a conversational response alongside a structured JSON block containing:
- `severity`: GREEN | YELLOW | RED
- `signs_detected`: Array of WHO Danger Sign IDs (e.g., `D1`, `D2`)
- `needs_alert`: Boolean

#### Layer 2: The Deterministic Safety Net
LLMs can fail. If a mother says "I am bleeding heavily," but the LLM focuses on her greeting and flags it as `GREEN`, women die. 

MaaSwara intercepts every LLM response and runs the raw conversation transcript through a deterministic, multilingual keyword scanner. 

If any red-flag keyword is detected in any of the 6 supported languages, the system mathematically forces a `RED` severity override.

$$\text{Final Severity} = \max(\text{LLM\_Severity}, \text{Deterministic\_Override})$$

Where severity priority is mathematically defined as: $RED (2) > YELLOW (1) > GREEN (0)$.

---

## 🔐 Security & HIPAA Compliance

Because MaaSwara handles Protected Health Information (PHI), the Clinic Provider Dashboard (`/clinic`) cannot be public.

### Hackathon / Demonstration Setup
For demonstration purposes, the `/clinic` dashboard is protected by a Next.js Edge Proxy (Middleware). Unauthenticated requests are intercepted and redirected to `/clinic/login`. 
- **Demo Password:** `maaswara2026`

### Production Architecture
In a true hospital deployment, the middleware proxy will be replaced with:
1. **SSO Integration:** Clinics authenticate via enterprise Identity Providers (Okta, Auth0) or Supabase Auth.
2. **Row Level Security (RLS):** Every authenticated doctor is assigned a `clinic_id` JWT claim. Supabase RLS policies are strictly enforced at the database level so a clinic can *only* SELECT alerts geofenced to their specific facility (`alerts.clinic_id = auth.jwt().clinic_id`).

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 (App Router), React, CSS Modules, Web Audio API
- **Backend**: Next.js Edge APIs, Node.js
- **Database & Realtime**: Supabase (PostgreSQL + PostGIS for spatial queries)
- **AI Core**: Google Gemini 2.5 Flash, Gemini Multimodal Live API (`v1beta`)
- **Integrations**: Telegram Bot API

---

## ⚔️ Challenges We Conquered

**1. The Web Audio API Context Suspension**
Browsers strictly enforce auto-play policies. When building the Voice Call feature, the `AudioContext` would initialize in a "suspended" state, causing silent failures when Gemini tried to speak. 
*Fix: We built an explicit user-interaction interceptor that forces `audioContext.resume()` upon the first tap of the pulsing orb, before initializing the WebSocket.*

**2. Telegram's Strict Markdown Parser**
When testing the Telegram webhook, emergency `RED` alerts were silently failing to deliver. Telegram's API returned `400 Bad Request`. We discovered that Gemini natively outputs `**bold**` text, which Telegram's standard Markdown parser rejects (requiring `*bold*`). 
*Fix: We stripped the `parse_mode` requirement from the Telegram API client entirely, forcing raw text delivery to guarantee 100% reliability for emergency alerts.*

**3. Next.js Hydration Mismatches**
Browser extensions (like Grammarly) injecting DOM elements into the `<body>` caused catastrophic React hydration failures on the production build.
*Fix: Suppressed hydration warnings on the root layout to maintain stability across diverse user browser environments.*

---

## 🏆 What We Learned

We learned that **accessibility is an architectural decision, not just a UI layer.** 

By abstracting the Triage Engine away from the frontend, we were able to seamlessly plug in a Telegram Bot webhook in less than 50 lines of code. The Telegram user benefits from the exact same LLM context window and deterministic safety net as a user on a high-end smartphone using the Voice AI.

Most importantly, we learned that while Generative AI is incredibly powerful for empathy and translation, it cannot be trusted alone with human lives. The combination of an empathetic LLM conversationalist wrapped in the steel cage of a deterministic safety net is the future of medical AI.

---
*Built for the 2026 Hackathon Season.*

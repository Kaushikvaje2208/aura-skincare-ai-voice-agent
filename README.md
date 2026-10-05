# Aura Skincare — AI Voice CX Agent

DataStraw AI Voice Agent assessment implementation.

## What this project does
- Browser microphone input using Web Speech API (`en-IN`).
- AI customer-support reasoning through the OpenAI Responses API.
- Function calling for `get_order_details(order_id)` against the provided mock orders.
- Brand-policy guardrails for shipping, returns/refunds, cancellation and COD.
- Browser speech output using SpeechSynthesis, preferring an English-India voice when the browser provides one.
- Live transcript and post-call structured JSON summary.
- Visible test-order helper for ORD-101, ORD-102 and ORD-103.

The assignment explicitly allows browser-only operation and says telephony is not required. The supplied requirements also allow the stack/vendor choice. See the assessment PDF for the original requirements.

## Architecture
```text
Microphone
   ↓
Browser Web Speech API (STT)
   ↓ text
Next.js /api/chat
   ↓
OpenAI Responses API + Aria instructions
   ↓ tool call when needed
get_order_details(order_id) → mock order database
   ↓
Natural-language answer
   ↓
Browser SpeechSynthesis (TTS)

Call ends → /api/summary → structured JSON outcome
```

## Why this stack
Next.js keeps the browser UI and secure server-side API routes in one deployable project. Browser speech APIs make the demo easy to run without purchasing telephony or exposing provider secrets to the client. The Responses API provides tool calling so order data is retrieved rather than hallucinated.

## Most difficult part
The main challenge is coordinating a voice interaction with policy enforcement and order lookup while keeping responses short enough to sound natural. The implementation separates the deterministic order database from the model and gives the model explicit rules for when it must call the order tool and when it must refuse or ask for missing information.

## One more week
I would replace browser speech recognition/synthesis with a low-latency realtime speech-to-speech pipeline, add robust barge-in/interruption handling, persistent analytics, automated evaluation tests, and production-grade authentication/rate limiting.

## 1,000 conversations/day
I would move order data to a real database/service, add Redis or another session/cache layer, use async observability and structured logs, add provider retry/fallback logic, rate limits and authentication, monitor latency/cost/error rates, and horizontally scale the application. I would also add automated regression tests for policy and tool-calling behavior.

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Add your OpenAI API key. Change `OPENAI_MODEL` if your account uses another supported model.
4. Run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:3000` in Google Chrome.
6. Allow microphone access.
7. Click **Start Call**.

### Suggested demo prompts
1. "Where is order ORD-101?"
2. "Can I cancel ORD-103?"
3. "I received ORD-102 14 days ago and opened it. Can I return it?"
4. "Can you book me a flight to Goa?"
5. End the call and show the transcript + JSON outcome.

## Deployment
Recommended: Vercel.
- Import this GitHub repository into Vercel.
- Add `OPENAI_API_KEY` and `OPENAI_MODEL` in Vercel Environment Variables.
- Deploy.
- Open the public URL in Chrome and allow microphone access.

Do not commit `.env.local` or your API key.

## Submission checklist
- [ ] Public application URL
- [ ] Public GitHub repository containing source code, README and `.env.example`
- [ ] 3–5 minute demo video
- [ ] Short 2–3 sentence approach note
- [ ] LinkedIn profile URL
- [ ] Email to `ozair.shaikh@datastraw.in` and `aryan.jaiswal@datastraw.in`, CC `talent@datastraw.in`
- [ ] Subject: `AI Voice Agent Assignment - Kaushik Vaje`

## Approach note
Built a browser-first AI voice customer-support agent using Next.js, browser speech APIs and the OpenAI Responses API. The agent uses explicit Aura Skincare policy guardrails and a function-calling tool for deterministic order lookup, then produces a transcript and structured post-call outcome.

# FundSync: AI-Powered Pitch Deck Personalization

FundSync is a high-agency, hyper-personalized automation tool designed for B2B sales, fundraisers, and startup founders. It automates the tedious process of tailoring pitch decks to specific sponsors or partners by leveraging LLMs to align slide content with a target's mission and values.

---

## 🚀 Core Value Proposition

In high-stakes environments, personalization closes deals. FundSync transforms a "Master Deck" into a "Bespoke Pitch" in seconds. It recursively reads slide text, scrapes a target sponsor's website for CSR/technical mandates, and uses Gemini AI to rewrite copy that perfectly aligns with those specific goals.

### Key Flow
1.  **Upload:** Provide a Master Deck (.pptx).
2.  **Scrape:** Input a target Sponsor URL.
3.  **Configure:** Adjust Tone (Formal vs. Creative) and Focus (Technical vs. CSR).
4.  **Propose:** AI generates a "Diff" of proposed text replacements.
5.  **Compile:** System replaces text in the original XML structure of the PowerPoint file.
6.  **Deliver:** Download a ready-to-use, personalized .pptx.

---

## 🛠 Technical Architecture

### Frontend (Next.js 16.3.0-preview)
*   **Framework:** Next.js (App Router) with TypeScript.
*   **Styling:** Tailwind CSS 4 with a "Liquid Glass" / "Editorial Bento" aesthetic.
*   **Animation:** Framer Motion for perpetual micro-interactions.
*   **Auth & Storage:** Supabase (Auth, PostgreSQL, and Storage for decks).
*   **Components:** Custom-built UI using `@base-ui/react` and `shadcn/ui` primitives.

### Backend (FastAPI)
*   **Framework:** FastAPI (Python 3.12).
*   **AI Engine:** 
    *   **Gemini (Google Generative AI):** Maps extracted deck text to sponsor context.
    *   **Firecrawl:** Scrapes sponsor websites into clean Markdown for LLM context.
*   **Document Engine:** 
    *   **python-pptx:** Handles deep recursive XML traversal of `.pptx` files.
    *   **Custom Logic:** Includes run-level replacement (to preserve formatting/hyperlinks) and normalized matching fallback.
*   **Thumbnail Generation:** CloudConvert API integration for secure, asynchronous slide rendering.

---

## 🎨 Design Philosophy: "Cockpit meets Art Gallery"

*   **Palette:** Editorial Anthropic Beige (`#F3EFE7`) with Deep Primary Green (`#269755`) and Neon accents (`#CFEE91`).
*   **Typography:** Strict use of `Geist Sans` and `Geist Mono`.
*   **Surfaces:** Bento 2.0 grids with liquid glass refraction and diffusion shadows.
*   **Vibe:** Deterministic and premium. No generic SaaS gradients or "Stripe-clone" illustrations.

---

## 📁 Repository Structure

```text
/
├── backend/            # FastAPI server, AI logic, and PPTX engine
│   ├── main.py         # API endpoints & Middleware
│   ├── ai_engine.py    # Gemini & Firecrawl integration
│   ├── pptx_engine.py  # Recursive PPTX text replacement logic
│   └── ...
├── frontend/           # Next.js 16 (App Router) application
│   ├── src/app/        # Pages and layouts
│   ├── src/components/ # Bento UI components (AlchemyChamber, AgenticFeed)
│   ├── src/lib/        # Supabase and Utility helpers
│   └── ...
├── supabase/           # Local migration files and RLS security policies
└── DESIGN.md           # Visual style guide and design system rules
```

---

## ⚙️ Setup & Environment

### Environment Variables

**Backend (`backend/.env`):**
*   `GEMINI_API_KEY`: Google AI Studio key.
*   `FIRECRAWL_API_KEY`: For sponsor website scraping.
*   `CLOUDCONVERT_API_KEY`: For PPTX -> PNG thumbnail generation.
*   `NEXT_PUBLIC_SUPABASE_URL`: Supabase project endpoint.
*   `SUPABASE_SERVICE_ROLE_KEY`: Admin key for RLS-bypassing storage operations.

**Frontend (`frontend/.env.local`):**
*   `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Running the Project
1.  **Backend:** `cd backend && uvicorn main:app --reload`
2.  **Frontend:** `cd frontend && npm run dev`
3.  **Supabase:** `supabase start` (requires Docker)

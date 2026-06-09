# Product Requirements Document (PRD)
## Project Name: FundSync
**Document Version:** Resilient MVP with Final Brand Colors (v9)
**Date:** June 10, 2026

---

## 1. Executive Summary
FundSync is an AI-powered document manipulation tool designed to solve a critical bottleneck in B2B event funding: tailoring presentation slides to align with individual corporate sponsors. By automating the research and slide-editing process, the application allows event organizers to scale highly personalized sponsorship outreach without scaling the manual workload.

## 2. Target Audience
* **Primary:** Campus event committees, student organizations, and festival directors who need to secure corporate sponsorships.
* **Secondary:** NGO fundraisers, startup founders, and indie hackers seeking B2B partnerships or investments.

## 3. Problem Statement
Securing funding requires pitch decks that specifically address a target company's Corporate Social Responsibility (CSR) goals, marketing objectives, and brand values. Manually researching each company and rewriting slide narratives for every single pitch is logistically impossible for lean teams managing multiple operational divisions.

## 4. Proposed Solution
A web-based platform where users upload their master pitch deck (in `.pptx` format) and input a target sponsor's URL. The system scrapes the company's website using an intelligent API, feeds this context into a Large Language Model (LLM), and programmatically edits the master presentation. It outputs a customized `.pptx` file seamlessly tailored to the specific sponsor without breaking the original design.

## 5. UI/UX Design System (Premium Utilitarian Minimalism)

The application strictly adheres to an "Anthropic-style" minimalist editorial protocol. 

### 5.1 Color & Typography
*   **Colors:** Warm monochrome (Pale Bone/Off-White backgrounds) paired with off-black text. The core brand accent uses specific custom greens: **#658525** (primary dark accent/text) and **#CFEE91** (light highlight/tag background), used to invoke "funding" while maintaining a premium editorial feel.
*   **Typography:** Editorial serif for headings (`Playfair Display`), clean sans-serif for UI (`Geist Sans`), and monospace for terminal states (`Geist Mono`). No heavy drop shadows; relying entirely on `1px solid #EAEAEA` borders.

### 5.2 Interaction Design
*   **Macro Layout (Centered Stacked Bento):** A strong, editorial serif headline centered at the top. Beneath it, a wide, flat "bento box" houses both the drag-and-drop `.pptx` upload zone and the URL input field in a clean, symmetrical format.
*   **Processing State (Terminal Log):** Upon clicking "Alchemize", the UI rejects generic loading spinners. The bento box transitions into a minimalist monospace text block, outputting a live, step-by-step terminal log (e.g., `> Extracting slides...`).
*   **Success State (Summary Card):** When processing completes, the terminal log dissolves into a crisp, flat summary card displaying exactly what the AI changed (e.g., "14 text strings adapted"). A large, solid-black "Download .pptx" button is presented.

## 6. User Roles & Core Features
### 6.1 User Roles
* **Guest User (MVP):** Uploads decks, inputs URLs, and downloads tailored files instantly.
* **Organizer (Hackathon V2):** Registered user who can save their "Master Decks" and view generation history.

## 7. Technology Stack (Decoupled Architecture)
* **Frontend:** Next.js (App Router) on Vercel. TailwindCSS, Shadcn UI (Customized).
* **Backend:** FastAPI (Python) on Render or Railway.
* **Core Libraries/APIs:** `python-pptx`, Google Gemini API, Firecrawl API.

## 8. Technical Resiliency & Edge Cases (Reality Check)
To ensure the MVP survives a live hackathon demo and robust real-world testing, the backend strictly implements the following fail-safes:
1. **File Size Limit (Memory Protection):** The FastAPI endpoint enforces a strict 15MB file size limit via middleware to prevent out-of-memory errors during processing.
2. **Safe Mode Scraping (Fallback):** If the target sponsor URL actively blocks the Firecrawl API or times out, the backend gracefully catches the error and injects a generic "Tech Sponsor CSR Focus" fallback string. This ensures the Gemini AI still has context and the generation process completes without crashing.
3. **Anti-Corruption Validation:** Before streaming the finished `.pptx` back to the user, the backend attempts to re-parse the newly generated file. This catches any underlying XML corruption caused by LLM text hallucinations, returning a clean server error instead of a broken file.

## 9. User Flow & Data Transfer (MVP)
1.  **Landing:** User arrives at the Centered Stacked Bento UI.
2.  **Upload:** User uploads `Master_Deck.pptx` (under 15MB limit) and inputs target URL.
3.  **Direct File Transfer:** Next.js sends the `.pptx` directly to the FastAPI backend via a `multipart/form-data` POST request.
4.  **Processing (Terminal UI active):** Python API scrapes via Firecrawl (or fallback), Gemini maps replacements, Python executes the edits, and re-validates the file.
5.  **Delivery:** The FastAPI backend streams the modified `.pptx` binary back, the UI transitions to the Success Summary Card, and the user downloads the file.

## 10. Development Roadmap

### Milestone 1: Campus Assignment MVP (Due June 12)
* Initialize Next.js; design the Minimalist Centered Bento, Terminal Loading, and Success Card UI using brand colors.
* Build the FastAPI Python service. Integrate Firecrawl and Gemini APIs with reality check fail-safes.
* Build the `python-pptx` text replacement logic.
* Finalize the guest flow and record the assignment demo video.

### Milestone 2: Hackathon Upgrade (Due June 19)
* Integrate Supabase Auth and PostgreSQL for saved generation history.

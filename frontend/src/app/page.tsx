"use client";

import { useState, useEffect } from "react";
import { 
  Upload, 
  Link2, 
  Sparkles, 
  Download, 
  Check, 
  Lock, 
  Sliders, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  UserPlus 
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/Dashboard";
import { AlchemyChamber } from "@/components/AlchemyChamber";

// Framer Motion configuration variants
const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

export default function Home() {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App / Personalization state
  const [appState, setAppState] = useState<"idle" | "fetching" | "alchemy" | "compiling" | "success">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  
  // Tonal states
  const [toneFormal, setToneFormal] = useState(50);
  const [toneTechnical, setToneTechnical] = useState(50);
  const [customFocus, setCustomFocus] = useState("");
  const [isTonePanelOpen, setIsTonePanelOpen] = useState(false);

  // Proposed changes cache
  const [proposedReplacements, setProposedReplacements] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [scrapedContext, setScrapedContext] = useState("");

  // Result Metrics
  const [replacementsCount, setReplacementsCount] = useState(0);
  const [slidesModifiedCount, setSlidesModifiedCount] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [logStage, setLogStage] = useState(0);

  // Load user session
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Auth check error, running in local fallback guest mode.", err);
      } finally {
        setAuthLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Animate log stages during backend communication
  useEffect(() => {
    if (appState === "fetching") {
      setLogStage(0);
      const timers = [
        setTimeout(() => setLogStage(1), 1000),
        setTimeout(() => setLogStage(2), 2500),
        setTimeout(() => setLogStage(3), 4000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [appState]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("Successfully logged out of workspace.");
    } catch (err: any) {
      toast.error(err.message || "Failed to logout.");
    }
  };

  // Phase 1: Propose replacements
  const handleProposeReplacements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !url) return;
    
    setAppState("fetching");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_url", url);
    formData.append("tone_formal", String(toneFormal));
    formData.append("tone_technical", String(toneTechnical));
    formData.append("custom_focus", customFocus);

    try {
      const response = await fetch("http://localhost:8000/api/propose-replacements", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Error processing replacements.";
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch {
          try {
            errMsg = await response.text() || errMsg;
          } catch {}
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setProposedReplacements(data.proposed_replacements);
      setSessionId(data.session_id);
      setScrapedContext(data.sponsor_context);
      setAppState("alchemy");

    } catch (error: any) {
      console.error("Propose replacements failed:", error);
      toast.error(error.message || "Failed to contact AI. Please verify that the FastAPI backend is running.");
      setAppState("idle");
    }
  };

  // Phase 2: Compile final presentation
  const handleCompileDeck = async (finalReplacements: Record<string, string>) => {
    setAppState("compiling");

    try {
      const response = await fetch("http://localhost:8000/api/compile-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          replacements: finalReplacements
        })
      });

      if (!response.ok) {
        throw new Error("Failed to compile deck. Session may have expired.");
      }

      const count = response.headers.get("X-Replacements-Count") || "0";
      setReplacementsCount(parseInt(count, 10));

      const slidesCount = response.headers.get("X-Slides-Modified") || "0";
      setSlidesModifiedCount(parseInt(slidesCount, 10));

      const blob = await response.blob();
      const tempDownloadUrl = window.URL.createObjectURL(blob);
      
      setDownloadUrl(tempDownloadUrl);
      setAppState("success");

    } catch (error: any) {
      console.error("Compile failed:", error);
      toast.error(error.message || "Error compiling file. Please try again.");
      setAppState("alchemy");
    }
  };

  const resetState = () => {
    setAppState("idle");
    setFile(null);
    setUrl("");
    setDownloadUrl(null);
    setReplacementsCount(0);
    setSlidesModifiedCount(0);
    setProposedReplacements({});
    setSessionId("");
    setCustomFocus("");
    setToneFormal(50);
    setToneTechnical(50);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-[#476501] animate-spin mb-4" />
        <span className="font-mono text-xs text-[#757968] tracking-widest uppercase">
          Loading secure workspace...
        </span>
      </div>
    );
  }

  // Auth gate render
  if (user) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A]">
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#EAEAEA] bg-[#FBFBFA]/80 backdrop-blur-md sticky top-0 z-50">
          <div 
            onClick={resetState}
            className="font-serif font-bold text-2xl text-[#476501] cursor-pointer hover:opacity-85 transition-opacity" 
            style={{ fontFamily: "var(--font-playfair-display), serif" }}
          >
            FundSync
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-[#476501]/10 text-[#476501] font-mono text-[10px] font-bold px-2 py-1 tracking-wider uppercase rounded-sm">
              Member Workspace
            </span>
          </div>
        </header>
        <Dashboard user={user} onLogout={handleLogout} />
      </div>
    );
  }

  // Guest flow render
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A] selection:bg-[#CFEE91] selection:text-[#476501]">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#EAEAEA]">
        <div 
          onClick={resetState}
          className="font-serif font-bold text-2xl text-[#476501] cursor-pointer hover:opacity-85 transition-opacity" 
          style={{ fontFamily: "var(--font-playfair-display), serif" }}
        >
          FundSync
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#44493a]">
          <Link href="/about" className="hover:text-[#476501] transition-colors">About</Link>
        </nav>
        <Link href="/auth">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            className="bg-[#476501] hover:bg-[#5f7f1f] text-white px-6 py-2.5 rounded-sm transition-colors text-sm font-medium focus:outline-none flex items-center gap-2 shadow-sm font-mono text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" /> MEMBER SIGN IN
          </motion.button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center pt-12 px-4 pb-24 max-w-[1200px] w-full mx-auto">
        <AnimatePresence mode="wait">
          {/* STATE: IDLE (GUEST FORM) */}
          {appState === "idle" && (
            <motion.div 
              key="idle"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer}
              className="w-full max-w-[1000px] flex flex-col items-center"
            >
              <motion.h1 
                variants={fadeInUpVariants}
                className="text-[54px] font-serif font-bold tracking-tight mb-4 text-[#111111] text-center leading-[1.1]" 
                style={{ fontFamily: "var(--font-playfair-display), serif" }}
              >
                Sync your outreach.
              </motion.h1>
              
              <motion.p 
                variants={fadeInUpVariants}
                className="text-[#44493A] text-md mb-12 max-w-[550px] text-center leading-relaxed"
              >
                Transform standard pitch decks into targeted, hyper-personalized sponsor communications in seconds using dynamic tonal alignment.
              </motion.p>

              <motion.div 
                variants={fadeInUpVariants}
                className="w-full grid grid-cols-1 md:grid-cols-2 bg-white border border-[#EAEAEA] shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[420px]"
              >
                {/* Left: Upload */}
                <motion.div 
                  whileHover={{ backgroundColor: "#FBFBFA" }}
                  className="border-r border-[#EAEAEA] flex flex-col items-center justify-center p-12 bg-[#FBFBFA]/50 relative group cursor-pointer transition-colors"
                >
                  <input 
                    type="file" 
                    accept=".pptx"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-[#F0EFEA] rounded-xl flex items-center justify-center mb-6">
                    <Upload className="w-6 h-6 text-[#757968]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>Drop Pitch Deck</h3>
                  <p className="text-[#757968] text-center mb-6 text-sm max-w-[240px] leading-relaxed">
                    Upload your master .pptx template here to begin synthesis.
                  </p>
                  <div className="bg-[#EAE8E0] text-[#757968] font-mono text-xs px-3 py-1 rounded tracking-wider uppercase">
                    {file ? file.name : "MAX 15MB"}
                  </div>
                </motion.div>

                {/* Right: URL & Submit Form */}
                <form onSubmit={handleProposeReplacements} className="p-12 flex flex-col h-full justify-between space-y-6">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-4 text-xs font-mono tracking-widest text-[#757968] uppercase">
                        Target Sponsor Intel
                      </div>
                      <div className="relative border-b border-[#EAEAEA] pb-3 flex items-center gap-4 group-focus-within:border-[#476501] transition-colors">
                        <Link2 className="w-5 h-5 text-[#757968]" strokeWidth={1.5} />
                        <input
                          type="url"
                          placeholder="https://sponsor-website.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          required
                          className="w-full outline-none bg-transparent placeholder-[#B0B0A8] text-[#111111] text-md"
                        />
                      </div>
                    </div>

                    {/* Collapsible Tonal Alignment panel inside guest flow */}
                    <div className="border border-[#EAEAEA] p-4 rounded-sm bg-[#FBFBFA]/30">
                      <button
                        type="button"
                        onClick={() => setIsTonePanelOpen(!isTonePanelOpen)}
                        className="w-full flex items-center justify-between text-[11px] font-mono tracking-widest text-[#757968] uppercase font-bold focus:outline-none"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4" />
                          Tonal Alignment sliders
                        </span>
                        {isTonePanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isTonePanelOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-4 mt-4 border-t border-[#EAEAEA] space-y-4"
                        >
                          {/* Tone Sliders */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-[#757968]">Creative</span>
                              <span className="font-bold text-[#111111]">
                                {toneFormal < 35 ? "Narrative" : toneFormal > 65 ? "Corporate" : "Balanced"}
                              </span>
                              <span className="text-[#757968]">Formal</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={toneFormal}
                              onChange={(e) => setToneFormal(parseInt(e.target.value, 10))}
                              className="w-full h-1 bg-[#F0EFEA] rounded-lg appearance-none cursor-pointer accent-[#476501]"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-[#757968]">CSR / Community</span>
                              <span className="font-bold text-[#111111]">
                                {toneTechnical < 35 ? "Social" : toneTechnical > 65 ? "Tech" : "Balanced"}
                              </span>
                              <span className="text-[#757968]">Technical</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={toneTechnical}
                              onChange={(e) => setToneTechnical(parseInt(e.target.value, 10))}
                              className="w-full h-1 bg-[#F0EFEA] rounded-lg appearance-none cursor-pointer accent-[#476501]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-[#757968] tracking-widest uppercase block">
                              Custom directive
                            </label>
                            <textarea
                              placeholder="Focus alignment directives here..."
                              value={customFocus}
                              onChange={(e) => setCustomFocus(e.target.value)}
                              rows={2}
                              className="w-full p-2 bg-white border border-[#EAEAEA] text-xs text-[#111111] focus:border-[#476501] outline-none resize-none font-sans"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={!file || !url}
                    className="w-full bg-[#1A1C15] text-white h-16 flex items-center justify-center gap-3 hover:bg-[#2F3129] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-serif text-2xl tracking-wide" style={{ fontFamily: "var(--font-playfair-display), serif" }}>Sync Pitch</span>
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                  </motion.button>
                </form>
              </motion.div>
              
              <motion.div 
                variants={fadeInUpVariants}
                className="mt-8 text-xs font-mono text-[#757968] flex items-center gap-2 tracking-widest uppercase"
              >
                <Lock className="w-3.5 h-3.5" />
                Local browser encryption on guest resources.
              </motion.div>
            </motion.div>
          )}

          {/* STATE: FETCHING PROPOSALS (MODERN STEPPER LOADING CIRCLES) */}
          {appState === "fetching" && (
            <motion.div 
              key="fetching"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-[650px] flex flex-col items-center py-12"
            >
              {/* Spinning Circular Progress */}
              <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                {/* Outer spin ring */}
                <div className="absolute w-full h-full rounded-full border-4 border-[#EAEAEA] border-t-[#476501] animate-spin" />
                {/* Inner pulse circle */}
                <div className="absolute w-20 h-20 rounded-full bg-[#CFEE91]/20 animate-pulse flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#476501]" />
                </div>
              </div>

              <h2 className="text-3xl font-serif font-bold tracking-tight mb-2 text-[#111111] text-center" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                Personalizing Pitch
              </h2>
              <p className="text-[#757968] mb-12 text-center text-sm font-mono max-w-[420px]">
                {logStage === 0 && "Decomposing slide paragraph layers recursively..."}
                {logStage === 1 && "Scraping target sponsor context data via Firecrawl..."}
                {logStage >= 2 && "Synthesizing copies using Gemini tone controls..."}
              </p>

              {/* Progress Stepper */}
              <div className="w-full bg-white border border-[#EAEAEA] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] rounded-sm space-y-6 text-left">
                {/* Step 1: Text extraction */}
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    logStage >= 1 
                      ? "bg-[#476501] text-white" 
                      : "border-2 border-[#476501] text-[#476501] animate-pulse"
                  }`}>
                    {logStage >= 1 ? "✓" : "1"}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${logStage >= 1 ? "text-[#111111]" : "text-[#476501]"}`}>
                      Extract Presentation Copy
                    </h4>
                    <p className="text-xs text-[#757968] mt-0.5">
                      Recurse through shapes, tables, and grouped boxes.
                    </p>
                  </div>
                </div>

                {/* Step 2: Firecrawl scraping */}
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    logStage >= 2 
                      ? "bg-[#476501] text-white" 
                      : logStage === 1
                        ? "border-2 border-[#476501] text-[#476501] animate-pulse"
                        : "border-2 border-[#EAEAEA] text-[#B0B0A8]"
                  }`}>
                    {logStage >= 2 ? "✓" : "2"}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${
                      logStage >= 2 ? "text-[#111111]" : logStage === 1 ? "text-[#476501]" : "text-[#B0B0A8]"
                    }`}>
                      Scrape Target Sponsor
                    </h4>
                    <p className="text-xs text-[#757968] mt-0.5">
                      Scan URL context parameters for values and mandates.
                    </p>
                  </div>
                </div>

                {/* Step 3: Gemini copywriting */}
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    logStage >= 3 
                      ? "bg-[#476501] text-white" 
                      : logStage >= 2
                        ? "border-2 border-[#476501] text-[#476501] animate-pulse"
                        : "border-2 border-[#EAEAEA] text-[#B0B0A8]"
                  }`}>
                    {logStage >= 3 ? "✓" : "3"}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${
                      logStage >= 3 ? "text-[#111111]" : logStage >= 2 ? "text-[#476501]" : "text-[#B0B0A8]"
                    }`}>
                      Gemini Tonal Synthesis
                    </h4>
                    <p className="text-xs text-[#757968] mt-0.5">
                      Apply copywriting guidelines and output modifications mapping.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE: ALCHEMY CHAMBER (DIFF EDITOR REVIEW) */}
          {appState === "alchemy" && (
            <motion.div
              key="alchemy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[1000px]"
            >
              <AlchemyChamber
                proposedReplacements={proposedReplacements}
                scrapedContext={scrapedContext}
                onCancel={resetState}
                onCompile={handleCompileDeck}
              />
            </motion.div>
          )}

          {/* STATE: COMPILING PITCH DECK */}
          {appState === "compiling" && (
            <motion.div
              key="compiling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <Loader2 className="w-12 h-12 text-[#476501] animate-spin mb-4" />
              <h3 className="text-2xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                Injecting customized variables and compiling...
              </h3>
              <p className="text-[#757968] text-xs font-mono">
                Ensuring PPTX structure is uncorrupted and format fonts match.
              </p>
            </motion.div>
          )}

          {/* STATE: SUCCESS DOWNLOAD SCREEN */}
          {appState === "success" && (
            <motion.div 
              key="success"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer}
              className="w-full max-w-[700px] bg-white border border-[#EAEAEA] p-16 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <motion.div 
                variants={fadeInUpVariants}
                className="w-16 h-16 bg-[#CFEE91] rounded-xl flex items-center justify-center mb-8"
              >
                <Check className="w-8 h-8 text-[#476501]" strokeWidth={2.5} />
              </motion.div>
              
              <motion.h1 
                variants={fadeInUpVariants}
                className="text-5xl font-serif font-bold tracking-tight mb-4 text-[#111111]" 
                style={{ fontFamily: "var(--font-playfair-display), serif" }}
              >
                Pitch Personalization Complete.
              </motion.h1>
              
              <motion.p 
                variants={fadeInUpVariants}
                className="text-[#44493A] text-md mb-12 text-center max-w-[480px] leading-relaxed"
              >
                Your pitch deck has been recursively aligned. Download the customized file below.
              </motion.p>

              <motion.div 
                variants={fadeInUpVariants}
                className="w-full grid grid-cols-2 gap-4 mb-12"
              >
                <div className="border border-[#EAEAEA] p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-serif font-bold mb-2 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>{replacementsCount}</div>
                  <div className="text-[10px] font-mono text-[#757968] tracking-widest uppercase">Text Strings Adapted</div>
                </div>
                <div className="border border-[#EAEAEA] p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-serif font-bold mb-2 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>{slidesModifiedCount}</div>
                  <div className="text-[10px] font-mono text-[#757968] tracking-widest uppercase">Slides Modified</div>
                </div>
              </motion.div>

              <motion.a 
                variants={fadeInUpVariants}
                whileTap={{ scale: 0.97 }}
                href={downloadUrl || "#"}
                download={`FundSync_Personalized_Pitch.pptx`}
                className="w-full max-w-[400px] bg-[#2F3129] text-white h-14 flex items-center justify-center gap-3 hover:bg-[#1A1C15] transition-colors mb-8 rounded-sm font-sans font-medium text-lg"
              >
                <Download className="w-5 h-5" strokeWidth={2} />
                <span>Download Personalized PPTX</span>
              </motion.a>
              
              <motion.button 
                variants={fadeInUpVariants}
                whileTap={{ scale: 0.97 }}
                onClick={resetState}
                className="text-[#476501] font-mono text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Start New Session
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      {(appState === "idle" || appState === "success") && (
        <footer className="w-full px-12 py-8 border-t border-[#EAEAEA] flex flex-col md:flex-row items-center justify-between font-mono text-xs text-[#111111] font-bold bg-[#FBFBFA]/30">
          <div>© 2026 FundSync. All rights reserved.</div>
          <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium text-[#757968]">
            <Link href="/about" className="hover:text-[#111111] transition-colors">About</Link>
            <a href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Terms of Service</a>
          </div>
        </footer>
      )}
    </div>
  );
}

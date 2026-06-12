"use client";

import Image from "next/image";
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
  UserPlus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/Dashboard";
import { AlchemyChamber } from "@/components/AlchemyChamber";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";

// Premium Spring Physics
const springTransition: Transition = { type: "spring", stiffness: 300, damping: 30 };
const fastSpring: Transition = { type: "spring", stiffness: 400, damping: 25 };

// Framer Motion staggered orchestration
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
  exit: { 
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: springTransition
  },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } }
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
  const [processingFileUrl, setProcessingFileUrl] = useState("");
  const [processingFileName, setProcessingFileName] = useState("");

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
        setTimeout(() => setLogStage(1), 1200),
        setTimeout(() => setLogStage(2), 2800),
        setTimeout(() => setLogStage(3), 4500),
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
    setProcessingFileName(file.name);
    
    try {
      // 1. Upload guest file securely via backend
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadRes = await fetch(`/api/upload-guest`, { method: "POST", body: uploadData });
      
      if (!uploadRes.ok) {
        let err = "Failed to upload demo file.";
        try { const d = await uploadRes.json(); err = d.detail || err; } catch {}
        throw new Error(err);
      }
      
      const { file_url } = await uploadRes.json();
      setProcessingFileUrl(file_url);

      // 2. Synthesize replacements
      const response = await fetch(`/api/propose-replacements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: file_url,
          target_url: url,
          tone_formal: toneFormal,
          tone_technical: toneTechnical,
          custom_focus: customFocus
        })
      });

      if (!response.ok) {
        let errMsg = "Error processing replacements.";
        try {
          const errData = await response.json();
          errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setProposedReplacements(data.proposed_replacements);
      setSessionId(data.session_id);
      setScrapedContext(data.sponsor_context);
      setAppState("alchemy");

    } catch (error: any) {
      console.error("Propose replacements failed:", error);
      toast.error(error.message || "Failed to contact AI. Please verify backend is running.");
      setAppState("idle");
    }
  };

  // Phase 2: Compile final presentation
  const handleCompileDeck = async (finalReplacements: Record<string, string>) => {
    setAppState("compiling");

    try {
      const response = await fetch(`/api/compile-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          file_url: processingFileUrl,
          original_filename: processingFileName,
          replacements: finalReplacements
        })
      });

      if (!response.ok) {
        throw new Error("Failed to compile deck. Session may have expired.");
      }

      const responseData = await response.json();
      
      setReplacementsCount(responseData.replacements_count || 0);
      setSlidesModifiedCount(responseData.slides_modified || 0);
      setDownloadUrl(responseData.download_url);
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
    setProcessingFileUrl("");
    setProcessingFileName("");
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#F3EFE7] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin mb-6" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase"
        >
          Securing Workspace
        </motion.div>
      </div>
    );
  }

  // Auth gate render
  if (user) {
    return (
      <div className="min-h-[100dvh] bg-[#F3EFE7] flex flex-col font-sans text-zinc-900 selection:bg-emerald-200 selection:text-emerald-950">
        <header className="w-full flex items-center justify-between px-6 lg:px-12 py-5 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div 
            onClick={resetState}
            className="font-bold text-xl tracking-tight text-zinc-950 cursor-pointer flex items-center gap-2 group" 
          >
            <Image src="/FundSync_Logo.svg" alt="FundSync Logo" width={48} height={48} className="transition-transform group-hover:scale-95" />
            FundSync
          </div>

        </header>
        <Dashboard user={user} onLogout={handleLogout} />
      </div>
    );
  }

  // Guest flow render
  return (
    <div className="min-h-[100dvh] bg-[#F3EFE7] flex flex-col font-sans text-zinc-900 selection:bg-emerald-200 selection:text-emerald-950 relative overflow-hidden">
      
      <AmbientBackground />

      <header className="w-full flex items-center justify-between px-6 lg:px-12 py-6 relative z-50">
        <div 
          onClick={resetState}
          className="font-bold text-xl tracking-tight text-zinc-950 cursor-pointer flex items-center gap-2 group" 
        >
          <Image src="/FundSync_Logo.svg" alt="FundSync Logo" width={48} height={48} className="transition-transform group-hover:scale-95 group-active:scale-90" />
          FundSync
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="font-mono text-[11px] font-semibold tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors uppercase hidden sm:block">
            About
          </Link>
          <Link href="/auth">
            <MagneticButton 
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-full transition-all text-[11px] font-mono font-semibold tracking-widest flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-zinc-800"
            >
              WORKSPACE <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto relative z-10 px-4 py-12">
        <AnimatePresence mode="wait">
          
          {/* STATE: IDLE (Asymmetric Split Screen) */}
          {appState === "idle" && (
            <motion.div 
              key="idle"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={staggerContainer}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
            >
              {/* Left Column: Typography */}
              <div className="col-span-1 lg:col-span-6 flex flex-col justify-center lg:pr-12">

                <motion.h1 
                  variants={fadeInUp}
                  className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tighter mb-6 text-zinc-950 leading-[0.95]" 
                >
                  Sync your pitch <br/>
                  <span className="text-zinc-400">in seconds.</span>
                </motion.h1>
                
                <motion.p 
                  variants={fadeInUp}
                  className="text-zinc-500 text-lg sm:text-xl max-w-[500px] leading-relaxed font-light"
                >
                  Transform standard pitch decks into targeted, deeply aligned sponsor communications using contextual AI extraction.
                </motion.p>

              </div>

              {/* Right Column: Liquid Glass Upload Widget */}
              <motion.div variants={fadeInUp} className="col-span-1 lg:col-span-6 flex justify-center lg:justify-end w-full">
                <div className="w-full max-w-[540px] bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_48px_-12px_rgba(0,0,0,0.08)] rounded-[2rem] p-2 relative">
                  
                  {/* Subtle inner gradient */}
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                  <form onSubmit={handleProposeReplacements} className="bg-white/80 rounded-[1.75rem] border border-zinc-100 p-8 relative flex flex-col space-y-8">
                    
                    {/* Drag & Drop Zone */}
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".pptx"
                        required
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <motion.div 
                        whileHover={{ scale: 0.99, backgroundColor: "#f4f4f5" }}
                        transition={fastSpring}
                        className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                          file ? "border-[#269755]/30 bg-[#CFEE91]/40/50" : "border-zinc-200 bg-zinc-50/50 group-hover:border-zinc-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${file ? 'bg-[#CFEE91] text-[#269755]' : 'bg-white shadow-sm text-zinc-400'}`}>
                          {file ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-mono font-medium text-zinc-600 truncate max-w-[80%]">
                          {file ? file.name : "Drop Master .pptx here"}
                        </span>
                      </motion.div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold px-1">Target Sponsor URL</label>
                      <div className="relative flex items-center focus-within:ring-2 focus-within:ring-[#269755]/20 rounded-xl overflow-hidden transition-all shadow-sm border border-zinc-200 bg-white">
                        <div className="pl-4 pr-2">
                          <Link2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://sponsor-website.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          required
                          className="w-full h-12 outline-none bg-transparent placeholder-zinc-300 text-sm font-medium text-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Collapsible Tone Panel */}
                    <div className="bg-zinc-50/80 border border-zinc-100 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsTonePanelOpen(!isTonePanelOpen)}
                        className="w-full h-12 px-4 flex items-center justify-between text-xs font-semibold text-zinc-600 focus:outline-none"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                          Alignment Parameters
                        </span>
                        <motion.div animate={{ rotate: isTonePanelOpen ? 180 : 0 }} transition={fastSpring}>
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isTonePanelOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={springTransition}
                            className="px-4 pb-5 space-y-5"
                          >
                            <div className="h-px w-full bg-zinc-200/60 mb-2" />
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-medium">
                                <span>Creative</span>
                                <span className="text-zinc-900 font-bold">
                                  {toneFormal < 35 ? "Narrative" : toneFormal > 65 ? "Corporate" : "Balanced"}
                                </span>
                                <span>Formal</span>
                              </div>
                              <input
                                type="range" min="0" max="100" value={toneFormal}
                                onChange={(e) => setToneFormal(parseInt(e.target.value, 10))}
                                className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-medium">
                                <span>Social / CSR</span>
                                <span className="text-zinc-900 font-bold">
                                  {toneTechnical < 35 ? "Impact" : toneTechnical > 65 ? "Tech" : "Balanced"}
                                </span>
                                <span>Technical</span>
                              </div>
                              <input
                                type="range" min="0" max="100" value={toneTechnical}
                                onChange={(e) => setToneTechnical(parseInt(e.target.value, 10))}
                                className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900"
                              />
                            </div>
                            <div className="space-y-2 pt-1">
                              <textarea
                                placeholder="Custom directives (e.g., 'Focus on open source')..."
                                value={customFocus}
                                onChange={(e) => setCustomFocus(e.target.value)}
                                rows={2}
                                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none resize-none shadow-sm transition-all"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Submit */}
                    <MagneticButton 
                      type="submit"
                      disabled={!file || !url}
                      className="w-full bg-zinc-950 text-white h-14 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                    >
                      <span className="text-sm font-semibold tracking-wide">Synthesize Pitch</span>
                      <Sparkles className="w-4 h-4" />
                    </MagneticButton>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 tracking-widest uppercase mt-4">
                      <Lock className="w-3 h-3" /> Encrypted Processing
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* STATE: FETCHING PROPOSALS (Staggered Waterfall Loaders) */}
          {appState === "fetching" && (
            <motion.div 
              key="fetching"
              initial="hidden" animate="visible" exit="exit" variants={staggerContainer}
              className="w-full max-w-2xl flex flex-col items-center py-20"
            >
              <motion.div variants={fadeInUp} className="relative w-24 h-24 mb-12 flex items-center justify-center">
                <div className="absolute w-full h-full rounded-full border border-zinc-200 border-t-zinc-900 animate-spin" style={{ animationDuration: '2s' }} />
                <div className="absolute w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-zinc-900 animate-pulse" />
                </div>
              </motion.div>

              <motion.h2 variants={fadeInUp} className="text-2xl font-bold tracking-tight mb-12 text-zinc-900 text-center">
                Personalizing presentation layers...
              </motion.h2>

              <div className="w-full space-y-4 text-left">
                {[
                  { step: 1, title: "Extract Presentation Copy", desc: "Recursively traversing shapes and table structures." },
                  { step: 2, title: "Scrape Target Context", desc: "Analyzing sponsor URL for CSR and structural goals." },
                  { step: 3, title: "Tonal Synthesis", desc: "Gemini generating layout-constrained replacements." }
                ].map((item, idx) => {
                  const isActive = logStage >= item.step;
                  const isCurrent = logStage === item.step - 1;
                  return (
                    <motion.div 
                      key={item.step} variants={fadeInUp} 
                      className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-700 ${
                        isActive ? "bg-white border-zinc-200 shadow-sm" : 
                        isCurrent ? "bg-zinc-50 border-zinc-200" : "bg-transparent border-transparent opacity-40"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-700 ${
                        isActive ? "bg-zinc-900 text-white" : isCurrent ? "border border-zinc-300 text-zinc-500" : "border border-zinc-200 text-zinc-300"
                      }`}>
                        {isActive ? <Check className="w-3 h-3" /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-zinc-400 animate-ping' : 'bg-zinc-300'}`} />}
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold transition-colors duration-700 ${isActive ? "text-zinc-900" : isCurrent ? "text-zinc-700" : "text-zinc-400"}`}>
                          {item.title}
                        </h4>
                        <p className={`text-xs mt-1 transition-colors duration-700 ${isActive || isCurrent ? "text-zinc-500" : "text-zinc-400"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.p variants={fadeInUp} className="mt-8 text-xs text-zinc-400 font-mono text-center max-w-sm">
                *Depending on the length of your presentation, AI synthesis may take up to 60 seconds to complete. Please do not close this window.
              </motion.p>
            </motion.div>
          )}

          {/* STATE: ALCHEMY CHAMBER */}
          {appState === "alchemy" && (
            <motion.div key="alchemy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={springTransition} className="w-full max-w-[1200px]">
              <AlchemyChamber proposedReplacements={proposedReplacements} scrapedContext={scrapedContext} onCancel={resetState} onCompile={handleCompileDeck} />
            </motion.div>
          )}

          {/* STATE: COMPILING PITCH DECK */}
          {appState === "compiling" && (
            <motion.div key="compiling" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="flex flex-col items-center justify-center py-32">
              <motion.div variants={fadeInUp} className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-8 shadow-sm">
                <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
              </motion.div>
              <motion.h3 variants={fadeInUp} className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Injecting variables and compiling...
              </motion.h3>
              <motion.p variants={fadeInUp} className="text-zinc-400 text-xs font-mono tracking-wide">
                Executing anti-corruption XML checks
              </motion.p>
            </motion.div>
          )}

          {/* STATE: SUCCESS */}
          {appState === "success" && (
            <motion.div key="success" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="w-full max-w-2xl bg-white border border-zinc-200/60 rounded-[2.5rem] p-12 lg:p-16 flex flex-col items-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#CFEE91]/40/30 to-transparent pointer-events-none" />
              
              <motion.div variants={fadeInUp} className="w-16 h-16 bg-[#CFEE91] rounded-2xl flex items-center justify-center mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                <Check className="w-7 h-7 text-[#269755]" strokeWidth={2.5} />
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-zinc-900 relative z-10">
                Synthesis Complete
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-zinc-500 text-sm mb-12 max-w-md relative z-10">
                Your pitch deck has been recursively aligned with the target sponsor. Ready for download.
              </motion.p>

              <motion.div variants={fadeInUp} className="w-full grid grid-cols-2 gap-4 mb-10 relative z-10">
                <div className="bg-zinc-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-100">
                  <div className="text-3xl font-bold mb-1 text-zinc-900">{replacementsCount}</div>
                  <div className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Strings Adapted</div>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-100">
                  <div className="text-3xl font-bold mb-1 text-zinc-900">{slidesModifiedCount}</div>
                  <div className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Slides Modified</div>
                </div>
              </motion.div>

              <motion.a 
                variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={fastSpring}
                href={downloadUrl || "#"} download={`FundSync_Personalized_Pitch.pptx`}
                className="w-full bg-zinc-950 text-white h-14 flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors mb-6 rounded-xl font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.1)] relative z-10"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                <span>Download .pptx</span>
              </motion.a>
              
              <motion.button variants={fadeInUp} whileHover={{ opacity: 0.7 }} onClick={resetState} className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest transition-opacity relative z-10">
                Start New Session
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      {(appState === "idle" || appState === "success") && (
        <footer className="w-full px-6 lg:px-12 py-8 border-t border-zinc-200/60 flex items-center justify-center font-mono text-[10px] text-zinc-400 font-medium relative z-50">
          <div>© 2026 FundSync. All rights reserved.</div>
        </footer>
      )}
    </div>
  );
}
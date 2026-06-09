"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Link as LinkIcon, Download, Terminal, ArrowRight, FileText } from "lucide-react";

export default function Home() {
  const [appState, setAppState] = useState<"idle" | "processing" | "success">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [replacementsCount, setReplacementsCount] = useState(0);

  // Terminal log animation simulation state
  const [logStage, setLogStage] = useState(0);

  useEffect(() => {
    if (appState === "processing") {
      setLogStage(0);
      const timers = [
        setTimeout(() => setLogStage(1), 800),
        setTimeout(() => setLogStage(2), 1800),
        setTimeout(() => setLogStage(3), 3000),
        setTimeout(() => {
          setReplacementsCount(14); // mock value for Phase 4 UI testing
          setAppState("success");
        }, 4500)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [appState]);

  const handleSimulateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !url) return;
    setAppState("processing");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-secondary selection:text-secondary-foreground">
      {/* Editorial Headline */}
      <div className="text-center mb-12 max-w-2xl mt-8">
        <h1 className="text-5xl md:text-6xl font-serif text-foreground tracking-tight mb-4" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
          FundSync
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-sans font-light max-w-lg mx-auto leading-relaxed">
          Tailor your master pitch decks for specific corporate sponsors using context-aware AI.
        </p>
      </div>

      {/* Main Interaction Bento */}
      <div className="w-full max-w-xl bg-card border border-border rounded-[var(--radius)] overflow-hidden transition-all duration-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* STATE: IDLE (Upload & URL) */}
        {appState === "idle" && (
          <form onSubmit={handleSimulateProcess} className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold font-sans text-foreground uppercase tracking-wider text-xs">Target Sponsor URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input 
                  type="url" 
                  required
                  placeholder="https://company.com/csr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-input/20 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors font-sans text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold font-sans text-foreground uppercase tracking-wider text-xs">Master Pitch Deck (.pptx)</label>
              <div className="relative border border-dashed border-input rounded-md p-10 hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-input/5">
                <input 
                  type="file" 
                  accept=".pptx"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                {file ? (
                  <span className="font-sans text-sm font-medium text-primary bg-secondary px-4 py-1.5 rounded-full">
                    {file.name}
                  </span>
                ) : (
                  <span className="font-sans text-sm text-muted-foreground text-center">
                    Drag and drop your deck here, or click to browse.
                  </span>
                )}
              </div>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full bg-primary text-primary-foreground font-sans font-medium py-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Alchemize Deck <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STATE: PROCESSING (Terminal Log) */}
        {appState === "processing" && (
          <div className="p-8 bg-foreground text-background min-h-[400px] flex flex-col font-mono text-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-6 opacity-50 border-b border-background/20 pb-4 text-xs tracking-widest uppercase">
              <Terminal className="h-4 w-4" />
              <span>FundSync Core Engine v1.0</span>
            </div>
            <div className="flex flex-col gap-4 flex-1 mt-2">
              <p className="animate-pulse">{">"} Initializing secure environment...</p>
              {logStage >= 1 && <p className="animate-in fade-in slide-in-from-bottom-2 duration-300">{">"} Extracting presentation nodes from Master Deck...</p>}
              {logStage >= 2 && <p className="animate-in fade-in slide-in-from-bottom-2 duration-300">{">"} Scraping contextual CSR directives from sponsor URL...</p>}
              {logStage >= 3 && <p className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-secondary">{">"} Mapping Gemini semantic replacements. Recompiling XML layer...</p>}
            </div>
          </div>
        )}

        {/* STATE: SUCCESS (Summary Card) */}
        {appState === "success" && (
          <div className="p-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mb-6">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-serif text-foreground mb-3" style={{ fontFamily: "var(--font-playfair-display), serif" }}>Deck Alchemized!</h2>
            <p className="text-muted-foreground font-sans mb-10 text-lg max-w-sm">
              We successfully mapped <strong className="text-foreground font-medium">{replacementsCount} text occurrences</strong> seamlessly into the presentation.
            </p>
            
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => {
                  setAppState("idle");
                  setFile(null);
                  setUrl("");
                }}
                className="w-full bg-foreground text-background font-sans font-medium py-4 rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="h-4 w-4" /> Download Tailored .pptx
              </button>
              <button 
                onClick={() => {
                  setAppState("idle");
                  setFile(null);
                  setUrl("");
                }}
                className="w-full bg-transparent border border-border text-foreground font-sans font-medium py-3 rounded-md hover:bg-muted transition-colors"
              >
                Start Another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

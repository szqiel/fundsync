"use client";

import { useState, useEffect } from "react";
import { Upload, Link2, Sparkles, Download, Check, Lock } from "lucide-react";

export default function Home() {
  const [appState, setAppState] = useState<"idle" | "processing" | "success">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [replacementsCount, setReplacementsCount] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [logStage, setLogStage] = useState(0);

  useEffect(() => {
    if (appState === "processing") {
      setLogStage(0);
      const timers = [
        setTimeout(() => setLogStage(1), 1500),
        setTimeout(() => setLogStage(2), 3500),
        setTimeout(() => setLogStage(3), 6000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [appState]);

  const handleProcessDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !url) return;
    
    setAppState("processing");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_url", url);

    try {
      const response = await fetch("http://localhost:8000/api/process-deck", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Read custom header from FastAPI for metrics display
      const count = response.headers.get("X-Replacements-Count") || "0";
      setReplacementsCount(parseInt(count, 10));

      // Parse returning blob to make it downloadable
      const blob = await response.blob();
      const tempDownloadUrl = window.URL.createObjectURL(blob);
      
      setDownloadUrl(tempDownloadUrl);
      setAppState("success");

    } catch (error) {
      console.error("Processing failed:", error);
      alert("Error processing deck. Please check if the FastAPI backend is running.");
      setAppState("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A] selection:bg-[#CFEE91] selection:text-[#476501]">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#EAEAEA]">
        <div className="font-serif font-bold text-2xl text-[#476501]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>FundSync</div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#44493a]">
          <a href="#" className="hover:text-[#476501] transition-colors">About</a>
        </nav>
        <button className="bg-[#476501] text-white px-6 py-2.5 rounded hover:bg-[#5f7f1f] transition-colors text-sm font-medium">
          Get Started
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center pt-20 px-4 pb-24">
        {/* STATE: IDLE */}
        {appState === "idle" && (
          <div className="w-full max-w-[1000px] flex flex-col items-center animate-in fade-in duration-500">
            <h1 className="text-[56px] font-serif font-bold tracking-tight mb-4 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
              Sync your outreach.
            </h1>
            <p className="text-[#44493A] text-lg mb-16 max-w-[600px] text-center leading-relaxed">
              Transform standard pitch decks into targeted, hyper-personalized sponsor communications in seconds.
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 bg-white border border-[#EAEAEA] shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[400px]">
              {/* Left: Upload */}
              <div className="border-r border-[#EAEAEA] flex flex-col items-center justify-center p-12 bg-[#FBFBFA]/50 relative group cursor-pointer hover:bg-[#F9F9F8] transition-colors">
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
                <p className="text-[#757968] text-center mb-6 text-sm max-w-[240px]">
                  Upload your master .pptx file here to begin synthesis.
                </p>
                <div className="bg-[#EAE8E0] text-[#757968] font-mono text-xs px-3 py-1 rounded tracking-wider uppercase">
                  {file ? file.name : "MAX 15MB"}
                </div>
              </div>

              {/* Right: URL & Submit */}
              <form onSubmit={handleProcessDeck} className="p-12 flex flex-col h-full">
                <div className="mb-8 text-xs font-mono tracking-widest text-[#757968] uppercase">
                  Target Sponsor Intel
                </div>
                <div className="relative border-b border-[#EAEAEA] mb-8 pb-4 flex items-center gap-4 group-focus-within:border-[#476501] transition-colors">
                  <Link2 className="w-5 h-5 text-[#757968]" strokeWidth={1.5} />
                  <input
                    type="url"
                    placeholder="https://sponsor-website.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full outline-none bg-transparent placeholder-[#B0B0A8] text-[#111111] text-lg"
                  />
                </div>
                <p className="text-[#757968] text-sm leading-relaxed mb-auto">
                  Provide the target sponsor's primary URL. Our engine will extract mandate data, investment theses, and tonal alignment parameters.
                </p>
                <button 
                  type="submit"
                  disabled={!file || !url}
                  className="w-full bg-[#1A1C15] text-white h-16 mt-8 flex items-center justify-center gap-3 hover:bg-[#2F3129] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-serif text-2xl tracking-wide" style={{ fontFamily: "var(--font-playfair-display), serif" }}>Sync</span>
                  <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </form>
            </div>
            
            <div className="mt-8 text-xs font-mono text-[#757968] flex items-center gap-2 tracking-widest uppercase">
              <Lock className="w-3.5 h-3.5" />
              Enterprise-grade encryption on all uploaded assets.
            </div>
          </div>
        )}

        {/* STATE: PROCESSING */}
        {appState === "processing" && (
          <div className="w-full max-w-[800px] flex flex-col items-center animate-in fade-in duration-500">
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
              Processing Generation
            </h1>
            <p className="text-[#44493A] mb-12 text-center">
              Please wait while we sync and compile your resources.
            </p>

            <div className="w-full bg-[#2F3129] rounded-lg overflow-hidden shadow-2xl border border-[#44493A]">
              <div className="h-10 bg-[#1A1C15] flex items-center px-4 gap-2 border-b border-[#2F3129] relative">
                <div className="w-3 h-3 rounded-full bg-[#ED6A5E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#F4BF4F]"></div>
                <div className="w-3 h-3 rounded-full bg-[#61C554]"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-mono text-xs text-[#757968]">fundsync_process_v2.4.sh</span>
                </div>
              </div>
              <div className="p-8 min-h-[400px] font-mono text-[13px] text-[#EAE8E0] flex flex-col gap-4 leading-relaxed">
                <p className="opacity-100">{">"} Initializing secure synthesis engine...</p>
                {logStage >= 1 && <p className="animate-in fade-in slide-in-from-bottom-1">{">"} Extracting semantic vectors from master presentation...</p>}
                {logStage >= 2 && <p className="animate-in fade-in slide-in-from-bottom-1">{">"} Scraping target CSR mandate and structural goals...</p>}
                {logStage >= 3 && <p className="animate-in fade-in slide-in-from-bottom-1 text-[#CFEE91]">{">"} Gemini synthesis complete. Patching XML layers...</p>}
                
                <div className="mt-auto flex gap-3 items-center text-[#CFEE91]">
                  <span>{">"}</span>
                  <span className="w-2.5 h-[18px] bg-[#CFEE91] animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE: SUCCESS */}
        {appState === "success" && (
          <div className="w-full max-w-[700px] bg-white border border-[#EAEAEA] p-16 flex flex-col items-center animate-in zoom-in-95 duration-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="w-16 h-16 bg-[#CFEE91] rounded-xl flex items-center justify-center mb-8">
              <Check className="w-8 h-8 text-[#476501]" strokeWidth={2.5} />
            </div>
            
            <h1 className="text-5xl font-serif font-bold tracking-tight mb-4 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
              Personalization Complete.
            </h1>
            <p className="text-[#44493A] text-lg mb-12 text-center max-w-[480px] leading-relaxed">
              Your presentation has been successfully adapted. Review the summary of changes below.
            </p>

            <div className="w-full grid grid-cols-3 gap-3 mb-12">
              <div className="border border-[#EAEAEA] p-8 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-serif font-bold mb-3 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>{replacementsCount}</div>
                <div className="text-[10px] font-mono text-[#757968] tracking-widest uppercase leading-loose">Text Strings<br/>Adapted</div>
              </div>
              <div className="border border-[#EAEAEA] bg-[#F4F4E8] p-8 flex flex-col items-center justify-center text-center">
                <div className="text-[#476501] mb-3">
                  <Sparkles className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <div className="text-[10px] font-mono text-[#476501] tracking-widest uppercase leading-loose">Brand Colors<br/>Matched<br/>To Sponsor</div>
              </div>
              <div className="border border-[#EAEAEA] p-8 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-serif font-bold mb-3 text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>3</div>
                <div className="text-[10px] font-mono text-[#757968] tracking-widest uppercase leading-loose">Slides<br/>Modified</div>
              </div>
            </div>

            <a 
              href={downloadUrl || "#"}
              download={`FundSync_${file?.name || "Targeted_Deck.pptx"}`}
              className="w-full max-w-[400px] bg-[#2F3129] text-white h-14 flex items-center justify-center gap-3 hover:bg-[#1A1C15] transition-colors mb-8 rounded-md"
            >
              <Download className="w-5 h-5" strokeWidth={2} />
              <span className="font-sans font-medium text-lg">Download .pptx</span>
            </a>
            
            <button 
              onClick={() => {
                setAppState("idle");
                setFile(null);
                setUrl("");
                setDownloadUrl(null);
              }}
              className="text-[#476501] font-mono text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
      
      {/* Footer */}
      {(appState === "idle" || appState === "success") && (
        <footer className="w-full px-12 py-8 border-t border-[#EAEAEA] flex flex-col md:flex-row items-center justify-between font-mono text-xs text-[#111111] font-bold">
          <div>© 2024 FundSync AI. All rights reserved.</div>
          <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium text-[#757968]">
            <a href="#" className="hover:text-[#111111] transition-colors">About</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Contact</a>
          </div>
        </footer>
      )}
    </div>
  );
}

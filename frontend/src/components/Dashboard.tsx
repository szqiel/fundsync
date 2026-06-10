"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  Database, 
  History, 
  Sparkles, 
  LogOut, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Globe, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Check, 
  Plus, 
  Sliders, 
  HelpCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { AlchemyChamber } from "./AlchemyChamber";

interface Deck {
  id: string;
  name: string;
  storage_path: string;
  created_at: string;
  size?: string;
}

interface Sponsor {
  id: string;
  name: string;
  website_url: string;
  dossier_context: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  deck_name: string;
  sponsor_name: string;
  replacements_count: number;
  slides_modified: number;
  created_at: string;
}

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"studio" | "decks" | "sponsors" | "history">("studio");
  
  // Data States
  const [decks, setDecks] = useState<Deck[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Studio States
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [isTonePanelOpen, setIsTonePanelOpen] = useState(false);
  const [toneFormal, setToneFormal] = useState(50);
  const [toneTechnical, setToneTechnical] = useState(50);
  const [customFocus, setCustomFocus] = useState("");

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<"idle" | "fetching" | "alchemy" | "compiling" | "success">("idle");
  const [logStage, setLogStage] = useState(0);
  const [proposedReplacements, setProposedReplacements] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [scrapedContext, setScrapedContext] = useState("");
  const [replacementsCount, setReplacementsCount] = useState(0);
  const [slidesModifiedCount, setSlidesModifiedCount] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Search & Filter
  const [sponsorSearch, setSponsorSearch] = useState("");
  const [expandedSponsorId, setExpandedSponsorId] = useState<string | null>(null);

  // File Upload State
  const [isUploadingDeck, setIsUploadingDeck] = useState(false);

  // Check if Supabase is actually configured or if we are in Mock fallback mode
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_supabase_url_here");

  // Load Initial Data
  useEffect(() => {
    fetchDecks();
    fetchSponsors();
    fetchHistory();
  }, []);

  // Sync log stages during backend communication
  useEffect(() => {
    if (processingState === "fetching") {
      setLogStage(0);
      const timers = [
        setTimeout(() => setLogStage(1), 1000),
        setTimeout(() => setLogStage(2), 2500),
        setTimeout(() => setLogStage(3), 4000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [processingState]);

  // DB Fetching Functions with localStorage fallback
  const fetchDecks = async () => {
    if (isMockMode) {
      const stored = localStorage.getItem(`mock_decks_${user.id}`);
      if (stored) {
        setDecks(JSON.parse(stored));
      } else {
        const defaultDecks = [
          { id: "d1", name: "Sponsorship_Master_2026.pptx", storage_path: "mock/d1.pptx", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), size: "4.2 MB" },
          { id: "d2", name: "FundSync_Standard_Pitch.pptx", storage_path: "mock/d2.pptx", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), size: "2.8 MB" }
        ];
        localStorage.setItem(`mock_decks_${user.id}`, JSON.stringify(defaultDecks));
        setDecks(defaultDecks);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("decks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDecks(data || []);
    } catch (err: any) {
      console.error("Error fetching decks:", err);
      toast.error("Failed to load decks from Database.");
    }
  };

  const fetchSponsors = async () => {
    if (isMockMode) {
      const stored = localStorage.getItem(`mock_sponsors_${user.id}`);
      if (stored) {
        setSponsors(JSON.parse(stored));
      } else {
        const defaultSponsors = [
          { 
            id: "s1", 
            name: "Stripe", 
            website_url: "https://stripe.com", 
            dossier_context: "Stripe Developer CSR Focus: Committed to carbon removal technologies (Frontier climate), open-source developer toolkits, supporting underrepresented founders, and digital payments infrastructure scalability.", 
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() 
          },
          { 
            id: "s2", 
            name: "Vercel", 
            website_url: "https://vercel.com", 
            dossier_context: "Vercel Sponsorship Focus: Prioritizes front-end optimization, web core vitals improvement, supporting student developers, frameworks advancement (Next.js, React), and open source toolings.", 
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() 
          }
        ];
        localStorage.setItem(`mock_sponsors_${user.id}`, JSON.stringify(defaultSponsors));
        setSponsors(defaultSponsors);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSponsors(data || []);
    } catch (err: any) {
      console.error("Error fetching sponsors:", err);
    }
  };

  const fetchHistory = async () => {
    if (isMockMode) {
      const stored = localStorage.getItem(`mock_history_${user.id}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        const defaultHistory = [
          { id: "h1", deck_name: "Sponsorship_Master_2026.pptx", sponsor_name: "Stripe", replacements_count: 8, slides_modified: 4, created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
          { id: "h2", deck_name: "FundSync_Standard_Pitch.pptx", sponsor_name: "Vercel", replacements_count: 12, slides_modified: 6, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.8).toISOString() }
        ];
        localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(defaultHistory));
        setHistory(defaultHistory);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from("generation_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error("Error fetching history:", err);
    }
  };

  // Add items with DB / Mock persistence
  const handleUploadDeck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pptx")) {
      toast.error("Only .pptx presentations are allowed.");
      return;
    }

    setIsUploadingDeck(true);
    const deckId = Math.random().toString(36).substring(2, 9);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    if (isMockMode) {
      setTimeout(() => {
        const newDeck: Deck = {
          id: deckId,
          name: file.name,
          storage_path: `mock/${deckId}.pptx`,
          created_at: new Date().toISOString(),
          size: sizeStr
        };
        const updated = [newDeck, ...decks];
        setDecks(updated);
        localStorage.setItem(`mock_decks_${user.id}`, JSON.stringify(updated));
        toast.success(`Deck "${file.name}" uploaded successfully (Local Sandbox).`);
        setIsUploadingDeck(false);
      }, 1500);
      return;
    }

    try {
      // Upload to Supabase Storage
      const storagePath = `${user.id}/${deckId}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("master-decks")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Save row to decks table
      const { error: dbError } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          name: file.name,
          storage_path: storagePath
        });

      if (dbError) throw dbError;

      toast.success(`Deck "${file.name}" uploaded to Cloud Storage.`);
      fetchDecks();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload presentation.");
    } finally {
      setIsUploadingDeck(false);
    }
  };

  const handleDeleteDeck = async (id: string, storagePath: string, name: string) => {
    if (isMockMode) {
      const updated = decks.filter(d => d.id !== id);
      setDecks(updated);
      localStorage.setItem(`mock_decks_${user.id}`, JSON.stringify(updated));
      toast.success(`Deck "${name}" deleted.`);
      if (selectedDeckId === id) setSelectedDeckId("");
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("master-decks")
        .remove([storagePath]);
      if (storageError) console.error("Storage delete fail, continuing...", storageError);

      // Delete from table
      const { error: dbError } = await supabase
        .from("decks")
        .delete()
        .eq("id", id);
      if (dbError) throw dbError;

      toast.success(`Deck "${name}" deleted.`);
      if (selectedDeckId === id) setSelectedDeckId("");
      fetchDecks();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete deck.");
    }
  };

  // Phase 1: Propose Replacements
  const handleProposeReplacements = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate we have a file source
    let fileToProcess: File | Blob | null = null;
    let selectedDeckName = "";
    
    if (customFile) {
      fileToProcess = customFile;
      selectedDeckName = customFile.name;
    } else if (selectedDeckId) {
      const deck = decks.find(d => d.id === selectedDeckId);
      if (deck) {
        selectedDeckName = deck.name;
        // In live mode, we fetch from Storage. In Mock mode, we create a dummy blob for endpoint.
        if (isMockMode) {
          // Send a tiny valid zip mock structure or plain blob
          fileToProcess = new Blob(["mock_pptx_content"], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
        } else {
          try {
            const { data, error } = await supabase.storage
              .from("master-decks")
              .download(deck.storage_path);
            if (error) throw error;
            fileToProcess = data;
          } catch (err) {
            console.error(err);
            toast.error("Failed to fetch presentation from Cloud Storage.");
            return;
          }
        }
      }
    }

    if (!fileToProcess || !targetUrl) {
      toast.error("Please provide a pitch deck and a target website URL.");
      return;
    }

    setIsProcessing(true);
    setProcessingState("fetching");

    const formData = new FormData();
    // In live mode, send filename if possible
    formData.append("file", fileToProcess, selectedDeckName || "presentation.pptx");
    formData.append("target_url", targetUrl);
    formData.append("tone_formal", String(toneFormal));
    formData.append("tone_technical", String(toneTechnical));
    formData.append("custom_focus", customFocus);

    try {
      const response = await fetch("http://localhost:8000/api/propose-replacements", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorText = "Error communicating with AI engine.";
        try {
          const errData = await response.json();
          errorText = errData.detail || errorText;
        } catch {
          try {
            errorText = await response.text() || errorText;
          } catch {}
        }
        throw new Error(errorText);
      }

      const data = await response.json();
      setProposedReplacements(data.proposed_replacements);
      setSessionId(data.session_id);
      setScrapedContext(data.sponsor_context);
      
      // Auto-save the scraped dossier to Sponsors Database CRM
      saveSponsorToCRM(targetUrl, data.sponsor_context);

      setProcessingState("alchemy");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to propose replacements. Make sure the FastAPI server is running on port 8000.");
      setIsProcessing(false);
      setProcessingState("idle");
    }
  };

  // Helper to save sponsor to DB CRM
  const saveSponsorToCRM = async (url: string, context: string) => {
    let hostname = "Target Sponsor";
    try {
      hostname = new URL(url).hostname.replace("www.", "");
      // Capitalize first letter
      hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1).split(".")[0];
    } catch {}

    // Avoid duplicating sponsor if already exists
    const duplicate = sponsors.find(s => s.website_url === url);
    if (duplicate) return;

    if (isMockMode) {
      const newSponsor: Sponsor = {
        id: Math.random().toString(36).substring(2, 9),
        name: hostname,
        website_url: url,
        dossier_context: context,
        created_at: new Date().toISOString()
      };
      const updated = [newSponsor, ...sponsors];
      setSponsors(updated);
      localStorage.setItem(`mock_sponsors_${user.id}`, JSON.stringify(updated));
      return;
    }

    try {
      await supabase
        .from("sponsors")
        .insert({
          user_id: user.id,
          name: hostname,
          website_url: url,
          dossier_context: context
        });
      fetchSponsors();
    } catch (err) {
      console.error("Error saving sponsor to CRM:", err);
    }
  };

  // Phase 2: Compile Deck
  const handleCompileDeck = async (finalReplacements: Record<string, string>) => {
    setProcessingState("compiling");

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
        throw new Error("Failed to compile final deck. Cache might have expired.");
      }

      // Read metrics headers
      const replacementsCountHeader = response.headers.get("X-Replacements-Count") || "0";
      const slidesModifiedHeader = response.headers.get("X-Slides-Modified") || "0";
      
      setReplacementsCount(parseInt(replacementsCountHeader, 10));
      setSlidesModifiedCount(parseInt(slidesModifiedHeader, 10));

      const blob = await response.blob();
      const tempDownloadUrl = window.URL.createObjectURL(blob);
      setDownloadUrl(tempDownloadUrl);

      // Save to History Log
      let selectedDeckName = "Custom_Upload.pptx";
      if (customFile) {
        selectedDeckName = customFile.name;
      } else if (selectedDeckId) {
        const deck = decks.find(d => d.id === selectedDeckId);
        if (deck) selectedDeckName = deck.name;
      }

      let hostname = "Target Sponsor";
      try {
        hostname = new URL(targetUrl).hostname.replace("www.", "");
        hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1).split(".")[0];
      } catch {}

      saveHistoryItem(selectedDeckName, hostname, parseInt(replacementsCountHeader, 10), parseInt(slidesModifiedHeader, 10));

      setProcessingState("success");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to compile presentation.");
      setProcessingState("alchemy");
    }
  };

  const saveHistoryItem = async (deckName: string, sponsorName: string, repCount: number, slideCount: number) => {
    if (isMockMode) {
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        deck_name: deckName,
        sponsor_name: sponsorName,
        replacements_count: repCount,
        slides_modified: slideCount,
        created_at: new Date().toISOString()
      };
      const updated = [newItem, ...history];
      setHistory(updated);
      localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(updated));
      return;
    }

    try {
      await supabase
        .from("generation_history")
        .insert({
          user_id: user.id,
          deck_name: deckName,
          sponsor_name: sponsorName,
          replacements_count: repCount,
          slides_modified: slideCount
        });
      fetchHistory();
    } catch (err) {
      console.error("Error saving history log:", err);
    }
  };

  const resetProcessingState = () => {
    setIsProcessing(false);
    setProcessingState("idle");
    setCustomFile(null);
    setTargetUrl("");
    setProposedReplacements({});
    setSessionId("");
    setDownloadUrl(null);
    setReplacementsCount(0);
    setSlidesModifiedCount(0);
  };

  // Filtered Sponsors
  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
    s.website_url.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
    (s.dossier_context && s.dossier_context.toLowerCase().includes(sponsorSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-89px)] bg-[#F9F8F6]">
      {/* Sidebar Workspace Navigation */}
      <aside className="w-full md:w-64 border-r border-[#EAEAEA] bg-[#FBFBFA]/60 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#757968] uppercase mb-4">
              Sync Workspace
            </div>
            <nav className="space-y-1.5">
              <button
                onClick={() => { setActiveTab("studio"); resetProcessingState(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "studio"
                    ? "bg-[#476501]/10 text-[#476501] border-l-2 border-[#476501]"
                    : "text-[#757968] hover:text-[#111111] hover:bg-[#EAEAEA]/40"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Personalization Studio
              </button>

              <button
                onClick={() => { setActiveTab("decks"); resetProcessingState(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "decks"
                    ? "bg-[#476501]/10 text-[#476501] border-l-2 border-[#476501]"
                    : "text-[#757968] hover:text-[#111111] hover:bg-[#EAEAEA]/40"
                }`}
              >
                <Folder className="w-4 h-4" />
                Master Decks Library
                <span className="ml-auto bg-[#757968]/10 text-[#757968] text-[10px] px-2 py-0.5 font-mono font-bold">
                  {decks.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("sponsors"); resetProcessingState(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "sponsors"
                    ? "bg-[#476501]/10 text-[#476501] border-l-2 border-[#476501]"
                    : "text-[#757968] hover:text-[#111111] hover:bg-[#EAEAEA]/40"
                }`}
              >
                <Database className="w-4 h-4" />
                Sponsors CRM Hub
                <span className="ml-auto bg-[#757968]/10 text-[#757968] text-[10px] px-2 py-0.5 font-mono font-bold">
                  {sponsors.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("history"); resetProcessingState(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-[#476501]/10 text-[#476501] border-l-2 border-[#476501]"
                    : "text-[#757968] hover:text-[#111111] hover:bg-[#EAEAEA]/40"
                }`}
              >
                <History className="w-4 h-4" />
                Sync History logs
                <span className="ml-auto bg-[#757968]/10 text-[#757968] text-[10px] px-2 py-0.5 font-mono font-bold">
                  {history.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* User Card */}
        <div className="pt-6 border-t border-[#EAEAEA] mt-8">
          {isMockMode && (
            <div className="mb-4 bg-[#F5F2EB] border border-[#E1DCD3] p-3 text-[11px] text-[#8C7A5C] leading-normal font-mono flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Demo Sandbox: Supabase env not loaded.
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-[#757968] mb-4">
            <span className="truncate max-w-[150px] font-medium font-mono text-[11px]" title={user?.email}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 border border-[#EAEAEA] bg-white text-[#111111] px-4 py-2 text-xs font-mono font-bold hover:bg-[#FBFBFA] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            LOG OUT WORKSPACE
          </button>
        </div>
      </aside>

      {/* Main Workspace Workspace Dashboard */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {/* TAB 1: STUDIO (PERSONALIZATION HUB) */}
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-[1000px] mx-auto"
            >
              {!isProcessing ? (
                <>
                  <div className="mb-10">
                    <h1 className="text-4xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                      Personalization Studio
                    </h1>
                    <p className="text-sm text-[#757968]">
                      Personalize your pitch decks recursively by choosing an library deck or uploading custom slides.
                    </p>
                  </div>

                  <form onSubmit={handleProposeReplacements} className="space-y-8">
                    {/* Presentation Selector */}
                    <div className="bg-white border border-[#EAEAEA] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.01)] space-y-6">
                      <div className="text-xs font-mono tracking-widest text-[#757968] uppercase">
                        1. Select Presentation Source
                      </div>

                      {/* Decks Grid Selection */}
                      {decks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {decks.map((deck) => (
                            <div
                              key={deck.id}
                              onClick={() => { setSelectedDeckId(deck.id); setCustomFile(null); }}
                              className={`border p-5 flex items-start gap-4 cursor-pointer transition-all ${
                                selectedDeckId === deck.id && !customFile
                                  ? "border-[#476501] bg-[#476501]/5 shadow-[0_2px_10px_rgba(71,101,1,0.05)]"
                                  : "border-[#EAEAEA] hover:bg-[#FBFBFA]"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded flex items-center justify-center ${selectedDeckId === deck.id && !customFile ? "bg-[#476501] text-white" : "bg-[#F0EFEA] text-[#757968]"}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-[#111111] truncate">{deck.name}</h4>
                                <p className="text-xs text-[#757968] mt-1 font-mono">
                                  {new Date(deck.created_at).toLocaleDateString()} {deck.size && `• ${deck.size}`}
                                </p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDeckId === deck.id && !customFile ? "border-[#476501] bg-[#476501]" : "border-[#EAEAEA]"}`}>
                                {selectedDeckId === deck.id && !customFile && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-[#EAEAEA] text-[#757968] text-xs font-mono">
                          No decks in your library. Add some in the Master Decks tab or upload a one-off below.
                        </div>
                      )}

                      {/* Divider */}
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-[#EAEAEA]"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-[#B0B0A8] uppercase">OR UPLOAD CUSTOM FILE</span>
                        <div className="flex-grow border-t border-[#EAEAEA]"></div>
                      </div>

                      {/* Dropzone Upload */}
                      <div className="border border-dashed border-[#EAEAEA] rounded bg-[#FBFBFA]/50 p-6 flex flex-col items-center justify-center relative hover:bg-[#FBFBFA] transition-colors">
                        <input
                          type="file"
                          accept=".pptx"
                          onChange={(e) => {
                            setCustomFile(e.target.files?.[0] || null);
                            setSelectedDeckId("");
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-5 h-5 text-[#757968] mb-2" />
                        <span className="text-xs font-mono font-bold text-[#476501] hover:underline">
                          {customFile ? customFile.name : "Select One-off presentation"}
                        </span>
                        <span className="text-[10px] text-[#757968] mt-1">PPTX files up to 15MB</span>
                      </div>
                    </div>

                    {/* Intellectual Target URL */}
                    <div className="bg-white border border-[#EAEAEA] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.01)] space-y-6">
                      <div className="text-xs font-mono tracking-widest text-[#757968] uppercase">
                        2. Target Corporate Sponsor
                      </div>
                      <div className="relative border-b border-[#EAEAEA] pb-3 flex items-center gap-4">
                        <Globe className="w-5 h-5 text-[#757968]" strokeWidth={1.5} />
                        <input
                          type="url"
                          placeholder="https://sponsor-website.com"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          required
                          className="w-full outline-none bg-transparent placeholder-[#B0B0A8] text-[#111111] text-md"
                        />
                      </div>
                      <p className="text-xs text-[#757968] leading-relaxed">
                        We will scrape this URL to analyze sponsor values, developer directives, and CSR goals to align text blocks recursively.
                      </p>
                    </div>

                    {/* Tonal Alignment Collapsible Parameters */}
                    <div className="bg-white border border-[#EAEAEA] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                      <button
                        type="button"
                        onClick={() => setIsTonePanelOpen(!isTonePanelOpen)}
                        className="w-full flex items-center justify-between font-mono text-xs tracking-widest text-[#757968] uppercase font-bold focus:outline-none"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4" />
                          Advanced Tonal Alignment Panel (Optional)
                        </span>
                        {isTonePanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isTonePanelOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.2 }}
                          className="pt-6 mt-6 border-t border-[#EAEAEA] space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Sliders 1: Formal / Creative */}
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#757968]">Creative</span>
                                <span className="font-bold text-[#111111]">
                                  {toneFormal < 35 ? "Narrative Creative" : toneFormal > 65 ? "Corporate Formal" : "Balanced"}
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

                            {/* Sliders 2: Tech / CSR */}
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#757968]">CSR / Community</span>
                                <span className="font-bold text-[#111111]">
                                  {toneTechnical < 35 ? "Impact Oriented" : toneTechnical > 65 ? "Developer Technical" : "Balanced"}
                                </span>
                                <span className="text-[#757968]">Technical Stack</span>
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
                          </div>

                          {/* Custom Alignment focus text area */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-mono text-[#757968] tracking-widest uppercase block">
                              Custom Directive Focus
                            </label>
                            <textarea
                              placeholder="e.g. Focus on our carbon-neutral web frameworks, target stripe terminal developer integrations..."
                              value={customFocus}
                              onChange={(e) => setCustomFocus(e.target.value)}
                              rows={2}
                              className="w-full p-3 bg-[#FBFBFA] border border-[#EAEAEA] text-sm text-[#111111] focus:border-[#476501] outline-none resize-none font-sans"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Sync Trigger button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={(!selectedDeckId && !customFile) || !targetUrl}
                      className="w-full bg-[#1A1C15] text-white h-16 flex items-center justify-center gap-3 hover:bg-[#2F3129] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-serif text-2xl tracking-wide"
                      style={{ fontFamily: "var(--font-playfair-display), serif" }}
                    >
                      <span>Analyze & Propose Sync</span>
                      <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                    </motion.button>
                  </form>
                </>
              ) : (
                /* TWO-PHASE WORKFLOW STATE RENDERINGS */
                <div className="w-full max-w-[1000px] mx-auto min-h-[400px]">
                  {/* Phase 1 Fetching */}
                  {processingState === "fetching" && (
                    <motion.div
                      key="fetching"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <h2 className="text-3xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                        Scraping & Synthesizing Target Context
                      </h2>
                      <p className="text-[#757968] text-sm mb-8">
                        Our intelligence engine is scanning the sponsor's mandate...
                      </p>

                      <div className="w-full max-w-[650px] bg-[#2F3129] rounded overflow-hidden shadow-2xl border border-[#44493A]">
                        <div className="h-10 bg-[#1A1C15] flex items-center px-4 gap-2 border-b border-[#2F3129] relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ED6A5E]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F4BF4F]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#61C554]" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="font-mono text-[10px] text-[#757968]">fundsync_studio_v2.sh</span>
                          </div>
                        </div>
                        <div className="p-6 min-h-[260px] font-mono text-xs text-[#EAE8E0] flex flex-col gap-3.5 leading-relaxed">
                          <p className="opacity-100">{">"} Initiating cryptographic handshake with B2B backend...</p>
                          {logStage >= 1 && <p className="animate-in fade-in slide-in-from-bottom-1">{">"} Extracting master slides paragraphs recursively...</p>}
                          {logStage >= 2 && <p className="animate-in fade-in slide-in-from-bottom-1">{">"} Running Firecrawl scraper on {targetUrl}...</p>}
                          {logStage >= 3 && <p className="animate-in fade-in slide-in-from-bottom-1 text-[#CFEE91]">{">"} Gemini-2.5-Flash copywriting tone weights applied successfully.</p>}

                          <div className="mt-auto flex gap-2 items-center text-[#CFEE91]">
                            <span>{">"}</span>
                            <span className="w-2 h-[15px] bg-[#CFEE91] animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Phase 1.5: Alchemy Chamber Edit */}
                  {processingState === "alchemy" && (
                    <motion.div
                      key="alchemy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full"
                    >
                      <AlchemyChamber
                        proposedReplacements={proposedReplacements}
                        scrapedContext={scrapedContext}
                        onCancel={resetProcessingState}
                        onCompile={handleCompileDeck}
                      />
                    </motion.div>
                  )}

                  {/* Phase 2: Compiling */}
                  {processingState === "compiling" && (
                    <motion.div
                      key="compiling"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20"
                    >
                      <Loader2 className="w-12 h-12 text-[#476501] animate-spin mb-4" />
                      <h3 className="text-2xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                        Patching presentation XML layers...
                      </h3>
                      <p className="text-[#757968] text-xs font-mono">
                        Validating file integrity to ensure zero formatting distortions.
                      </p>
                    </motion.div>
                  )}

                  {/* Phase 2.5: Success Screen */}
                  {processingState === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-[650px] mx-auto bg-white border border-[#EAEAEA] p-12 flex flex-col items-center shadow-md text-center"
                    >
                      <div className="w-14 h-14 bg-[#CFEE91] rounded-xl flex items-center justify-center mb-6 text-[#476501]">
                        <Check className="w-7 h-7" strokeWidth={2.5} />
                      </div>

                      <h2 className="text-3xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                        Presentation Personalized
                      </h2>
                      <p className="text-[#757968] text-sm mb-8 max-w-[420px]">
                        The personalized presentation is ready. We've updated the copies recursively according to your edits.
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="border border-[#EAEAEA] p-5">
                          <div className="text-2xl font-serif font-bold text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                            {replacementsCount}
                          </div>
                          <div className="text-[9px] font-mono text-[#757968] uppercase tracking-wider mt-1">
                            Segments Replaced
                          </div>
                        </div>
                        <div className="border border-[#EAEAEA] p-5">
                          <div className="text-2xl font-serif font-bold text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                            {slidesModifiedCount}
                          </div>
                          <div className="text-[9px] font-mono text-[#757968] uppercase tracking-wider mt-1">
                            Slides Modified
                          </div>
                        </div>
                      </div>

                      {/* Call Actions */}
                      <a
                        href={downloadUrl || "#"}
                        download={`FundSync_Targeted_Personalized.pptx`}
                        className="w-full bg-[#476501] text-white h-14 flex items-center justify-center gap-3 hover:bg-[#5f7f1f] transition-colors mb-4 rounded-sm font-sans font-medium text-lg"
                      >
                        <Download className="w-5 h-5" />
                        Download PPTX
                      </a>

                      <button
                        onClick={resetProcessingState}
                        className="text-[#757968] font-mono text-xs uppercase tracking-wider hover:text-[#111111] transition-colors"
                      >
                        Return to Personalization Studio
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: MASTER DECKS LIBRARY */}
          {activeTab === "decks" && (
            <motion.div
              key="decks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-[1000px] mx-auto"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                    Master Decks Library
                  </h1>
                  <p className="text-sm text-[#757968]">
                    Save your base presentation templates to personal Cloud storage to reuse during personalization.
                  </p>
                </div>

                <div className="relative cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept=".pptx"
                    onChange={handleUploadDeck}
                    disabled={isUploadingDeck}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <button
                    disabled={isUploadingDeck}
                    className="flex items-center gap-2 bg-[#476501] hover:bg-[#5f7f1f] text-white px-5 py-2.5 text-xs font-mono font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUploadingDeck ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    UPLOAD MASTER PITCH (.pptx)
                  </button>
                </div>
              </div>

              {/* Decks Grid */}
              {decks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="bg-white border border-[#EAEAEA] p-6 hover:shadow-sm transition-all flex items-start gap-4 relative group"
                    >
                      <div className="w-12 h-12 rounded bg-[#F0EFEA] flex items-center justify-center text-[#757968] group-hover:bg-[#476501]/10 group-hover:text-[#476501] transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="font-serif font-bold text-lg text-[#111111] truncate mb-1" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                          {deck.name}
                        </h3>
                        <p className="text-xs text-[#757968] font-mono leading-none">
                          Uploaded: {new Date(deck.created_at).toLocaleDateString()} {deck.size && `• ${deck.size}`}
                        </p>
                        <div className="flex gap-4 mt-4 text-xs font-mono">
                          <button
                            onClick={() => {
                              setSelectedDeckId(deck.id);
                              setCustomFile(null);
                              setActiveTab("studio");
                            }}
                            className="text-[#476501] font-bold hover:underline flex items-center gap-1"
                          >
                            Personalize Studio <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteDeck(deck.id, deck.storage_path, deck.name)}
                        className="absolute top-6 right-6 text-[#B0B0A8] hover:text-[#ED6A5E] p-1 transition-colors"
                        title="Delete deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-[#EAEAEA] p-16 flex flex-col items-center justify-center text-center">
                  <Folder className="w-12 h-12 text-[#B0B0A8] mb-4" strokeWidth={1} />
                  <h3 className="text-lg font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                    Library is empty
                  </h3>
                  <p className="text-xs text-[#757968] max-w-[280px] mb-6 leading-relaxed">
                    Upload your pitch deck template. It will be safely saved in Supabase Storage.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SPONSORS CRM HUB */}
          {activeTab === "sponsors" && (
            <motion.div
              key="sponsors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-[1000px] mx-auto"
            >
              <div className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                  Sponsors CRM Hub
                </h1>
                <p className="text-sm text-[#757968]">
                  Browse scraped corporate profiles, dossier context, and brand directives saved from your previous sync runs.
                </p>
              </div>

              {/* CRM Search & Utilities */}
              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-white border border-[#EAEAEA] px-4 py-3 flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#757968]" />
                  <input
                    type="text"
                    placeholder="Search sponsors by name, URL, or dossier keywords..."
                    value={sponsorSearch}
                    onChange={(e) => setSponsorSearch(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm placeholder-[#B0B0A8] text-[#111111]"
                  />
                </div>
              </div>

              {/* Sponsors directory list */}
              {filteredSponsors.length > 0 ? (
                <div className="bg-white border border-[#EAEAEA] divide-y divide-[#EAEAEA]">
                  {filteredSponsors.map((sponsor) => {
                    const isExpanded = expandedSponsorId === sponsor.id;
                    return (
                      <div key={sponsor.id} className="p-6 transition-all hover:bg-[#FBFBFA]/40">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-[#F0EFEA] flex items-center justify-center text-[#757968] shrink-0 font-serif font-bold">
                              {sponsor.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-serif font-bold text-lg text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                                {sponsor.name}
                              </h3>
                              <a
                                href={sponsor.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#757968] hover:text-[#476501] hover:underline flex items-center gap-1 mt-1 font-mono"
                              >
                                <Globe className="w-3 h-3" />
                                {sponsor.website_url}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <button
                              onClick={() => {
                                setTargetUrl(sponsor.website_url);
                                setActiveTab("studio");
                              }}
                              className="bg-[#1A1C15] hover:bg-[#2F3129] text-white px-4 py-2 font-bold transition-all shrink-0"
                            >
                              Sync Pitch
                            </button>

                            <button
                              onClick={() => setExpandedSponsorId(isExpanded ? null : sponsor.id)}
                              className="text-[#757968] hover:text-[#111111] p-1 flex items-center gap-1"
                            >
                              {isExpanded ? "Collapse dossier" : "View dossier"}
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Dossier Context Info */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 pt-6 border-t border-[#EAEAEA] space-y-4"
                          >
                            <div>
                              <span className="text-[10px] font-mono tracking-wider text-[#757968] uppercase font-bold block mb-2">
                                Brand Dossier Context (Extracted AI Mandates)
                              </span>
                              <div className="bg-[#FBFBFA] border border-[#EAEAEA] p-4 text-xs font-mono text-[#44493A] leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                                {sponsor.dossier_context || "No context data gathered."}
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-[#B0B0A8]">
                              Dossier scanned: {new Date(sponsor.created_at).toLocaleString()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-[#EAEAEA] p-16 flex flex-col items-center justify-center text-center">
                  <Database className="w-12 h-12 text-[#B0B0A8] mb-4" strokeWidth={1} />
                  <h3 className="text-lg font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                    No corporate profiles found
                  </h3>
                  <p className="text-xs text-[#757968] max-w-[280px]">
                    Sponsors are cataloged here automatically after you run a personalization pitch sync.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: SYNC HISTORY LOGS */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-[1000px] mx-auto"
            >
              <div className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                  Sync History logs
                </h1>
                <p className="text-sm text-[#757968]">
                  Audit log tracking previous deck personalizations, modifications count, and sync timestamps.
                </p>
              </div>

              {/* History Table */}
              {history.length > 0 ? (
                <div className="bg-white border border-[#EAEAEA] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EAEAEA] bg-[#FBFBFA] text-[10px] font-mono tracking-widest text-[#757968] uppercase">
                        <th className="py-4 px-6 font-bold">Presentation File</th>
                        <th className="py-4 px-6 font-bold">Sponsor aligned</th>
                        <th className="py-4 px-6 font-bold text-center">Edits Made</th>
                        <th className="py-4 px-6 font-bold text-center">Slides Affected</th>
                        <th className="py-4 px-6 font-bold text-right">Date synced</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA] text-xs font-mono text-[#44493A]">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FBFBFA]/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-[#111111] max-w-[220px] truncate" title={item.deck_name}>
                            {item.deck_name}
                          </td>
                          <td className="py-4 px-6 font-bold text-[#476501]">
                            {item.sponsor_name}
                          </td>
                          <td className="py-4 px-6 text-center font-bold">
                            {item.replacements_count}
                          </td>
                          <td className="py-4 px-6 text-center font-bold">
                            {item.slides_modified}
                          </td>
                          <td className="py-4 px-6 text-right text-[#757968]">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white border border-[#EAEAEA] p-16 flex flex-col items-center justify-center text-center">
                  <History className="w-12 h-12 text-[#B0B0A8] mb-4" strokeWidth={1} />
                  <h3 className="text-lg font-serif font-bold text-[#111111] mb-2" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
                    No sync records
                  </h3>
                  <p className="text-xs text-[#757968] max-w-[280px]">
                    A historical ledger of personalization events will compile here as you sync files.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

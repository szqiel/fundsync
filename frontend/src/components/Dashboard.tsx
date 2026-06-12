"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, Variants } from "framer-motion";
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
  Sliders, 
  AlertTriangle,
  Lock,
  ArrowRight,
  Loader2,
  LayoutGrid,
  Link2
} from "lucide-react";
import { toast } from "sonner";
import { AlchemyChamber } from "./AlchemyChamber";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface Deck {
  id: string;
  name: string;
  storage_path: string;
  created_at: string;
  size?: string;
  thumbnail_url?: string;
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

// Premium Spring Physics
const springTransition = { type: "spring", stiffness: 300, damping: 30 };
const fastSpring = { type: "spring", stiffness: 400, damping: 25 };

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
  const [processingFileUrl, setProcessingFileUrl] = useState<string>("");
  const [processingFileName, setProcessingFileName] = useState<string>("");

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
        setTimeout(() => setLogStage(1), 1200),
        setTimeout(() => setLogStage(2), 2800),
        setTimeout(() => setLogStage(3), 4500),
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
      console.error("Error fetching decks:", err?.message || err);
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
      console.error("Error fetching sponsors:", err?.message || err);
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
      console.error("Error fetching history:", err?.message || err);
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
      // 1. Upload Presentation to Supabase Storage
      const storagePath = `${user.id}/${deckId}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("master-decks")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // 2. Generate exact slide screenshot using backend Python PPTX zip extractor
      let thumbnailUrl = "";
      try {
        // Fetch the public URL from Supabase first
        const { data: publicUrlData } = supabase.storage
          .from("master-decks")
          .getPublicUrl(storagePath);
          
        const fileUrl = publicUrlData.publicUrl;

        const formData = new FormData();
        formData.append("file_url", fileUrl); // Send file_url instead of massive Blob!
        const thumbResponse = await fetch("http://localhost:8000/api/generate-thumbnail", {
          method: "POST",
          body: formData
        });
        
        if (thumbResponse.ok) {
          const thumbBlob = await thumbResponse.blob();
          const thumbStoragePath = `${user.id}/${deckId}_thumbnail.png`;
          
          const { error: thumbUploadError } = await supabase.storage
            .from("master-decks")
            .upload(thumbStoragePath, thumbBlob, { contentType: "image/png" });
            
          if (!thumbUploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("master-decks")
              .getPublicUrl(thumbStoragePath);
            thumbnailUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.error("Thumbnail generation skipped/failed:", err);
      }

      // 3. Save row to decks table
      const { error: dbError } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          name: file.name,
          storage_path: storagePath,
          thumbnail_url: thumbnailUrl || null
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
    
    let fileUrlToSend = "";
    let selectedDeckName = "";
    
    if (customFile) {
      selectedDeckName = customFile.name;
      // In Mock mode, fake the URL
      if (isMockMode) {
        fileUrlToSend = "https://mock-supabase.com/temp.pptx";
      } else {
        try {
          const tempPath = `temp/${user.id}/${Math.random().toString(36).substring(7)}_${customFile.name}`;
          const { error: uploadError } = await supabase.storage.from("master-decks").upload(tempPath, customFile);
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from("master-decks").getPublicUrl(tempPath);
          fileUrlToSend = data.publicUrl;
        } catch (err) {
          console.error("Failed to upload custom file to cloud for processing:", err);
          toast.error("Failed to upload custom file for processing.");
          return;
        }
      }
    } else if (selectedDeckId) {
      const deck = decks.find(d => d.id === selectedDeckId);
      if (deck) {
        selectedDeckName = deck.name;
        if (isMockMode) {
          fileUrlToSend = "https://mock-supabase.com/library.pptx";
        } else {
          const { data } = supabase.storage.from("master-decks").getPublicUrl(deck.storage_path);
          fileUrlToSend = data.publicUrl;
        }
      }
    }

    if (!fileUrlToSend || !targetUrl) {
      toast.error("Please provide a pitch deck and a target website URL.");
      return;
    }

    setIsProcessing(true);
    setProcessingState("fetching");
    setProcessingFileUrl(fileUrlToSend);
    setProcessingFileName(selectedDeckName);
    setSessionId(crypto.randomUUID());

    const payload = {
      file_url: fileUrlToSend,
      target_url: targetUrl,
      tone_formal: toneFormal,
      tone_technical: toneTechnical,
      custom_focus: customFocus
    };

    try {
      const response = await fetch("http://localhost:8000/api/propose-replacements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = "Error communicating with AI engine.";
        try {
          const errData = await response.json();
          errorText = (typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)) || errorText;
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
      toast.error(err.message || "Failed to propose replacements. Ensure backend is running.");
      setIsProcessing(false);
      setProcessingState("idle");
    }
  };

  // Helper to save sponsor to DB CRM
  const saveSponsorToCRM = async (url: string, context: string) => {
    let hostname = "Target Sponsor";
    try {
      hostname = new URL(url).hostname.replace("www.", "");
      hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1).split(".")[0];
    } catch {}

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
          file_url: processingFileUrl,
          original_filename: processingFileName,
          replacements: finalReplacements
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(`Server Error: ${errJson.detail || response.statusText}`);
      }

      const responseData = await response.json();
      
      const repCount = responseData.replacements_count || 0;
      const slidesMod = responseData.slides_modified || 0;
      
      setReplacementsCount(repCount);
      setSlidesModifiedCount(slidesMod);
      setDownloadUrl(responseData.download_url);

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

      saveHistoryItem(selectedDeckName, hostname, repCount, slidesMod);

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

  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
    s.website_url.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
    (s.dossier_context && s.dossier_context.toLowerCase().includes(sponsorSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100dvh-73px)] bg-[#F3EFE7] relative overflow-hidden">
      
      <AmbientBackground />

      {/* Floating Glass Sidebar */}
      <aside className="w-full md:w-[280px] shrink-0 p-4 md:p-6 md:pr-0 relative z-20">
        <div className="w-full h-full bg-white/70 backdrop-blur-2xl border border-zinc-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase mb-5 ml-1">
                Workspace
              </div>
              <nav className="space-y-1.5">
                {[
                  { id: "studio", icon: Sparkles, label: "Studio" },
                  { id: "decks", icon: Folder, label: "Decks", count: decks.length },
                  { id: "sponsors", icon: Database, label: "CRM Hub", count: sponsors.length },
                  { id: "history", icon: History, label: "Logs", count: history.length },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); resetProcessingState(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === item.id
                        ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.count !== undefined && (
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        activeTab === item.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="pt-6 mt-8">
            {isMockMode && (
              <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3 text-[10px] text-orange-800 leading-relaxed font-mono flex items-start gap-2 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Demo Sandbox: Supabase env disconnected.</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <span className="truncate w-full font-mono text-[10px] text-zinc-400 tracking-wider bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-100" title={user?.email}>
                {user?.email}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950 hover:border-zinc-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                LOG OUT
              </motion.button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: STUDIO */}
          {activeTab === "studio" && (
            <motion.div key="studio" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="w-full max-w-[1200px] mx-auto h-full">
              {!isProcessing ? (
                <div className="space-y-6">
                  <motion.div variants={fadeInUp} className="mb-8 px-2">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-2">Personalization Studio</h1>
                    <p className="text-sm text-zinc-500 font-medium">Select a master presentation, target a sponsor, and execute AI synchronization.</p>
                  </motion.div>

                  <form onSubmit={handleProposeReplacements} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Deck Selection (Bento Tile 1) */}
                    <motion.div variants={fadeInUp} className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-[#CFEE91] flex items-center justify-center text-[#269755]"><LayoutGrid className="w-4 h-4"/></div>
                        <h2 className="text-lg font-bold text-zinc-900">1. Master Deck</h2>
                      </div>

                      {decks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {decks.map((deck) => (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={deck.id}
                              onClick={() => { setSelectedDeckId(deck.id); setCustomFile(null); }}
                              className={`rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition-all border-2 ${
                                selectedDeckId === deck.id && !customFile
                                  ? "border-[#269755] bg-[#CFEE91]/40/50 shadow-sm"
                                  : "border-zinc-100 bg-white hover:border-zinc-300"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedDeckId === deck.id && !customFile ? "bg-[#269755] text-white" : "bg-zinc-100 text-zinc-400"}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-zinc-900 truncate">{deck.name}</h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{deck.size || "Unknown size"}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center p-6 text-center mb-6">
                          <span className="text-xs font-mono text-zinc-500">No decks found in library.</span>
                        </div>
                      )}

                      <div className="mt-auto pt-6 border-t border-zinc-100">
                        <div className="relative group">
                          <input type="file" accept=".pptx" onChange={(e) => { setCustomFile(e.target.files?.[0] || null); setSelectedDeckId(""); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className={`w-full rounded-xl border-2 border-dashed flex items-center justify-center p-4 transition-colors ${customFile ? "border-[#269755]/50 bg-[#CFEE91]/40 text-[#1d7240]" : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-500"}`}>
                            <Upload className="w-4 h-4 mr-2" />
                            <span className="text-xs font-semibold">{customFile ? customFile.name : "Or upload one-off .pptx"}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right Column: Config & Submit (Bento Tile 2 & 3) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      
                      <motion.div variants={fadeInUp} className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-[#CFEE91] flex items-center justify-center text-[#269755]"><Globe className="w-4 h-4"/></div>
                          <h2 className="text-lg font-bold text-zinc-900">2. Target Intel</h2>
                        </div>
                        
                        <div className="relative flex items-center focus-within:ring-2 focus-within:ring-[#269755]/20 rounded-xl overflow-hidden shadow-sm border border-zinc-200 bg-white">
                          <div className="pl-4 pr-2"><Link2 className="w-4 h-4 text-zinc-400" /></div>
                          <input
                            type="url" placeholder="https://sponsor-url.com" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required
                            className="w-full h-12 outline-none bg-transparent placeholder-zinc-300 text-sm font-semibold text-zinc-900"
                          />
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex-1 flex flex-col justify-between">
                        <div className="mb-4">
                          <button type="button" onClick={() => setIsTonePanelOpen(!isTonePanelOpen)} className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 focus:outline-none">
                            <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-zinc-400" /> Advanced Params</span>
                            <motion.div animate={{ rotate: isTonePanelOpen ? 180 : 0 }} transition={fastSpring}><ChevronDown className="w-4 h-4 text-zinc-400" /></motion.div>
                          </button>

                          <AnimatePresence>
                            {isTonePanelOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="pt-6 space-y-5">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-medium">
                                      <span>Narrative</span>
                                      <span className="text-zinc-900 font-bold">{toneFormal < 35 ? "Creative" : toneFormal > 65 ? "Corporate" : "Balanced"}</span>
                                      <span>Formal</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={toneFormal} onChange={(e) => setToneFormal(parseInt(e.target.value, 10))} className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900" />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-medium">
                                      <span>Impact</span>
                                      <span className="text-zinc-900 font-bold">{toneTechnical < 35 ? "Social" : toneTechnical > 65 ? "Technical" : "Balanced"}</span>
                                      <span>Tech</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={toneTechnical} onChange={(e) => setToneTechnical(parseInt(e.target.value, 10))} className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900" />
                                  </div>
                                  <textarea placeholder="Custom directive..." value={customFocus} onChange={(e) => setCustomFocus(e.target.value)} rows={2} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none resize-none" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <MagneticButton
                          type="submit" disabled={(!selectedDeckId && !customFile) || !targetUrl}
                          className="w-full bg-zinc-950 text-white h-14 rounded-xl flex items-center justify-center gap-2 mt-auto hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                        >
                          <span className="text-sm font-bold tracking-wide">Synthesize Pitch</span>
                          <Sparkles className="w-4 h-4" />
                        </MagneticButton>
                      </motion.div>
                    </div>
                  </form>
                </div>
              ) : (
                /* STATE WORKFLOW */
                <div className="w-full max-w-[1000px] mx-auto flex flex-col">
                  {processingState === "fetching" && (
                    <motion.div key="fetching" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
                      <motion.div variants={fadeInUp} className="relative w-24 h-24 mb-12 flex items-center justify-center">
                        <div className="absolute w-full h-full rounded-full border border-zinc-200 border-t-zinc-900 animate-spin" style={{ animationDuration: '2s' }} />
                        <div className="absolute w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                          <Sparkles className="w-6 h-6 text-zinc-900 animate-pulse" />
                        </div>
                      </motion.div>
                      <motion.h2 variants={fadeInUp} className="text-2xl font-bold tracking-tight mb-12 text-zinc-900 text-center">Personalizing presentation layers...</motion.h2>
                      <div className="w-full max-w-lg space-y-4 text-left">
                        {[
                          { step: 1, title: "Extract Presentation Copy", desc: "Recursively traversing shapes and table structures." },
                          { step: 2, title: "Scrape Target Context", desc: "Analyzing sponsor URL for CSR and structural goals." },
                          { step: 3, title: "Tonal Synthesis", desc: "Gemini generating layout-constrained replacements." }
                        ].map((item, idx) => {
                          const isActive = logStage >= item.step;
                          const isCurrent = logStage === item.step - 1;
                          return (
                            <motion.div key={item.step} variants={fadeInUp} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-700 ${isActive ? "bg-white border-zinc-200 shadow-sm" : isCurrent ? "bg-zinc-50 border-zinc-200" : "bg-transparent border-transparent opacity-40"}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-700 ${isActive ? "bg-zinc-900 text-white" : isCurrent ? "border border-zinc-300 text-zinc-500" : "border border-zinc-200 text-zinc-300"}`}>
                                {isActive ? <Check className="w-3 h-3" /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-zinc-400 animate-ping' : 'bg-zinc-300'}`} />}
                              </div>
                              <div>
                                <h4 className={`text-sm font-semibold transition-colors duration-700 ${isActive ? "text-zinc-900" : isCurrent ? "text-zinc-700" : "text-zinc-400"}`}>{item.title}</h4>
                                <p className={`text-xs mt-1 transition-colors duration-700 ${isActive || isCurrent ? "text-zinc-500" : "text-zinc-400"}`}>{item.desc}</p>
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

                  {processingState === "alchemy" && (
                    <motion.div key="alchemy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full py-10">
                      <AlchemyChamber proposedReplacements={proposedReplacements} scrapedContext={scrapedContext} onCancel={resetProcessingState} onCompile={handleCompileDeck} />
                    </motion.div>
                  )}

                  {processingState === "compiling" && (
                    <motion.div key="compiling" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
                      <motion.div variants={fadeInUp} className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-8 shadow-sm">
                        <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
                      </motion.div>
                      <motion.h3 variants={fadeInUp} className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">Injecting variables and compiling...</motion.h3>
                      <motion.p variants={fadeInUp} className="text-zinc-500 text-xs font-mono tracking-wide">Executing anti-corruption XML checks</motion.p>
                    </motion.div>
                  )}

                  {processingState === "success" && (
                    <motion.div key="success" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="max-w-2xl mx-auto bg-white border border-zinc-200/60 rounded-[2.5rem] p-12 flex flex-col items-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center my-auto mt-20">
                      <motion.div variants={fadeInUp} className="w-16 h-16 bg-[#CFEE91] rounded-2xl flex items-center justify-center mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <Check className="w-7 h-7 text-[#269755]" strokeWidth={2.5} />
                      </motion.div>
                      <motion.h1 variants={fadeInUp} className="text-3xl font-bold tracking-tight mb-4 text-zinc-900">Synthesis Complete</motion.h1>
                      <motion.p variants={fadeInUp} className="text-zinc-500 text-sm mb-12 max-w-md">Your pitch deck has been recursively aligned. Ready for download.</motion.p>

                      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 w-full mb-10">
                        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex flex-col items-center">
                          <div className="text-3xl font-bold mb-1 text-zinc-900">{replacementsCount}</div>
                          <div className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Strings Adapted</div>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex flex-col items-center">
                          <div className="text-3xl font-bold mb-1 text-zinc-900">{slidesModifiedCount}</div>
                          <div className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">Slides Modified</div>
                        </div>
                      </motion.div>

                      <motion.a variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={downloadUrl || "#"} download={`FundSync_Personalized.pptx`} className="w-full bg-zinc-950 text-white h-14 flex items-center justify-center gap-3 hover:bg-zinc-800 rounded-xl font-bold shadow-[0_4px_14px_rgba(0,0,0,0.1)] mb-6">
                        <Download className="w-4 h-4" /> Download .pptx
                      </motion.a>
                      <motion.button variants={fadeInUp} onClick={resetProcessingState} className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest hover:text-zinc-900 transition-colors">Start New Session</motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: MASTER DECKS LIBRARY */}
          {activeTab === "decks" && (
            <motion.div key="decks" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="w-full h-full max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 px-2">
                <motion.div variants={fadeInUp}>
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-2">Decks Library</h1>
                  <p className="text-sm text-zinc-500 font-medium">Manage base presentation templates in your Cloud storage.</p>
                </motion.div>

                <motion.div variants={fadeInUp} className="relative shrink-0">
                  <input type="file" accept=".pptx" onChange={handleUploadDeck} disabled={isUploadingDeck} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isUploadingDeck} className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white px-6 py-3 rounded-full text-xs font-mono font-bold tracking-wider shadow-md disabled:opacity-50">
                    {isUploadingDeck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    UPLOAD TEMPLATE
                  </motion.button>
                </motion.div>
              </div>

              {decks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {decks.map((deck) => (
                    <motion.div variants={fadeInUp} key={deck.id} className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col group overflow-hidden relative">
                      <div className="w-full aspect-video bg-zinc-100 flex items-center justify-center relative overflow-hidden">
                        {deck.thumbnail_url ? (
                          <img src={deck.thumbnail_url} alt={deck.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="flex flex-col items-center text-zinc-400"><FileText className="w-8 h-8 mb-2" strokeWidth={1.5} /><span className="text-[10px] font-mono tracking-widest uppercase">No Preview</span></div>
                        )}
                        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedDeckId(deck.id); setCustomFile(null); setActiveTab("studio"); }} className="bg-white text-zinc-950 px-6 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#269755]" /> Start Sync
                          </motion.button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-zinc-900 truncate mb-1">{deck.name}</h3>
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{new Date(deck.created_at).toLocaleDateString()} • {deck.size || 'Unknown'}</p>
                      </div>
                      <button onClick={() => handleDeleteDeck(deck.id, deck.storage_path, deck.name)} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-zinc-400 hover:text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-zinc-200 translate-y-[-10px] group-hover:translate-y-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div variants={fadeInUp} className="bg-white/50 border border-zinc-200/60 rounded-[2.5rem] p-24 flex flex-col items-center text-center">
                  <Folder className="w-12 h-12 text-zinc-300 mb-6" strokeWidth={1} />
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Library is empty</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">Upload your first `.pptx` template. It will be safely saved in Cloud Storage for future synchronizations.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SPONSORS */}
          {activeTab === "sponsors" && (
            <motion.div key="sponsors" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="w-full h-full max-w-[1200px] mx-auto">
              <motion.div variants={fadeInUp} className="mb-10 px-2">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-2">CRM Hub</h1>
                <p className="text-sm text-zinc-500 font-medium">Browse extracted corporate dossiers and alignment mandates.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex gap-4 mb-8">
                <div className="flex-1 bg-white/80 backdrop-blur-md border border-zinc-200/80 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <Search className="w-5 h-5 text-zinc-400" />
                  <input type="text" placeholder="Search by name, URL, or dossier keywords..." value={sponsorSearch} onChange={(e) => setSponsorSearch(e.target.value)} className="w-full bg-transparent outline-none text-sm font-medium placeholder-zinc-400 text-zinc-900" />
                </div>
              </motion.div>

              {filteredSponsors.length > 0 ? (
                <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4">
                  {filteredSponsors.map((sponsor) => {
                    const isExpanded = expandedSponsorId === sponsor.id;
                    return (
                      <motion.div layout key={sponsor.id} className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-lg border border-zinc-200 shrink-0">
                              {sponsor.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-zinc-900">{sponsor.name}</h3>
                              <a href={sponsor.website_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-[#269755] font-mono flex items-center gap-1.5 mt-1 transition-colors">
                                <Globe className="w-3 h-3" /> {sponsor.website_url}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setTargetUrl(sponsor.website_url); setActiveTab("studio"); }} className="bg-zinc-900 text-white px-5 py-2.5 rounded-full text-[11px] font-mono font-bold tracking-widest transition-all shadow-md">
                              SYNC PITCH
                            </motion.button>
                            <button onClick={() => setExpandedSponsorId(isExpanded ? null : sponsor.id)} className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors">
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={fastSpring}><ChevronDown className="w-4 h-4" /></motion.div>
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="mt-6 pt-6 border-t border-zinc-100">
                                <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold block mb-3 pl-1">Extracted AI Context</span>
                                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 text-sm text-zinc-700 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-medium">
                                  {sponsor.dossier_context || "No context data gathered."}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400 mt-4 pl-1">Scanned: {new Date(sponsor.created_at).toLocaleString()}</div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div variants={fadeInUp} className="bg-white/50 border border-zinc-200/60 rounded-[2.5rem] p-24 flex flex-col items-center text-center">
                  <Database className="w-12 h-12 text-zinc-300 mb-6" strokeWidth={1} />
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">No corporate profiles</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">Sponsors are cataloged automatically after you execute a personalization sync.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === "history" && (
            <motion.div key="history" initial="hidden" animate="visible" exit="exit" variants={staggerContainer} className="w-full h-full max-w-[1200px] mx-auto">
              <motion.div variants={fadeInUp} className="mb-10 px-2">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-2">Sync History</h1>
                <p className="text-sm text-zinc-500 font-medium">Audit ledger of previous personalizations and modification counts.</p>
              </motion.div>

              {history.length > 0 ? (
                <motion.div variants={fadeInUp} className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                        <th className="py-5 px-8 font-bold">Document</th>
                        <th className="py-5 px-8 font-bold">Target Sponsor</th>
                        <th className="py-5 px-8 font-bold text-center">Mutations</th>
                        <th className="py-5 px-8 font-bold text-center">Slides</th>
                        <th className="py-5 px-8 font-bold text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700 font-medium">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-5 px-8 text-zinc-900 max-w-[250px] truncate" title={item.deck_name}>{item.deck_name}</td>
                          <td className="py-5 px-8 text-[#269755] font-bold">{item.sponsor_name}</td>
                          <td className="py-5 px-8 text-center"><span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-mono font-bold text-zinc-600">{item.replacements_count}</span></td>
                          <td className="py-5 px-8 text-center"><span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-mono font-bold text-zinc-600">{item.slides_modified}</span></td>
                          <td className="py-5 px-8 text-right text-zinc-400 font-mono text-[10px]">{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div variants={fadeInUp} className="bg-white/50 border border-zinc-200/60 rounded-[2.5rem] p-24 flex flex-col items-center text-center">
                  <History className="w-12 h-12 text-zinc-300 mb-6" strokeWidth={1} />
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">No ledger records</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">A historical log of sync events will compile here automatically.</p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
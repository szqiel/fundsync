"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { 
  Check, 
  X, 
  Sparkles, 
  RotateCcw, 
  Info, 
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface AlchemyChamberProps {
  proposedReplacements: Record<string, string>;
  scrapedContext: string;
  onCancel: () => void;
  onCompile: (finalReplacements: Record<string, string>) => void;
}

interface DiffRow {
  id: string;
  original: string;
  proposed: string;
  current: string;
  selected: boolean;
}

const springTransition: Transition = { type: "spring", stiffness: 300, damping: 30 };
const fastSpring: Transition = { type: "spring", stiffness: 400, damping: 25 };

export function AlchemyChamber({ 
  proposedReplacements, 
  scrapedContext, 
  onCancel, 
  onCompile 
}: AlchemyChamberProps) {
  const [rows, setRows] = useState<DiffRow[]>([]);
  const [filter, setFilter] = useState<"all" | "selected" | "excluded">("all");
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Initialize diff rows
  useEffect(() => {
    const initialRows = Object.entries(proposedReplacements).map(([original, proposed], idx) => ({
      id: `row-${idx}`,
      original,
      proposed,
      current: proposed,
      selected: true
    }));
    setRows(initialRows);
  }, [proposedReplacements]);

  const handleTextChange = (id: string, text: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, current: text } : row
    ));
  };

  const handleResetRow = (id: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, current: row.proposed } : row
    ));
  };

  const handleBulkSelect = (selected: boolean) => {
    setRows(prev => prev.map(row => ({ ...row, selected })));
    toast.info(selected ? "Approved all proposed changes." : "Excluded all proposed changes.");
  };

  const handleFinalCompile = () => {
    const compileMap: Record<string, string> = {};
    let count = 0;
    
    rows.forEach(row => {
      if (row.selected && row.current.trim() !== "") {
        compileMap[row.original] = row.current;
        count++;
      }
    });

    if (count === 0) {
      toast.error("Please select at least one proposal change to compile.");
      return;
    }

    onCompile(compileMap);
  };

  const filteredRows = rows.filter(row => {
    if (filter === "selected") return row.selected;
    if (filter === "excluded") return !row.selected;
    return true;
  });

  const selectedCount = rows.filter(r => r.selected).length;

  return (
    <div className="space-y-6 w-full pb-20">
      
      {/* Header Command Center */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl border border-zinc-200/60 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem]"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#CFEE91]/40 border border-[#CFEE91]/50 text-[#269755] text-[10px] font-mono font-bold px-3 py-1 tracking-widest uppercase rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Synthesis Review
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 mb-2">
            The Alchemy Chamber
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl font-medium">
            Review the AI-generated contextual alignments. Approve segments, edit copies manually, and monitor character overflow metrics before compilation.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="bg-white border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 px-6 py-3.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all shadow-sm"
          >
            DISCARD
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinalCompile}
            className="bg-zinc-950 hover:bg-zinc-800 text-white px-7 py-3.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
          >
            COMPILE DECK <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Grid: Left Column is Diff Editor, Right Column is Dossier Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Diff rows editor */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Filters & Bulk selectors */}
          <div className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs font-mono">
            <div className="flex items-center gap-4 pl-2">
              <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                <Filter className="w-3.5 h-3.5" /> Filter
              </div>
              <div className="flex bg-zinc-100/80 border border-zinc-200/50 rounded-lg p-1">
                {[
                  { id: "all", label: `All (${rows.length})` },
                  { id: "selected", label: `Kept (${selectedCount})` },
                  { id: "excluded", label: `Dropped (${rows.length - selectedCount})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`px-4 py-1.5 rounded-md font-bold transition-all duration-300 ${
                      filter === f.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pr-2 text-[10px] tracking-widest">
              <button onClick={() => handleBulkSelect(true)} className="text-[#269755] hover:text-[#1d7240] font-bold transition-colors">
                SELECT ALL
              </button>
              <span className="text-zinc-300">|</span>
              <button onClick={() => handleBulkSelect(false)} className="text-zinc-400 hover:text-red-500 font-bold transition-colors">
                EXCLUDE ALL
              </button>
            </div>
          </div>

          {/* Diff list items */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const originalLength = row.original.length;
                  const currentLength = row.current.length;
                  const ratio = currentLength / (originalLength || 1);
                  const isTooLong = ratio > 1.25 && currentLength - originalLength > 15;
                  const percentIncrease = Math.round((ratio - 1) * 100);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={springTransition}
                      key={row.id}
                      className={`transition-all p-6 relative rounded-[1.5rem] shadow-sm backdrop-blur-md overflow-hidden ${
                        row.selected 
                          ? "bg-white border-2 border-[#269755]/20 shadow-[0_4px_20px_rgba(16,185,129,0.03)]" 
                          : "bg-white/40 border-2 border-zinc-200/50 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* Segmented control / Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-zinc-100/80">
                        <div className="flex items-center gap-4">
                          <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200/60">
                            <button
                              type="button"
                              onClick={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: false } : r))}
                              className={`px-4 py-1.5 text-[10px] font-mono font-bold transition-all rounded-md flex items-center gap-1.5 ${
                                !row.selected ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-700"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: true } : r))}
                              className={`px-4 py-1.5 text-[10px] font-mono font-bold transition-all rounded-md flex items-center gap-1.5 ${
                                row.selected ? "bg-[#CFEE91]/40 text-[#1d7240] shadow-sm" : "text-zinc-400 hover:text-zinc-700"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          </div>
                          
                          <span className={`text-[9px] font-mono font-bold px-3 py-1.5 tracking-widest uppercase rounded-full ${
                            row.selected ? "bg-[#269755]/10 text-[#269755]" : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {row.selected ? "Will Sync" : "Preserving Original"}
                          </span>
                        </div>

                        <AnimatePresence>
                          {row.selected && row.current !== row.proposed && (
                            <motion.button
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              onClick={() => handleResetRow(row.id)}
                              className="text-zinc-400 hover:text-zinc-900 flex items-center gap-1.5 hover:underline text-[10px] font-mono uppercase tracking-widest transition-colors"
                              title="Reset to AI proposal"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore AI Edit
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Side-by-Side Diff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Original */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Master Template
                          </span>
                          <div className="p-4 bg-zinc-50/50 border border-zinc-100 text-xs leading-relaxed text-zinc-500 font-medium rounded-xl select-none h-[calc(100%-24px)] min-h-[100px]">
                            {row.original}
                          </div>
                        </div>

                        {/* Right: Proposal (Editable) */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-mono tracking-widest text-[#269755] uppercase font-bold flex items-center justify-between">
                            <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Custom Target</span>
                            <span className={`font-normal lowercase ${isTooLong ? "text-red-500 font-bold" : "text-zinc-400"}`}>
                              {row.current.length} chars (orig: {originalLength})
                            </span>
                          </span>
                          <textarea
                            value={row.current}
                            onChange={(e) => handleTextChange(row.id, e.target.value)}
                            disabled={!row.selected}
                            className={`w-full p-4 text-xs leading-relaxed font-semibold focus:outline-none transition-all border rounded-xl h-[calc(100%-24px)] min-h-[100px] ${
                              !row.selected 
                                ? "bg-transparent border-zinc-200 text-zinc-400 resize-none opacity-50" 
                                : isTooLong
                                  ? "bg-red-50/30 border-red-300 text-zinc-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                                  : "bg-white border-zinc-200 text-zinc-900 focus:border-[#269755] focus:ring-4 focus:ring-[#269755]/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Layout Overflow Alerts */}
                      <AnimatePresence>
                        {row.selected && isTooLong && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-5 bg-red-50 border border-red-100 p-4 flex items-start gap-3 text-xs font-medium text-red-900 leading-relaxed rounded-xl shadow-sm"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-1">Slide Layout Risk</span>
                              Text is <span className="font-mono bg-red-100 px-1 py-0.5 rounded text-[10px]">{percentIncrease}%</span> longer than original (+{currentLength - originalLength} chars). This may overflow standard presentation bounding boxes. Please compress the copy.
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] p-16 text-center text-sm font-mono text-zinc-400 flex flex-col items-center"
                >
                  <Filter className="w-10 h-10 mb-4 text-zinc-300" strokeWidth={1} />
                  No proposed modifications match the current view filter.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Sponsor mandate details */}
        <div className="xl:col-span-4 space-y-6">
          
          <div className="bg-white/70 backdrop-blur-xl border border-zinc-200/60 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col gap-4 sticky top-24">
            <div className="text-[10px] font-mono tracking-widest text-zinc-900 uppercase font-bold flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Layers className="w-4 h-4 text-[#269755]" />
              Sponsor Dossier Intel
            </div>
            
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Below is the raw intelligence scraped from the target's domain. The generative engine referenced this data directly to tailor alignment priorities.
            </p>

            <button
              onClick={() => setIsDossierOpen(!isDossierOpen)}
              className="w-full flex items-center justify-between border border-zinc-200 bg-white p-4 text-[10px] font-mono font-bold tracking-widest hover:bg-zinc-50 transition-colors rounded-xl shadow-sm uppercase mt-2 text-zinc-700"
            >
              <span>{isDossierOpen ? "Collapse Data" : "Expand Raw Data"}</span>
              <motion.div animate={{ rotate: isDossierOpen ? 180 : 0 }} transition={fastSpring}>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isDossierOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springTransition}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-xl text-[11px] font-mono text-zinc-700 font-medium leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                    {scrapedContext || "No scraped context available."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-5 mt-4 space-y-2.5">
              <div className="text-[10px] font-mono tracking-widest text-blue-600 uppercase font-bold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Formatting Guarantee
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed font-medium">
                Rejecting a replacement preserves the exact XML slide text as it exists in the master deck. Font weights, colors, and layout structures are perfectly maintained.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

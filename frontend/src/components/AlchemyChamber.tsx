"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckSquare,
  Square,
  FileText,
  ChevronDown,
  ChevronRight
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

  const handleToggleSelect = (id: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, selected: !row.selected } : row
    ));
  };

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
    // Build the final replacements map
    // For selected rows, we use the user-edited current text
    // For unselected rows, we exclude them entirely (meaning the original text remains in the pptx)
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
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#EAEAEA] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#476501]/10 text-[#476501] text-[10px] font-mono font-bold px-2 py-0.5 tracking-wider uppercase">
              Phase 2: Review Chamber
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#111111]" style={{ fontFamily: "var(--font-playfair-display), serif" }}>
            The Alchemy Chamber
          </h2>
          <p className="text-xs text-[#757968] mt-1 max-w-[550px]">
            Review Gemini's copywriting proposals side-by-side. Check the ones you wish to apply, edit copies directly, and inspect word overflows before compiling.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="border border-[#EAEAEA] bg-white text-[#757968] hover:text-[#111111] px-4 py-2.5 text-xs font-mono font-bold transition-all"
          >
            DISCARD
          </button>
          
          <button
            onClick={handleFinalCompile}
            className="bg-[#1A1C15] hover:bg-[#2F3129] text-white px-5 py-2.5 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            COMPILE DECK <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Left Column is Diff Editor, Right Column is Dossier Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Diff rows editor */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters & Bulk selectors */}
          <div className="bg-white border border-[#EAEAEA] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-[#757968] font-bold">FILTERS:</span>
              <div className="flex border border-[#EAEAEA] rounded overflow-hidden">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 transition-colors ${filter === "all" ? "bg-[#1A1C15] text-white" : "bg-white text-[#757968] hover:bg-[#FBFBFA]"}`}
                >
                  All ({rows.length})
                </button>
                <button
                  onClick={() => setFilter("selected")}
                  className={`px-3 py-1.5 transition-colors border-l border-r border-[#EAEAEA] ${filter === "selected" ? "bg-[#1A1C15] text-white" : "bg-white text-[#757968] hover:bg-[#FBFBFA]"}`}
                >
                  Selected ({selectedCount})
                </button>
                <button
                  onClick={() => setFilter("excluded")}
                  className={`px-3 py-1.5 transition-colors ${filter === "excluded" ? "bg-[#1A1C15] text-white" : "bg-white text-[#757968] hover:bg-[#FBFBFA]"}`}
                >
                  Excluded ({rows.length - selectedCount})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkSelect(true)}
                className="text-[#476501] hover:underline font-bold"
              >
                SELECT ALL
              </button>
              <span className="text-[#B0B0A8]">|</span>
              <button
                onClick={() => handleBulkSelect(false)}
                className="text-[#ED6A5E] hover:underline font-bold"
              >
                EXCLUDE ALL
              </button>
            </div>
          </div>

          {/* Diff list items */}
          <div className="space-y-4">
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => {
                // Calculate size comparison warning
                const originalLength = row.original.length;
                const currentLength = row.current.length;
                const ratio = currentLength / (originalLength || 1);
                const isTooLong = ratio > 1.25 && currentLength - originalLength > 15;
                const percentIncrease = Math.round((ratio - 1) * 100);

                return (
                  <motion.div
                    key={row.id}
                    layout
                    className={`border transition-all p-6 relative rounded-sm ${
                      row.selected 
                        ? "border-[#476501]/40 bg-white shadow-[0_4px_16px_rgba(71,101,1,0.04)]" 
                        : "border-[#EAEAEA] bg-[#FAF9F6]/40 opacity-70"
                    }`}
                  >
                    {/* Row Header toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#F5F5F3]">
                      <div className="flex items-center gap-3">
                        {/* Segmented control buttons */}
                        <div className="flex border border-[#EAEAEA] rounded overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: false } : r))}
                            className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                              !row.selected 
                                ? "bg-[#757968] text-white" 
                                : "bg-white text-[#757968] hover:bg-[#FBFBFA]"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            Keep Original
                          </button>
                          <button
                            type="button"
                            onClick={() => setRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: true } : r))}
                            className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                              row.selected 
                                ? "bg-[#476501] text-white" 
                                : "bg-white text-[#757968] hover:bg-[#FBFBFA]"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Apply Suggestion
                          </button>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[9px] font-mono font-bold px-2.5 py-1 tracking-wider uppercase rounded-sm ${
                          row.selected 
                            ? "bg-[#476501]/10 text-[#476501]" 
                            : "bg-[#757968]/10 text-[#757968]"
                        }`}>
                          {row.selected ? "Applying Personalization" : "Keeping Original Copy"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        {row.selected && row.current !== row.proposed && (
                          <button
                            onClick={() => handleResetRow(row.id)}
                            className="text-[#757968] hover:text-[#111111] flex items-center gap-1 hover:underline"
                            title="Reset to Gemini proposal"
                          >
                            <RotateCcw className="w-3 h-3" />
                            REVERT TO SUGGESTION
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Side-by-Side Diff */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Original */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono tracking-widest text-[#757968] uppercase font-bold block">
                          Original presentation text
                        </span>
                        <div className="p-3 bg-[#FBFBFA] border border-[#F0EFEA] text-xs leading-relaxed text-[#55594e] font-sans rounded-sm select-none">
                          {row.original}
                        </div>
                      </div>

                      {/* Right: Proposal (Editable) */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono tracking-widest text-[#476501] uppercase font-bold flex items-center justify-between">
                          <span>Personalized proposal</span>
                          <span className="font-normal font-mono text-[9px] text-[#757968] lowercase">
                            {row.current.length} chars (org: {originalLength})
                          </span>
                        </span>
                        <textarea
                          value={row.current}
                          onChange={(e) => handleTextChange(row.id, e.target.value)}
                          disabled={!row.selected}
                          className={`w-full p-3 text-xs leading-relaxed font-sans focus:outline-none transition-all border rounded-sm ${
                            !row.selected 
                              ? "bg-transparent border-[#EAEAEA] text-[#757968] resize-none" 
                              : isTooLong
                                ? "bg-white border-[#E4A11B] text-[#111111] focus:border-[#E4A11B] focus:ring-1 focus:ring-[#E4A11B]"
                                : "bg-white border-[#EAEAEA] text-[#111111] focus:border-[#476501] focus:ring-1 focus:ring-[#476501]"
                          }`}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Layout Overflow Alerts */}
                    {row.selected && isTooLong && (
                      <div className="mt-4 bg-[#FEF9EC] border border-[#FCE8B2] px-4 py-3 flex items-start gap-2 text-xs font-mono text-[#8C7A5C] leading-normal rounded-sm">
                        <AlertTriangle className="w-4 h-4 text-[#E4A11B] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-0.5">Potential Slide Overflow Warning</span>
                          Text is {percentIncrease}% longer than original (+{currentLength - originalLength} characters). This might break formatting on standard slide boxes. Try shortening the copy.
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white border border-[#EAEAEA] p-12 text-center text-xs font-mono text-[#757968]">
                No proposed modifications match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sponsor mandate details */}
        <div className="space-y-4">
          <div className="bg-white border border-[#EAEAEA] p-6 shadow-sm space-y-4">
            <div className="text-xs font-mono tracking-widest text-[#757968] uppercase font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#476501]" />
              Sponsor Dossier Intel
            </div>
            
            <p className="text-xs text-[#757968] leading-relaxed">
              Below is the raw intelligence context scraped from the sponsor website. Gemini referenced this text strictly to tailor alignment replacements.
            </p>

            <button
              onClick={() => setIsDossierOpen(!isDossierOpen)}
              className="w-full flex items-center justify-between border border-[#EAEAEA] p-3 text-xs font-mono hover:bg-[#FBFBFA]"
            >
              <span>{isDossierOpen ? "COLLAPSE DOSSIER" : "EXPAND DOSSIER"}</span>
              {isDossierOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isDossierOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[#FBFBFA] border border-[#EAEAEA] p-4 text-[11px] font-mono text-[#44493A] leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap"
              >
                {scrapedContext || "No scraped context available."}
              </motion.div>
            )}
          </div>

          <div className="bg-[#476501]/5 border border-[#476501]/10 p-6 space-y-3">
            <div className="text-xs font-mono tracking-widest text-[#476501] uppercase font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Safety Check
            </div>
            <p className="text-xs text-[#44493a] leading-relaxed">
              If you exclude a replacement, FundSync will preserve the exact slide text as it was in the master pitch deck. All font styling, colors, and paragraph structures are maintained.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

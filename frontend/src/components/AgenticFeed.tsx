import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAGE_MESSAGES = [
  // Stage 0: Initialization / Document Parsing
  [
    "Initializing agentic synthesis...",
    "Extracting paragraph shapes from Master Deck...",
    "Parsing table variables and grouping boxes...",
    "Document structural scan complete."
  ],
  // Stage 1: Scrape Target Sponsor
  [
    "Initializing Firecrawl scraping agent...",
    "Locating CSR and Corporate Governance pages...",
    "Extracting key mandates and target initiatives...",
    "Contextual intelligence gathered successfully."
  ],
  // Stage 2: Gemini Synthesis
  [
    "Booting Gemini Tonal Synthesis engine...",
    "Mapping custom directives and tone constraints...",
    "Rewriting slide hooks to align with sponsor mandates...",
    "Finalizing paragraph replacements...",
    "Ready for user review."
  ],
  // Stage 3: Compiling
  [
    "Validating proposed XML structures...",
    "Reviewing visual bounds...",
    "Ready for final compile."
  ]
];

export function AgenticFeed({ logStage }: { logStage: number }) {
  const [messages, setMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const stageLines = STAGE_MESSAGES[logStage] || [];
    let currentLineIndex = 0;

    const addNextLine = () => {
      if (currentLineIndex < stageLines.length) {
        const newLine = stageLines[currentLineIndex];
        setMessages(prev => [...prev, newLine]);
        currentLineIndex++;
        
        // Auto-scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        
        timeout = setTimeout(addNextLine, 800 + Math.random() * 1000); // Random delay
      }
    };

    timeout = setTimeout(addNextLine, 500);

    return () => clearTimeout(timeout);
  }, [logStage]);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[650px] bg-[#FBFBFA]/50 border border-[#EAEAEA] rounded-sm p-6 h-[200px] overflow-y-auto font-mono text-sm flex flex-col gap-3 shadow-inner"
    >
      <AnimatePresence>
        {messages.map((msg, idx) => (
          <motion.div
            key={`${logStage}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#44493A] flex gap-3"
          >
            <span className="text-[#476501]">➜</span>
            {msg}
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.div 
        animate={{ opacity: [1, 0, 1] }} 
        transition={{ repeat: Infinity, duration: 1 }}
        className="w-2.5 h-4 bg-[#476501] inline-block mt-2 ml-7"
      />
    </div>
  );
}

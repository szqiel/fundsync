"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ 
          x: ["0%", "5%", "0%", "-5%", "0%"],
          y: ["0%", "-5%", "5%", "0%", "0%"],
          scale: [1, 1.05, 0.95, 1.05, 1],
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#CFEE91]/40 blur-[120px] opacity-60" 
      />
      <motion.div 
        animate={{ 
          x: ["0%", "-5%", "5%", "0%", "0%"],
          y: ["0%", "5%", "-5%", "0%", "0%"],
          scale: [1, 0.95, 1.05, 0.95, 1],
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear",
          delay: 2
        }}
        className="absolute -bottom-[20%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-zinc-200/50 blur-[100px] opacity-60" 
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
    </div>
  );
}

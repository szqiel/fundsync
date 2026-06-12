"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Search, Compass, RefreshCcw, ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";

// Animation variants for staggered load-in
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

export default function About() {
  return (
    <div className="min-h-[100dvh] bg-[#F3EFE7] flex flex-col font-sans text-zinc-900 selection:bg-emerald-200 selection:text-emerald-950 relative overflow-hidden">
      <AmbientBackground />

      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between px-6 lg:px-12 py-6 relative z-50">
        <Link 
          href="/" 
          className="font-bold text-xl tracking-tight text-zinc-950 cursor-pointer flex items-center gap-2 group" 
        >
          <Image src="/FundSync_Logo.svg" alt="FundSync Logo" width={48} height={48} className="transition-transform group-hover:scale-95 group-active:scale-90" />
          FundSync
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono text-[11px] font-semibold tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors uppercase hidden sm:block">
            Dashboard
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-16 px-6 pb-24 max-w-[1200px] mx-auto w-full relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-20 max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tighter mb-8 text-zinc-950 leading-[0.95]">
              The Mission
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 leading-relaxed font-light">
              FundSync equips lean organizations and event committees with the strategic bandwidth of a dedicated corporate sponsorships team. We automate the grueling process of corporate research and pitch deck personalization, allowing you to secure vital funding faster, with profound precision.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div 
            variants={itemVariants} 
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
          >
            {/* Card 1: SCRAPE */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_48px_-12px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CFEE91]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 text-zinc-900 shadow-sm border border-zinc-100 relative z-10">
                <Search className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-3 relative z-10">
                01 // AUDIT
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-950 tracking-tight relative z-10">
                Intelligent Scrape
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light relative z-10">
                We actively analyze target sponsor websites, extracting high-signal data points regarding their Corporate Social Responsibility (CSR) goals, recent philanthropic initiatives, and core brand mandates.
              </p>
            </div>

            {/* Card 2: MAP */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_48px_-12px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col relative group overflow-hidden md:-translate-y-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CFEE91]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 text-zinc-900 shadow-sm border border-zinc-100 relative z-10">
                <Compass className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-3 relative z-10">
                02 // ALIGN
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-950 tracking-tight relative z-10">
                Semantic Mapping
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light relative z-10">
                Our proprietary LLM engine maps your existing sponsorship deck's value proposition directly to the extracted corporate mandates, identifying the highest-probability angles for strategic alignment.
              </p>
            </div>

            {/* Card 3: SYNC */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_48px_-12px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CFEE91]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 text-zinc-900 shadow-sm border border-zinc-100 relative z-10">
                <RefreshCcw className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-3 relative z-10">
                03 // SYNCHRONIZE
              </div>
              <h3 className="text-2xl font-bold mb-4 text-zinc-950 tracking-tight relative z-10">
                Seamless Synthesis
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light relative z-10">
                FundSync natively manipulates your .pptx files, autonomously injecting the personalized copy, tailored statistics, and adjusting formatting elements to reflect the target sponsor's brand identity.
              </p>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={itemVariants} 
            className="w-full flex flex-col items-center text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-zinc-950 tracking-tight">
              Ready to scale your outreach?
            </h2>
            <Link href="/auth">
              <MagneticButton className="bg-zinc-900 text-white px-8 py-4 rounded-full font-mono text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:bg-zinc-800">
                Get Started Now <ArrowUpRight className="w-4 h-4" />
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 lg:px-12 py-8 mt-auto relative z-10 border-t border-zinc-200/50">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase font-semibold">
            © 2026 FundSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

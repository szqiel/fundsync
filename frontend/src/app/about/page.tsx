"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Search, Compass, RefreshCcw, ArrowLeft, ArrowUpRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A] selection:bg-[#CFEE91] selection:text-[#476501]">
      {/* Top Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#EAEAEA]">
        <Link 
          href="/" 
          className="font-serif font-bold text-2xl text-[#476501] flex items-center gap-2 hover:opacity-85 transition-opacity" 
          style={{ fontFamily: "var(--font-playfair-display), serif" }}
        >
          FundSync
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#44493a]">
          <Link href="/" className="flex items-center gap-1 hover:text-[#476501] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </nav>
        <Link href="/">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            className="bg-[#476501] text-white px-6 py-2.5 rounded hover:bg-[#5f7f1f] transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#476501] focus:ring-offset-2"
          >
            Get Started
          </motion.button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-16 px-6 pb-24 max-w-[1120px] mx-auto w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-16 max-w-3xl">
            <h1 
              className="text-5xl md:text-6xl font-serif font-bold tracking-tight mb-6 text-[#111111]" 
              style={{ fontFamily: "var(--font-playfair-display), serif" }}
            >
              The Mission
            </h1>
            <div className="w-16 h-1 bg-[#476501] mx-auto mb-8"></div>
            
            <p className="text-lg text-[#44493A] leading-relaxed pl-6 border-l-4 border-[#476501] text-left md:text-center md:border-none md:pl-0">
              FundSync equips lean organizations and event committees with the strategic bandwidth of a dedicated corporate sponsorships team. We automate the grueling process of corporate research and pitch deck personalization, allowing you to secure vital funding faster, with profound precision.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div 
            variants={itemVariants} 
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          >
            {/* Card 1: SCRAPE */}
            <motion.div 
              whileHover={{ 
                borderColor: "#476501", 
                backgroundColor: "#CFEE91", 
                y: -4,
                transition: { duration: 0.2 } 
              }}
              className="bg-white border border-[#EAEAEA] rounded-lg p-8 flex flex-col transition-colors duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
            >
              <div className="w-12 h-12 bg-[#F0EFEA] rounded-md flex items-center justify-center mb-6 text-[#476501]">
                <Search className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-xs text-[#757968] tracking-widest uppercase mb-2">
                01 // AUDIT
              </div>
              <h3 
                className="font-serif text-2xl font-bold mb-4 text-[#111111]" 
                style={{ fontFamily: "var(--font-playfair-display), serif" }}
              >
                Intelligent Scrape
              </h3>
              <p className="text-[#44493A] text-sm leading-relaxed">
                We actively analyze target sponsor websites, extracting high-signal data points regarding their Corporate Social Responsibility (CSR) goals, recent philanthropic initiatives, and core brand mandates.
              </p>
            </motion.div>

            {/* Card 2: MAP */}
            <motion.div 
              whileHover={{ 
                borderColor: "#476501", 
                backgroundColor: "#CFEE91", 
                y: -4,
                transition: { duration: 0.2 } 
              }}
              className="bg-white border border-[#EAEAEA] rounded-lg p-8 flex flex-col transition-colors duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
            >
              <div className="w-12 h-12 bg-[#F0EFEA] rounded-md flex items-center justify-center mb-6 text-[#476501]">
                <Compass className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-xs text-[#757968] tracking-widest uppercase mb-2">
                02 // ALIGN
              </div>
              <h3 
                className="font-serif text-2xl font-bold mb-4 text-[#111111]" 
                style={{ fontFamily: "var(--font-playfair-display), serif" }}
              >
                Semantic Mapping
              </h3>
              <p className="text-[#44493A] text-sm leading-relaxed">
                Our proprietary LLM engine maps your existing sponsorship deck's value proposition directly to the extracted corporate mandates, identifying the highest-probability angles for strategic alignment.
              </p>
            </motion.div>

            {/* Card 3: SYNC */}
            <motion.div 
              whileHover={{ 
                borderColor: "#476501", 
                backgroundColor: "#CFEE91", 
                y: -4,
                transition: { duration: 0.2 } 
              }}
              className="bg-white border border-[#EAEAEA] rounded-lg p-8 flex flex-col transition-colors duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
            >
              <div className="w-12 h-12 bg-[#F0EFEA] rounded-md flex items-center justify-center mb-6 text-[#476501]">
                <RefreshCcw className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-xs text-[#757968] tracking-widest uppercase mb-2">
                03 // SYNCHRONIZE
              </div>
              <h3 
                className="font-serif text-2xl font-bold mb-4 text-[#111111]" 
                style={{ fontFamily: "var(--font-playfair-display), serif" }}
              >
                Seamless Synthesis
              </h3>
              <p className="text-[#44493A] text-sm leading-relaxed">
                FundSync natively manipulates your .pptx files, autonomously injecting the personalized copy, tailored statistics, and adjusting formatting elements to reflect the target sponsor's brand identity.
              </p>
            </motion.div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={itemVariants} 
            className="w-full border-t border-[#EAEAEA] pt-16 flex flex-col items-center text-center"
          >
            <h2 
              className="font-serif text-3xl md:text-4xl font-bold mb-8 text-[#111111]"
              style={{ fontFamily: "var(--font-playfair-display), serif" }}
            >
              Ready to scale your outreach?
            </h2>
            <Link href="/">
              <motion.button 
                whileTap={{ scale: 0.97 }}
                className="bg-[#1A1C15] text-white hover:bg-[#2F3129] px-8 py-4 rounded font-mono text-sm tracking-widest uppercase transition-colors flex items-center gap-2"
              >
                Get Started Now <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full px-12 py-8 border-t border-[#EAEAEA] flex flex-col md:flex-row items-center justify-between font-mono text-xs text-[#111111] font-bold">
        <div>© 2024 FundSync AI. All rights reserved.</div>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium text-[#757968]">
          <Link href="/" className="hover:text-[#111111] transition-colors">Dashboard</Link>
          <a href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#111111] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#111111] transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

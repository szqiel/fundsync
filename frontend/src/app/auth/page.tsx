"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, Variants } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, Lock, Mail, Key } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";

// Premium Spring Physics
const springTransition = { type: "spring" as const, duration: 0.4, bounce: 0 };
const fastSpring = { type: "spring" as const, duration: 0.25, bounce: 0 };

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: springTransition
  }
};

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    // If user is already logged in, redirect to home
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to FundSync!");
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Verification email sent! Check your inbox.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col font-sans text-zinc-900 selection:bg-emerald-200 selection:text-emerald-950 relative overflow-hidden">
      
      {/* Abstract Background Noise / Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#CFEE91]/40 blur-[120px] opacity-60" />
        <div className="absolute -bottom-[20%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-zinc-200/50 blur-[100px] opacity-60" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      {/* Top Header */}
      <header className="w-full flex items-center justify-between px-6 lg:px-12 py-6 relative z-50">
        <Link 
          href="/" 
          className="font-bold text-xl tracking-tight text-zinc-950 cursor-pointer flex items-center gap-2 group" 
        >
          <Image src="/FundSync_Logo.svg" alt="FundSync Logo" width={48} height={48} className="transition-transform group-hover:scale-95" />
          FundSync
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors bg-white/50 px-4 py-2 rounded-full border border-zinc-200/60 backdrop-blur-md shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="w-full max-w-[440px] bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_48px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 rounded-[2.5rem]"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#CFEE91]/40 rounded-[1.25rem] flex items-center justify-center mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#CFEE91]/50 overflow-hidden">
              <Image src="/FundSync_Logo.svg" alt="FundSync Logo" width={64} height={64} className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mb-2">
              {mode === "signin" ? "Welcome Back" : "Create Workspace"}
            </h1>
            <p className="text-sm font-medium text-zinc-500">
              {mode === "signin" 
                ? "Access your personalized pitch decks." 
                : "Register to personalize and compile decks."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold pl-1">
                Email Address
              </label>
              <div className="relative flex items-center bg-white border border-zinc-200/80 rounded-xl focus-within:border-[#269755]/50 focus-within:ring-4 focus-within:ring-[#269755]/10 transition-all shadow-sm">
                <div className="pl-4 pr-2">
                  <Mail className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full h-12 bg-transparent outline-none text-zinc-900 placeholder-zinc-300 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-bold pl-1">
                Password
              </label>
              <div className="relative flex items-center bg-white border border-zinc-200/80 rounded-xl focus-within:border-[#269755]/50 focus-within:ring-4 focus-within:ring-[#269755]/10 transition-all shadow-sm">
                <div className="pl-4 pr-2">
                  <Key className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 bg-transparent outline-none text-zinc-900 placeholder-zinc-300 text-sm font-semibold"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={fastSpring}
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 text-white h-12 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50 text-sm font-bold tracking-wide rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                mode === "signin" ? "Sign In" : "Register Account"
              )}
            </motion.button>
          </form>

          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-zinc-300 uppercase">OR CONNECT</span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={fastSpring}
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-zinc-200/80 text-zinc-700 h-12 flex items-center justify-center gap-3 hover:text-zinc-950 transition-colors text-sm font-bold tracking-wide rounded-xl shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.357 2.72 1.487 6.643l3.779 3.122z" />
              <path fill="#4285F4" d="M23.49 12.275c0-.825-.074-1.62-.21-2.386H12v4.514h6.438a5.503 5.503 0 0 1-2.39 3.614l3.722 2.883c2.18-2.008 3.72-4.97 3.72-8.625z" />
              <path fill="#FBBC05" d="M5.266 14.235a7.195 7.195 0 0 1-.377-2.235c0-.783.136-1.536.377-2.235L1.487 6.643A11.968 11.968 0 0 0 0 12c0 1.92.453 3.737 1.258 5.357l4.008-3.122z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.075 7.96-2.924l-3.722-2.883c-1.033.692-2.355 1.107-4.238 1.107-3.264 0-6.033-2.204-7.018-5.176l-4.008 3.122A11.972 11.972 0 0 0 12 24z" />
            </svg>
            Sign In with Google
          </motion.button>

          <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-500 font-medium">
              {mode === "signin" ? "New to FundSync?" : "Already registered?"}
            </span>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-zinc-950 font-bold hover:underline tracking-wide uppercase"
            >
              {mode === "signin" ? "Create Account" : "Sign In"}
            </button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            <Lock className="w-3 h-3" /> Secure Connection
          </div>
        </motion.div>
      </main>

      <footer className="py-6 border-t border-zinc-200/60 text-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-medium relative z-50">
        © 2026 FundSync. All rights reserved.
      </footer>
    </div>
  );
}

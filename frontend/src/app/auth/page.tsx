"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, Lock, Mail, Key } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A] selection:bg-[#CFEE91] selection:text-[#476501]">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 border-b border-[#EAEAEA]">
        <Link 
          href="/" 
          className="font-serif font-bold text-2xl text-[#476501] hover:opacity-85 transition-opacity"
          style={{ fontFamily: "var(--font-playfair-display), serif" }}
        >
          FundSync
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-[#757968] hover:text-[#476501] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Guest Uploader
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-[480px] bg-white border border-[#EAEAEA] p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-sm"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-[#F0EFEA] rounded-xl flex items-center justify-center mb-4 text-[#476501]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 
              className="text-3xl font-serif font-bold text-[#111111] mb-2"
              style={{ fontFamily: "var(--font-playfair-display), serif" }}
            >
              {mode === "signin" ? "Welcome Back" : "Create Workspace"}
            </h1>
            <p className="text-sm text-[#757968]">
              {mode === "signin" 
                ? "Unlock your CRM hub, saved library, and generation history" 
                : "Register to personalize, save decks, and compile dossiers"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-widest text-[#757968] uppercase block">
                Email Address
              </label>
              <div className="relative flex items-center border-b border-[#EAEAEA] focus-within:border-[#476501] transition-colors pb-2">
                <Mail className="w-4 h-4 text-[#757968] mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-transparent outline-none text-[#111111] placeholder-[#B0B0A8] text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono tracking-widest text-[#757968] uppercase block">
                Password
              </label>
              <div className="relative flex items-center border-b border-[#EAEAEA] focus-within:border-[#476501] transition-colors pb-2">
                <Key className="w-4 h-4 text-[#757968] mr-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent outline-none text-[#111111] placeholder-[#B0B0A8] text-sm"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1C15] text-white h-12 flex items-center justify-center gap-2 hover:bg-[#2F3129] transition-colors disabled:opacity-50 text-sm font-medium rounded-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                mode === "signin" ? "Sign In" : "Register Workspace"
              )}
            </motion.button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-[#B0B0A8] uppercase">OR CONNECT</span>
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-[#EAEAEA] bg-white text-[#1A1C15] h-12 flex items-center justify-center gap-3 hover:bg-[#FBFBFA] transition-colors text-sm font-medium rounded-sm shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.357 2.72 1.487 6.643l3.779 3.122z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.074-1.62-.21-2.386H12v4.514h6.438a5.503 5.503 0 0 1-2.39 3.614l3.722 2.883c2.18-2.008 3.72-4.97 3.72-8.625z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235a7.195 7.195 0 0 1-.377-2.235c0-.783.136-1.536.377-2.235L1.487 6.643A11.968 11.968 0 0 0 0 12c0 1.92.453 3.737 1.258 5.357l4.008-3.122z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.075 7.96-2.924l-3.722-2.883c-1.033.692-2.355 1.107-4.238 1.107-3.264 0-6.033-2.204-7.018-5.176l-4.008 3.122A11.972 11.972 0 0 0 12 24z"
              />
            </svg>
            Sign In with Google
          </motion.button>

          <div className="mt-8 pt-6 border-t border-[#EAEAEA] flex justify-between items-center text-xs font-mono">
            <span className="text-[#757968]">
              {mode === "signin" ? "New to FundSync?" : "Already registered?"}
            </span>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-[#476501] font-bold hover:underline"
            >
              {mode === "signin" ? "Create Account" : "Sign In Here"}
            </button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-2 text-[10px] font-mono text-[#B0B0A8] uppercase tracking-wider">
            <Lock className="w-3 h-3" /> Secure B2B Cryptographic Gate
          </div>
        </motion.div>
      </main>

      <footer className="py-6 border-t border-[#EAEAEA] text-center text-[10px] font-mono text-[#B0B0A8] uppercase tracking-wider">
        © 2026 FundSync. All rights reserved.
      </footer>
    </div>
  );
}

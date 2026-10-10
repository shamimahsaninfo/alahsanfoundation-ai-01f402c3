import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Phone, Lock, Eye, EyeOff, HelpCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "আল আহসান এআই — Al Ahsan AI" },
      { name: "description", content: "মুহিউস সুন্নাহ ফাউন্ডেশন বাংলাদেশের শক্তিশালী বাংলা এআই সহকারী।" },
      { property: "og:title", content: "আল আহসান এআই — Al Ahsan AI" },
      { property: "og:description", content: "শক্তিশালী বাংলা এআই সহকারী — লিখুন বা কথা বলুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

// বাংলা ডিজিটকে ইংরেজি ডিজিটে রূপান্তর
function toEnglishDigits(str: string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
}

// ফোন নম্বর পরিষ্কার ও স্ট্যান্ডার্ড ১১ ডিজিট (01XXXXXXXXX) যাচাই
function normalizeBdPhone(input: string): { valid: boolean; normalized: string; error?: string } {
  let cleaned = toEnglishDigits(input).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+880")) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith("880")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);

  if (!cleaned.startsWith("0")) cleaned = "0" + cleaned;

  const bdRegex = /^01[3-9]\d{8}$/;
  if (!bdRegex.test(cleaned)) {
    return { valid: false, normalized: cleaned, error: "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01312515643)" };
  }
  return { valid: true, normalized: cleaned };
}

// ব্যাকএন্ডের জন্য ইউনিক ইলেকট্রনিক আইডেন্টিফায়ার
function phoneToIdentifier(phone: string): string {
  return `88${phone}@phone.alahsan.local`;
}

function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/chat" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  // মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন বা রেজিস্ট্রেশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    const phoneCheck = normalizeBdPhone(phone);
    if (!phoneCheck.valid) {
      setErr(phoneCheck.error || "মোবাইল নম্বরটি সঠিক নয়");
      return;
    }

    if (password.length < 6) {
      setErr("পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    setBusy(true);
    const identifier = phoneToIdentifier(phoneCheck.normalized);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErr("মোবাইল নম্বর বা পাসওয়ার্ড ভুল হয়েছে।");
          } else {
            setErr("লগইন ব্যর্থ হয়েছে: " + error.message);
          }
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: identifier,
          password: password,
          options: {
            data: {
              phone_number: phoneCheck.normalized,
              display_name: `ব্যবহারকারী (${phoneCheck.normalized.slice(-4)})`,
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            setErr("এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে। দয়া করে 'লগইন করুন' ট্যাবে যান।");
          } else {
            setErr("অ্যাকাউন্ট তৈরি ব্যর্থ: " + error.message);
          }
          setBusy(false);
          return;
        }
      }
      navigate({ to: "/chat" });
    } catch {
      setErr("সার্ভারের সাথে সংযোগে সমস্যা হয়েছে, কিছুক্ষণ পর চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErr("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      setErr("গুগল লগইন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
      setBusy(false);
    }
  };

  return (
    <main className="pattern-bg relative min-h-screen overflow-hidden text-foreground">
      {/* হেডার */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-display text-xl">আল আহসান এআই</span>
        </div>
      </header>

      {/* হিরো ও লগইন সেকশন */}
      <section className="relative flex flex-col items-center px-4 pb-20 pt-8 text-center sm:px-6">
        <div className="glow" />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center">
          <Logo size={72} />
          <p className="mt-4 font-display text-base tracking-[0.25em] text-primary">بِسْمِ اللّٰهِ</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">আল আহসান এআই</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">Al Ahsan AI</p>

          {/* লগইন / রেজিস্ট্রেশন কার্ড */}
          <div className="mt-8 w-full rounded-3xl border border-primary/30 bg-card/85 p-6 shadow-2xl backdrop-blur-md">
            {/* ট্যাব বার */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => { setTab("login"); setErr(""); }}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                  tab === "login" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                লগইন করুন
              </button>
              <button
                type="button"
                onClick={() => { setTab("signup"); setErr(""); }}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                  tab === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                নতুন অ্যাকাউন্ট
              </button>
            </div>

            {/* ফর্ম */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">মোবাইল নম্বর</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 h-4 w-4 text-primary/70" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01312515643"
                    className="w-full rounded-xl border border-border bg-background/80 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">পিন বা পাসওয়ার্ড</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-primary/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    className="w-full rounded-xl border border-border bg-background/80 py-3 pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {tab === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}

              {err && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 disabled:opacity-50 transition"
              >
                {busy ? "অপেক্ষা করুন..." : tab === "login" ? "লগইন করে চ্যাটে যান" : "অ্যাকাউন্ট তৈরি করুন"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">অথবা</span></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              গুগল দিয়ে প্রবেশ করুন
            </button>
          </div>
        </div>
      </section>

      {/* পাসওয়ার্ড ভুলে গেছেন সাহায্য মডাল */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2 text-primary font-display text-lg">
              <HelpCircle className="h-5 w-5" />
              <span>পাসওয়ার্ড সহায়তা</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              আপনার পাসওয়ার্ড পরিবর্তন করতে চাইলে আপনার নিবন্ধিত নম্বরটি থেকে ফাউন্ডেশন অ্যাডমিনের সাথে যোগাযোগ করুন অথবা গুগল অ্যাকাউন্ট দিয়ে সরাসরি প্রবেশ করতে পারেন।
            </p>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs">
              <p className="font-semibold text-foreground">ফাউন্ডেশন সহায়তা নম্বর:</p>
              <p className="text-primary mt-1">+8801312515643</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

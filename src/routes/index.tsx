import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "আল আহসান এআই — Al Ahsan AI" },
      { name: "description", content: "মুহিউস সুন্নাহ ফাউন্ডেশন বাংলাদেশের শক্তিশালী বাংলা এআই সহকারী, ভয়েস সহ।" },
      { property: "og:title", content: "আল আহসান এআই — Al Ahsan AI" },
      { property: "og:description", content: "শক্তিশালী বাংলা এআই সহকারী — লিখুন বা কথা বলুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
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

  const signIn = async () => {
    setBusy(true);
    setErr("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      setErr("লগইন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
      setBusy(false);
      return;
    }
    if (r.redirected) return;
    navigate({ to: "/chat" });
  };

  const features = [
    { t: "জ্ঞান ও গবেষণা", d: "যেকোনো বিষয়ে বিস্তারিত, সুসংগঠিত ও নির্ভরযোগ্য উত্তর।" },
    { t: "ইসলামি প্রশ্নোত্তর", d: "কুরআন ও সহিহ হাদিসের আলোকে সূত্রসহ সতর্ক উত্তর।" },
    { t: "লেখা ও অনুবাদ", d: "চিঠি, প্রবন্ধ, আবেদন — বাংলা, ইংরেজি, আরবিতে অনুবাদ।" },
    { t: "ওয়েবসাইট ও কোড", d: "চাইলেই সম্পূর্ণ ওয়েবসাইট তৈরি, সাথে সাথে লাইভ লিংক।" },
    { t: "কণ্ঠে কথা বলুন", d: "মাইক চেপে প্রশ্ন করুন, উত্তর শুনুন বাংলায়।" },
    { t: "নিরাপদ ও ব্যক্তিগত", d: "আপনার কথোপকথন শুধু আপনিই দেখতে পান।" },
  ];
  const faqs = [
    ["এটি কি বিনামূল্যে?", "হ্যাঁ, গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করে বিনামূল্যে ব্যবহার করতে পারবেন। ন্যায্য ব্যবহারের জন্য প্রতিদিন প্রশ্নের একটি সীমা আছে।"],
    ["আমার কথোপকথন কি সংরক্ষিত থাকে?", "হ্যাঁ, আপনার সব কথোপকথন আপনার অ্যাকাউন্টে নিরাপদে থাকে এবং যেকোনো সময় মুছে ফেলতে পারবেন।"],
    ["ইসলামি উত্তর কতটা নির্ভরযোগ্য?", "এআই সূত্রসহ উত্তর দেওয়ার চেষ্টা করে, তবে গুরুত্বপূর্ণ মাসআলায় অবশ্যই একজন বিজ্ঞ আলেমের পরামর্শ নিন।"],
  ];

  const cta = (
    <button
      onClick={signIn}
      disabled={busy}
      className="inline-flex items-center gap-3 rounded-full border border-primary/60 bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_0_40px_-8px_var(--primary)] transition hover:scale-[1.03] disabled:opacity-60"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-card">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
      </span>
      {busy ? "অপেক্ষা করুন…" : "গুগল দিয়ে প্রবেশ করুন"}
    </button>
  );

  return (
    <main className="pattern-bg relative min-h-screen overflow-hidden text-foreground">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-display text-xl">আল আহসান এআই</span>
        </div>
        <button onClick={signIn} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-4 py-2 text-sm text-primary hover:bg-primary/10 disabled:opacity-60">
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          প্রবেশ করুন
        </button>
      </header>

      <section className="relative flex flex-col items-center px-6 pb-24 pt-12 text-center">
        <div className="glow" />
        <div className="relative z-10 flex max-w-3xl flex-col items-center">
          <Logo size={88} />
          <p className="mt-6 font-display text-lg tracking-[0.3em] text-primary">بِسْمِ اللّٰهِ</p>
          <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl">আল আহসান এআই</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.4em] text-muted-foreground">Al Ahsan AI</p>
          <p className="mt-6 text-lg text-muted-foreground">
            জ্ঞান, লেখা, অনুবাদ, গবেষণা ও প্রোগ্রামিং — সব কাজে আপনার শক্তিশালী বাংলা সহকারী। লিখে বা কথা বলে প্রশ্ন করুন।
          </p>
          <div className="mt-10">{cta}</div>
          {err && <p className="mt-4 text-destructive">{err}</p>}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center font-display text-3xl md:text-4xl">যা যা করতে পারে</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card/70 p-6 transition hover:border-primary/60">
              <h3 className="font-display text-xl text-primary">{f.t}</h3>
              <p className="mt-2 text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-card/60 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-sm font-semibold text-primary">আমাদের সম্পর্কে</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">মুহিউস সুন্নাহ ফাউন্ডেশন বাংলাদেশ</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              সুন্নাহর আলোয় জ্ঞান ও সেবা ছড়িয়ে দেওয়াই আমাদের লক্ষ্য। আধুনিক প্রযুক্তিকে কাজে লাগিয়ে সবার হাতে সহজে নির্ভরযোগ্য জ্ঞান পৌঁছে দিতে আমরা তৈরি করেছি আল আহসান এআই।
            </p>
          </div>
          <ol className="space-y-4">
            {["গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন", "লিখে বা কথা বলে প্রশ্ন করুন", "উত্তর কপি করুন, শুনুন বা পরে আবার দেখুন"].map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-primary-foreground">{"১২৩"[i]}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-center font-display text-3xl md:text-4xl">সাধারণ প্রশ্ন</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-border bg-card/60 p-5">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-3 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 flex justify-center">{cta}</div>
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} মুহিউস সুন্নাহ ফাউন্ডেশন বাংলাদেশ · আল আহসান এআই
      </footer>
    </main>
  );
}

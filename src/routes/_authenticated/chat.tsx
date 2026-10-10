Homepage

alahsanfoundationai
Repository
alahsanfoundationai
src
routes
_authenticated
chat.tsx
chat.tsx
Al-Ahsan Foundation  Bangladesh's avatar
 03c67f9c
2 hours ago
 Code owners
Assign users and groups as approvers for specific file changes. Learn more.
chat.tsx
42.29 KiB
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { withStorageShim } from "@/lib/page-shim";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
const urlT = (u: string) => (u.startsWith("data:image/") ? u : defaultUrlTransform(u));
import remarkGfm from "remark-gfm";
import { Mic, MicOff, Send, Plus, Trash2, Volume2, VolumeX, LogOut, Shield, Menu, Square, Copy, Check, Search, Printer, Download, Maximize2, Code2, MonitorPlay, ExternalLink, ImagePlus, Compass, Paperclip, Bookmark as BookmarkIcon, BookmarkCheck, Share2 } from "lucide-react";
import { extractDocText, loadBookmarks, saveBookmarks, downloadShareCard, type Bookmark } from "@/lib/extras";
import { displayAccount } from "@/lib/phone-auth";
import { ChartBlock } from "@/components/ChartBlock";
const STAGE_LABEL: Record<string, string> = {
  think: "আপনার প্রশ্ন বিশ্লেষণ করা হচ্ছে...",
  search: "অনলাইনে তথ্য অনুসন্ধান করা হচ্ছে...",
  verify: "উৎস ও প্রামাণ্য দলীলসমূহ যাচাই করা হচ্ছে...",
  geo: "আপনার ভৌগোলিক অবস্থান শনাক্ত করা হচ্ছে...",
  fallback: "বিকল্প সংযোগে উত্তর নেওয়া হচ্ছে...",
  image: "ছবি প্রস্তুত করা হচ্ছে...",
  code: "সফটওয়্যারের কোড ও আর্কিটেকচার প্রস্তুত করা হচ্ছে...",
  write: "উত্তর প্রস্তুত করা হচ্ছে...",
  build: "ওয়েবসাইট লাইভ করা হচ্ছে...",
  test: "লাইভ লিংক যাচাই করা হচ্ছে...",
  done: "সম্পন্ন হয়েছে",
};
function BrainIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={`h-10 w-10 shrink-0 ${active ? "brain-pulse" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="text-primary" d="M26 10c-5 0-8 4-8 8-5 1-8 5-7 10-3 2-4 6-2 10 0 5 4 8 8 8 1 5 5 8 10 7V10z" />
      <path className="text-primary" d="M38 10c5 0 8 4 8 8 5 1 8 5 7 10 3 2 4 6 2 10 0 5-4 8-8 8-1 5-5 8-10 7V10z" />
      <path className="text-primary/70" d="M26 22c-3 0-5 2-5 5M26 36c-4 0-6 3-6 6M38 22c3 0 5 2 5 5M38 36c4 0 6 3 6 6" />
      {active && (<>
        <circle className="brain-node" cx="20" cy="27" r="2" fill="currentColor" />
        <circle className="brain-node" style={{ animationDelay: ".4s" }} cx="44" cy="27" r="2" fill="currentColor" />
        <circle className="brain-node" style={{ animationDelay: ".8s" }} cx="32" cy="40" r="2" fill="currentColor" />
      </>)}
    </svg>
  );
}
function WorkflowStepper({ stages, current }: { stages: string[]; current: number }) {
  const cur = stages[Math.min(current, stages.length - 1)] ?? "think";
  const finished = current >= stages.length;
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [endAt, setEndAt] = useState<number | null>(null);
  useEffect(() => {
    if (finished) { setEndAt((e) => e ?? Date.now()); return; }
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [finished]);
  const secs = (((endAt ?? now) - start) / 1000).toFixed(1);
  // ধাপভিত্তিক অগ্রগতি; একটি ধাপের ভেতরেও সময়ের সাথে ধীরে বাড়ে, কিন্তু পরের ধাপের সীমা পেরোয় না
  const per = 100 / (stages.length + 1);
  const pct = finished ? 100 : Math.min(99, Math.round(per * current + per * (1 - Math.exp(-((now - start) / 1000) / 6))));
  const toBn = (s: string | number) => String(s).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]!);
  return (
    <div className={`not-prose mb-3 animate-in fade-in ${finished ? "" : "live-card"}`}>
      <div className="flex items-center gap-3">
        <BrainIcon active={!finished} />
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${finished ? "text-primary" : "live-status font-medium"}`}>{finished ? STAGE_LABEL["done"] : STAGE_LABEL[cur] ?? cur}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
            <span>সময়: {toBn(secs)} সেকেন্ড</span>
            <span>সম্পন্ন: {toBn(pct)}%</span>
            {!finished && <span>বাকি: {toBn(100 - pct)}%</span>}
          </div>
        </div>
      </div>
      <div className="mt-2 h-[3px] w-full rounded-full bg-muted"><div className="live-bar" style={{ width: `${pct}%` }} /></div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/70">
        {stages.slice(0, finished ? stages.length : current).map((s, i) => (
          <span key={s + i}>{(STAGE_LABEL[s] ?? s).replace(/ করা হচ্ছে\.\.\.$/, " সম্পন্ন").replace(/\.\.\.$/, "")}</span>
        ))}
      </div>
    </div>
  );
}
// উত্তরের শেষে [[প্রশ্ন: ...]] আকারে ফলো-আপ প্রশ্ন থাকে — আলাদা করা
function splitFollowups(t: string): { body: string; followups: string[] } {
  const followups: string[] = [];
  const body = t.replace(/\[\[প্রশ্ন:\s*([^\]]+)\]\]/g, (_m, q) => { followups.push(String(q).trim()); return ""; }).replace(/\n+\s*(পরবর্তী প্রশ্ন|ফলো-আপ)[^\n]*\s*$/m, "").trimEnd();
  return { body, followups: followups.slice(0, 3) };
}
function exportAnswer(content: string, kind: "md" | "doc" | "pdf") {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  if (kind === "pdf") {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>আল আহসান এআই</title><style>body{font-family:'Hind Siliguri',sans-serif;max-width:780px;margin:24px auto;padding:0 16px;line-height:1.8;white-space:pre-wrap}</style></head><body><h2>আল আহসান এআই</h2>${esc(content)}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
    w.document.close();
    return;
  }
  const blob = kind === "md"
    ? new Blob([content], { type: "text/markdown;charset=utf-8" })
    : new Blob([`<html><head><meta charset="utf-8"></head><body style="font-family:'Hind Siliguri',sans-serif;line-height:1.8;white-space:pre-wrap">${esc(content)}</body></html>`], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `al-ahsan-answer.${kind}`;
  a.click();
}
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useIsAdmin } from "@/lib/admin";
export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "কথোপকথন — আল আহসান এআই" },
      { name: "description", content: "আল আহসান এআই-এর সাথে লিখে বা কথা বলে কথোপকথন করুন।" },
      { property: "og:title", content: "কথোপকথন — আল আহসান এআই" },
      { property: "og:description", content: "শক্তিশালী বাংলা এআই সহকারীর সাথে চ্যাট।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});
type Msg = { role: "user" | "assistant"; content: string; image?: string };
type Conv = { id: string; title: string };
function HtmlPreview({ code, streaming }: { code: string; streaming?: boolean }) {
  const [tab, setTab] = useState<"run" | "code">("run");
  const [ok, setOk] = useState(false);
  if (streaming) {
    return (
      <div className="not-prose my-3 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-primary"><span className="typing"><i /><i /><i /></span> ওয়েবসাইট তৈরি হচ্ছে… ({code.length} অক্ষর)</div>
        <pre className="h-[200px] overflow-hidden p-3 text-xs text-muted-foreground"><code>{code.slice(-1500)}</code></pre>
      </div>
    );
  }
  const openFull = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/html" }));
    window.open(url, "_blank");
  };
  return (
    <div className="not-prose my-3 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 text-xs">
        <button onClick={() => setTab("run")} className={`flex items-center gap-1 rounded-md px-2 py-1 ${tab === "run" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}><MonitorPlay size={14} /> চালু করে দেখুন</button>
        <button onClick={() => setTab("code")} className={`flex items-center gap-1 rounded-md px-2 py-1 ${tab === "code" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}><Code2 size={14} /> কোড</button>
        <span className="flex-1" />
        <button onClick={async () => { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1500); }} className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-primary">{ok ? <Check size={14} /> : <Copy size={14} />} কপি</button>
        <button onClick={openFull} className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-primary"><Maximize2 size={14} /> বড় করে</button>
        <button onClick={async () => { const JSZip = (await import("jszip")).default; const z = new JSZip(); z.file("index.html", code); z.file("README.txt", "index.html ফাইলটি ব্রাউজারে খুলুন। তৈরি করেছে: আল আহসান এআই"); const b = await z.generateAsync({ type: "blob" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "website.zip"; a.click(); }} className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-primary"><Download size={14} /> ZIP</button>
      </div>
      {tab === "run" ? (
        <iframe title="ওয়েবসাইট প্রিভিউ" srcDoc={withStorageShim(code)} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="h-[70vh] min-h-[520px] w-full bg-white sm:h-[80vh] sm:min-h-[650px]" />
      ) : (
        <pre className="max-h-[70vh] min-h-[520px] overflow-auto p-3 text-xs sm:max-h-[80vh] sm:min-h-[650px]"><code>{code}</code></pre>
      )}
    </div>
  );
}
function LiveLinkCard({ href }: { href: string }) {
  const [ok, setOk] = useState(false);
  return (
    <span className="not-prose my-3 flex flex-col gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
      <span className="break-all text-xs text-muted-foreground">{href}</span>
      <span className="flex flex-wrap gap-2">
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground no-underline"><ExternalLink size={14} /> নতুন ট্যাবে ওয়েবসাইট খুলুন</a>
        <button onClick={async () => { await navigator.clipboard.writeText(href); setOk(true); setTimeout(() => setOk(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm">{ok ? <Check size={14} /> : <Copy size={14} />}{ok ? "কপি হয়েছে" : "লিংক কপি করুন"}</button>
      </span>
    </span>
  );
}
const makeMd = (streaming: boolean) => ({
  code({ className, children, ...rest }: any) {
    const text = String(children ?? "");
    if (/language-html/.test(className || "") && /<(html|body|!doctype)/i.test(text)) return <HtmlPreview code={text} streaming={streaming} />;
    if (/language-chart/.test(className || "") && !streaming) return <ChartBlock json={text} />;
    return <code className={className} {...rest}>{children}</code>;
  },
  a({ href, children }: any) {
    const h = String(href ?? "");
    if (typeof window !== "undefined" && h.startsWith(window.location.origin) && /\/(project\d+|p\/)/.test(h)) return <LiveLinkCard href={h} />;
    return <a href={h} target="_blank" rel="noopener noreferrer">{children}</a>;
  },
});
const mdDone = makeMd(false);
const mdStreaming = makeMd(true);
function printChat(msgs: Msg[]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  w.document.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>আল আহসান এআই — কথোপকথন</title><style>body{font-family:'Hind Siliguri',sans-serif;max-width:780px;margin:24px auto;padding:0 16px;line-height:1.7}.m{margin:14px 0;padding:12px;border-radius:10px;white-space:pre-wrap}.u{background:#eef6f0}.a{border:1px solid #ddd}b{display:block;margin-bottom:4px}</style></head><body><h2>আল আহসান এআই — কথোপকথন</h2>${msgs.map((m) => `<div class="m ${m.role === "user" ? "u" : "a"}"><b>${m.role === "user" ? "আপনি" : "আল আহসান এআই"}</b>${esc(m.content)}</div>`).join("")}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}
function downloadChat(msgs: Msg[]) {
  const txt = msgs.map((m) => `${m.role === "user" ? "আপনি" : "আল আহসান এআই"}:\n${m.content}`).join("\n\n---\n\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
  a.download = "al-ahsan-chat.txt";
  a.click();
}
function stripEmoji(t: string): string {
  return t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "");
}
function pickVoice(bn: boolean): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  if (bn) return all.find((x) => /^bn[-_]BD/i.test(x.lang)) || all.find((x) => /^bn/i.test(x.lang)) || all.find((x) => /^(hi|en)[-_]IN/i.test(x.lang));
  return all.find((x) => /^en/i.test(x.lang));
}
// বাক্যভিত্তিক ছোট টুকরোয় পড়া — লম্বা লেখা একবারে দিলে অনেক ব্রাউজারে ভয়েস থেমে যায়
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const clean = stripEmoji(text)
    .replace(/```[\s\S]*?(```|$)/g, " কোড অংশ। ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*`_>|~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
  if (!clean) return;
  const parts = clean.match(/[^।.!?\n]+[।.!?]?/g) || [clean];
  const chunks: string[] = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > 180 && cur) { chunks.push(cur); cur = p; } else cur += p;
  }
  if (cur.trim()) chunks.push(cur);
  const run = () => {
    chunks.forEach((c) => {
      const u = new SpeechSynthesisUtterance(c.trim());
      const bn = /[\u0980-\u09FF]/.test(c);
      u.lang = bn ? "bn-BD" : "en-US";
      const v = pickVoice(bn);
      if (v) u.voice = v;
      u.rate = 1;
      synth.speak(u);
    });
  };
  if (synth.getVoices().length) run();
  else {
    let done = false;
    const go = () => { if (!done) { done = true; run(); } };
    synth.addEventListener("voiceschanged", go, { once: true });
    setTimeout(go, 600);
  }
}
function ChatPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const admin = useIsAdmin(user.id);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (t: string, i: number) => { await navigator.clipboard.writeText(t); setCopied(i); setTimeout(() => setCopied(null), 1500); };
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickImage = (file: File) => {
    if (!file.type.startsWith("image/")) return alert("শুধু ছবি পাঠানো যাবে।");
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const scale = Math.min(1, 1280 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * scale);
        c.height = Math.round(im.height * scale);
        c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
        setImage(c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = () => alert("ছবিটি খোলা যায়নি।");
      im.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const docRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<{ name: string; text: string } | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const pickDoc = async (file: File) => {
    if (file.size > 20_000_000) return alert("ফাইলটি ২০ MB-এর বেশি বড়।");
    setDocBusy(true);
    try {
      const t = (await extractDocText(file)).trim();
      if (!t) alert("ফাইলে পড়ার মতো লেখা পাওয়া যায়নি। স্ক্যান করা পাতা হলে ছবি হিসেবে পাঠান।");
      else setDoc({ name: file.name, text: t });
    } catch (e: any) { alert(e?.message || "ফাইলটি পড়া যায়নি।"); }
    setDocBusy(false);
  };
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  useEffect(() => { setBookmarks(loadBookmarks()); }, []);
  const toggleBookmark = (content: string) => {
    setBookmarks((prev) => {
      const next = prev.some((b) => b.content === content) ? prev.filter((b) => b.content !== content) : [{ id: crypto.randomUUID(), content, at: Date.now() }, ...prev];
      saveBookmarks(next);
      return next;
    });
  };
    const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<{ stages: string[]; current: number } | null>(null);
  const pushStage = (st: string, finish = false) => setFlow((f) => { const stages = f ? (f.stages.includes(st) ? f.stages : [...f.stages, st]) : [st]; return { stages, current: finish ? stages.length : stages.indexOf(st) }; });
  const [voiceOut, setVoiceOut] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [cfg, setCfg] = useState<{ welcome_title?: string; welcome_subtitle?: string; suggestions?: string }>({});
  const [speaking, setSpeaking] = useState<number | null>(null);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then(setCfg).catch(() => {}); }, []);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadConvs = async () => {
    const { data } = await supabase.from("conversations").select("id,title").order("updated_at", { ascending: false });
    setConvs(data ?? []);
  };
  useEffect(() => {
    loadConvs();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth", block: "end" });
  }, [msgs]);
  const openConv = async (id: string) => {
    setActive(id);
    setSidebar(false);
    const { data } = await supabase.from("messages").select("role,content").eq("conversation_id", id).order("created_at");
    setMsgs((data ?? []) as Msg[]);
  };
  const newChat = () => {
    setActive(null);
    setMsgs([]);
    setSidebar(false);
  };
  const delConv = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (active === id) newChat();
    loadConvs();
  };
  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("এই ব্রাউজারে ভয়েস টাইপিং নেই। Android-এ Chrome, iPhone-এ Safari ব্যবহার করুন, অথবা কিবোর্ডের মাইক বোতাম চাপুন।");
    if (listening) return recRef.current?.stop();
    const rec = new SR();
    rec.lang = "bn-BD";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input;
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput((base ? base + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") alert("মাইক্রোফোনের অনুমতি দিন: ব্রাউজারের ঠিকানার পাশে 🔒 চিহ্নে চাপ দিয়ে Microphone চালু করুন।");
      else if (e?.error === "no-speech") alert("কোনো কথা শোনা যায়নি, আবার চেষ্টা করুন।");
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  const send = async () => {
    const img = image;
    const d = doc;
    const typed = input.trim() || (img ? "এই ছবিটি বিশ্লেষণ করুন।" : d ? "এই ফাইলটির সারসংক্ষেপ ও বিশ্লেষণ দিন।" : "");
    const text = d ? `${typed}\n\n=== সংযুক্ত ফাইল: ${d.name} ===\n${d.text.slice(0, 32000)}` : typed;
    if (!typed || loading || docBusy) return;
    setInput("");
    setImage(null);
    setDoc(null);
    let convId = active;
    if (!convId) {
      const { data, error } = await supabase.from("conversations").insert({ title: text.slice(0, 60), user_id: user.id }).select("id").single();
      if (error || !data) { setInput(text); alert(`কথোপকথন তৈরি করা যায়নি: ${error?.message ?? ""}`); return; }
      convId = data.id;
      setActive(convId);
    }
    const history: Msg[] = [...msgs, { role: "user", content: text, ...(img ? { image: img } : {}) }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setFlow({ stages: ["think"], current: 0 });
    setLoading(true);
    await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: img ? `[ছবি সংযুক্ত] ${text}` : text, user_id: user.id });
    let full = "";
    try {
      const { data: s } = await supabase.auth.getSession();
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ messages: history.slice(-40).map((m, i, arr) => { const content = m.content.replace(/!\[[^\]]*\]\(data:image[^)]+\)/g, "[ছবি]").slice(0, 39000); return i === arr.length - 1 ? { ...m, content } : { role: m.role, content }; }) }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const handle = (raw: string) => {
        const line = raw.trim();
        if (!line.startsWith("data:")) return;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") return;
        try {
          const j = JSON.parse(d);
          if (j.stage) return pushStage(j.stage);
          if (j.error) { full += `\n\n${j.error}`; setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]); return; }
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
          }
        } catch { /* অসম্পূর্ণ/ভাঙা অংশ বাদ */ }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          handle(buf.slice(0, i));
          buf = buf.slice(i + 1);
        }
      }
      buf += dec.decode();
      buf.split("\n").forEach(handle);
    } catch (e: any) {
      if (e?.name !== "AbortError") full = full || `ত্রুটি: ${e?.message || "ত্রুটি হয়েছে"}`;
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
    }
    setLoading(false);
    if (full) {
      // অসম্পূর্ণ কোড ব্লক বন্ধ করা, যাতে লাইভ লিংক কোডের ভেতরে না পড়ে
      if (((full.match(/```/g) || []).length) % 2 === 1) {
        full += "\n```";
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
      }
      const htmlCode = full.match(/```html\s*\n([\s\S]*?)(?:```|$)/i)?.[1];
      if (htmlCode && /<html/i.test(htmlCode)) {
        pushStage("build");
        try {
          const { data: s2 } = await supabase.auth.getSession();
          const pr = await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${s2.session?.access_token}` },
            body: JSON.stringify({ title: text.slice(0, 80), html: htmlCode.trim() }),
          });
          if (pr.ok) {
            const { url } = await pr.json();
            const liveUrl = `${window.location.origin}${url}`;
            full += `\n\n---\n\n### লাইভ লিংক তৈরি হয়েছে\n\n[${liveUrl}](${liveUrl})\n\nলিংকে চাপ দিলেই ওয়েবসাইটটি সরাসরি খুলবে।`;
            setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
            pushStage("test");
            const chk = await fetch(url).catch(() => null);
            if (!chk?.ok) { full += `\n\nসতর্কতা: লাইভ লিংক এখনো সাড়া দিচ্ছে না, কিছুক্ষণ পর আবার খুলুন।`; setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]); }
          } else {
            full += `\n\nলাইভ লিংক তৈরি করা যায়নি (${pr.status})। আবার চেষ্টা করুন।`;
            setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
          }
        } catch { full += "\n\nলাইভ লিংক তৈরির সময় সংযোগ বিচ্ছিন্ন হয়েছে।"; setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]); }
      }
      await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: full, user_id: user.id });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      if (voiceOut) speak(full);
      supabase.auth.getSession().then(({ data: s3 }) =>
        fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${s3.session?.access_token}` },
          body: JSON.stringify({ action: "extract", user: text.slice(0, 4000), assistant: full.slice(0, 4000) }),
        }).catch(() => {}),
      );
    }
    pushStage("done", true);
    setTimeout(() => setFlow(null), 2500);
    loadConvs();
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside
        className={`${sidebar ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-72 flex-col border-r border-border bg-sidebar md:static md:flex`}
      >
        <div className="flex items-center gap-3 p-4">
          <Logo size={32} />
          <span className="font-display text-xl">আল আহসান</span>
        </div>
        <button onClick={newChat} className="mx-3 flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-primary hover:bg-primary/10">
          <Plus size={18} /> নতুন কথোপকথন
        </button>
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <Search size={15} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="কথোপকথন খুঁজুন…" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-2">
          {convs.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())).map((c) => (
            <div key={c.id} className={`group flex items-center rounded-lg px-3 py-2 text-sm ${active === c.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"}`}>
              <button onClick={() => openConv(c.id)} className="flex-1 truncate text-left">{c.title}</button>
              <button onClick={() => delConv(c.id)} className="md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label="মুছুন">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        {bookmarks.length > 0 && (
          <div className="max-h-48 overflow-y-auto border-t border-border px-2 py-2 text-sm">
            <div className="px-2 pb-1 text-xs text-muted-foreground">সংরক্ষিত উত্তর ({bookmarks.length})</div>
            {bookmarks.map((b) => (
              <div key={b.id} className="group flex items-center rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/60">
                <button onClick={() => { setActive(null); setMsgs([{ role: "assistant", content: b.content }]); setSidebar(false); }} className="flex-1 truncate text-left">{b.content.replace(/[#*`>]/g, "").slice(0, 60)}</button>
                <button onClick={() => toggleBookmark(b.content)} className="text-muted-foreground hover:text-destructive" aria-label="মুছুন"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1 border-t border-border p-3 text-sm">
          <Link to="/salat" className="flex items-center gap-2 rounded-lg px-3 py-2 text-primary hover:bg-primary/10">
            <Compass size={16} /> নামাজের সময়, কিবলা ও মসজিদ
          </Link>
          {admin && (
            <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-primary hover:bg-primary/10">
              <Shield size={16} /> অ্যাডমিন প্যানেল
            </Link>
          )}
          <div className="truncate px-3 text-xs text-muted-foreground">{displayAccount(user.email)}</div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-sidebar-accent">
            <LogOut size={16} /> বের হোন
          </button>
        </div>
      </aside>
      {sidebar && <div className="fixed inset-0 z-20 bg-background/70 md:hidden" onClick={() => setSidebar(false)} />}
      <main className="pattern-bg flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <button className="md:hidden" onClick={() => setSidebar(!sidebar)} aria-label="মেনু"><Menu /></button>
          <div className="flex items-center gap-2">
  <span className="font-display text-lg text-primary">আল আহসান এআই</span>
  {!isOnline && (
    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
      অফলাইন
    </span>
  )}
</div>
          <div className="flex items-center gap-2">
          {msgs.length > 0 && (<>
            <button onClick={() => printChat(msgs)} className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-primary" aria-label="প্রিন্ট / PDF" title="প্রিন্ট / PDF"><Printer size={16} /></button>
            <button onClick={() => downloadChat(msgs)} className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-primary" aria-label="ডাউনলোড" title="ডাউনলোড"><Download size={16} /></button>
          </>)}
          <button
            onClick={() => { setVoiceOut(!voiceOut); window.speechSynthesis?.cancel(); }}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${voiceOut ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            {voiceOut ? <Volume2 size={16} /> : <VolumeX size={16} />} <span className="hidden sm:inline">ভয়েস উত্তর</span>
          </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {msgs.length === 0 && (
              <div className="mt-20 flex flex-col items-center text-center">
                <Logo size={64} />
                <h2 className="mt-4 font-display text-3xl">{cfg.welcome_title || "আসসালামু আলাইকুম"}</h2>
                <p className="mt-2 text-muted-foreground">{cfg.welcome_subtitle || "আজ আমি কীভাবে সাহায্য করতে পারি? লিখুন অথবা মাইক চেপে বলুন।"}</p>
                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                  {(cfg.suggestions ? cfg.suggestions.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6) : ["সূরা ফাতিহার তাফসীর সংক্ষেপে বলুন", "আমার স্কুলের জন্য একটি ওয়েবসাইট বানিয়ে দিন", "এই ইংরেজি বাক্যটি বাংলায় অনুবাদ করুন", "Python দিয়ে একটি ক্যালকুলেটর বানান"]).map((p) => (
                    <button key={p} onClick={() => setInput(p)} className="rounded-xl border border-border bg-card/60 p-4 text-left text-sm hover:border-primary/60">{p}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`mb-5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground" : "prose-ai max-w-full flex-1"}>
                  {m.role === "user" ? (
                    <>
                      {m.image && <img src={m.image} alt="পাঠানো ছবি" className="mb-2 max-h-64 rounded-lg" />}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </>
                  ) : (
                    <>
                      {i === msgs.length - 1 && flow && <WorkflowStepper stages={flow.stages} current={flow.current} />}
                      {m.content ? (() => {
                        const { body, followups } = splitFollowups(stripEmoji(m.content));
                        const streamingNow = loading && i === msgs.length - 1;
                        return (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlT} components={streamingNow ? mdStreaming : mdDone}>{body}</ReactMarkdown>
                          <div className="mt-1 flex flex-wrap gap-3 text-muted-foreground">
                            <button onClick={() => copy(body, i)} className="flex items-center gap-1 text-xs hover:text-primary" aria-label="কপি">{copied === i ? <Check size={15} /> : <Copy size={15} />}{copied === i ? "কপি হয়েছে" : "কপি"}</button>
                            <button onClick={() => { if (speaking === i) { window.speechSynthesis?.cancel(); setSpeaking(null); } else { speak(body); setSpeaking(i); } }} className="flex items-center gap-1 text-xs hover:text-primary" aria-label="শুনুন">{speaking === i ? <><Square size={14} /> থামান</> : <><Volume2 size={15} /> শুনুন</>}</button>
                            {!streamingNow && <>
                              <button onClick={() => exportAnswer(body, "pdf")} className="text-xs hover:text-primary">PDF</button>
                              <button onClick={() => exportAnswer(body, "doc")} className="text-xs hover:text-primary">Word</button>
                              <button onClick={() => exportAnswer(body, "md")} className="text-xs hover:text-primary">Markdown</button>
                              <button onClick={() => toggleBookmark(body)} className="flex items-center gap-1 text-xs hover:text-primary">{bookmarks.some((b) => b.content === body) ? <><BookmarkCheck size={14} /> সংরক্ষিত</> : <><BookmarkIcon size={14} /> সংরক্ষণ</>}</button>
                              <button onClick={() => downloadShareCard(body)} className="flex items-center gap-1 text-xs hover:text-primary"><Share2 size={14} /> শেয়ার কার্ড</button>
                            </>}
                          </div>
                          {!streamingNow && followups.length > 0 && i === msgs.length - 1 && (
                            <div className="not-prose mt-3 flex flex-col gap-2">
                              {followups.map((f) => (
                                <button key={f} onClick={() => setInput(f)} className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm hover:border-primary/70 hover:bg-primary/10">{f}</button>
                              ))}
                            </div>
                          )}
                        </>
                        );
                      })() : (
                        <span className="typing"><i /><i /><i /></span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>
        <div className="border-t border-border/60 p-4">
          {(doc || docBusy || image) && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-xs text-muted-foreground">
              {image && <span className="rounded-md border border-border px-2 py-1">ছবি সংযুক্ত <button onClick={() => setImage(null)} className="ml-1 text-destructive">x</button></span>}
              {docBusy && <span>ফাইল পড়া হচ্ছে...</span>}
              {doc && <span className="rounded-md border border-border px-2 py-1">{doc.name} ({doc.text.length} অক্ষর) <button onClick={() => setDoc(null)} className="ml-1 text-destructive">x</button></span>}
            </div>
          )}
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/60">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ""; }} />
            <input ref={docRef} type="file" accept=".pdf,.docx,.txt,.md,.csv,.json,.html" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickDoc(f); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} className="rounded-xl p-3 text-primary hover:bg-primary/10" aria-label="ছবি যুক্ত করুন" title="ছবি যুক্ত করুন"><ImagePlus size={20} /></button>
            <button onClick={() => docRef.current?.click()} className="rounded-xl p-3 text-primary hover:bg-primary/10" aria-label="ফাইল যুক্ত করুন" title="PDF / Word / লেখা ফাইল"><Paperclip size={20} /></button>
            <button onClick={toggleMic} className={`rounded-xl p-3 ${listening ? "animate-pulse bg-destructive text-destructive-foreground" : "text-primary hover:bg-primary/10"}`} aria-label="ভয়েস">
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={listening ? "শুনছি…" : "আপনার প্রশ্ন লিখুন…"}
              className="max-h-48 flex-1 resize-none bg-transparent px-2 py-3 outline-none placeholder:text-muted-foreground"
            />
            {loading ? (
              <button onClick={() => abortRef.current?.abort()} className="rounded-xl bg-secondary p-3" aria-label="থামান"><Square size={20} /></button>
            ) : (
              <button onClick={send} disabled={!input.trim() && !image} className="rounded-xl bg-primary p-3 text-primary-foreground disabled:opacity-40" aria-label="পাঠান"><Send size={20} /></button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

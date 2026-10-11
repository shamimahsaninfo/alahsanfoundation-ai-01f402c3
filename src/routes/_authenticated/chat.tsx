import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { withStorageShim } from "@/lib/page-shim";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
const urlT = (u: string) => (u.startsWith("data:image/") ? u : defaultUrlTransform(u));
import remarkGfm from "remark-gfm";
import { Mic, MicOff, Send, Plus, Trash2, Volume2, VolumeX, LogOut, Shield, Menu, Square, Copy, Check, Search, Printer, Download, Maximize2, Code2, MonitorPlay, ExternalLink, ImagePlus, Compass, Paperclip, Bookmark as BookmarkIcon, BookmarkCheck, Share2, Globe, Sparkles, Brain, CheckCircle2, Loader2 } from "lucide-react";
import { extractDocText, loadBookmarks, saveBookmarks, downloadShareCard, type Bookmark } from "@/lib/extras";
import { ChartBlock } from "@/components/ChartBlock";
 if (LIVE_Q.test(q)) return secs < 6 ? "অনলাইনে তথ্য অনুসন্ধান করা হচ্ছে" : "পাওয়া তথ্য যাচাই করা হচ্ছে";
  return secs < 4 ? "প্রশ্ন বিশ্লেষণ করা হচ্ছে" : secs < 12 ? "উত্তর সাজানো হচ্ছে" : "আরেকটু সময় লাগছে, কাজ চলছে";
}
function LiveStatus({ label }: { label: string }) {
  return <div className="not-prose mb-2 text-sm font-medium"><span className="live-status">{label}…</span></div>;
}

  );
}
// উত্তরের শেষে [[প্রশ্ন: ...]] আকারে ফলো-আপ প্রশ্ন থাকে — আলাদা করা
function splitFollowups(t: string): { body: string; followups: string[] } {
  const followups: string[] = [];
  const body = t.replace(/\[\[প্রশ্ন:\s*([^\]]+)\]\]/g, (_m, q) => { followups.push(String(q).trim()); return ""; }).replace(/\n+\s*(পরবর্তী প্রশ্ন|ফলো-আপ)[^\n]*\s*$/m, "").trimEnd();
  return { body, followups: followups.slice(0, 3) };
}
function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function exportAnswer(content: string, kind: "md" | "doc" | "pdf") {
  if (kind === "pdf") {
    window.print();
    return;
  }
  if (kind === "md") {
    return saveBlob(new Blob([content], { type: "text/markdown;charset=utf-8" }), "al-ahsan-answer.md");
  }
  if (kind === "doc") {
    const html = `<html><head><meta charset="utf-8"></head><body style="font-family:'Hind Siliguri',sans-serif;line-height:1.6;white-space:pre-wrap;">${content}</body></html>`;
    return saveBlob(new Blob([html], { type: "application/msword;charset=utf-8" }), "al-ahsan-answer.doc");
  }
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
type Msg = { role: "user" | "assistant"; content: string; image?: string; error?: boolean };
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
        <button onClick={() => { const b = new Blob([code], { type: "text/html;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "index.html"; a.click(); }} className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-primary"><Download size={14} /> HTML ফাইল</button> 
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
  if (typeof window !== "undefined") window.print();
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
// বাংলা ভয়েস না থাকলে হিন্দি/ইংরেজি টানে বিকৃত উচ্চারণ নয় — undefined ফেরত দেয়
function pickVoice(bn: boolean): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  if (bn) return all.find((x) => /^bn[-_]BD/i.test(x.lang)) || all.find((x) => /^bn/i.test(x.lang));
  return all.find((x) => /^en/i.test(x.lang));
}
const NO_BN_VOICE = "আপনার ডিভাইসে বাংলা ভয়েস প্যাক নেই। ফোনের Settings > Google > Text-to-speech (বা Language & input) থেকে বাংলা ভয়েস ডাউনলোড ও চালু করুন।";
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
    if (/[\u0980-\u09FF]/.test(clean) && !pickVoice(true)) { alert(NO_BN_VOICE); return; }
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
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<{ stages: string[]; current: number } | null>(null);
  const pushStage = (st: string, finish = false) => setFlow((f) => { const stages = f ? (f.stages.includes(st) ? f.stages : [...f.stages, st]) : [st]; return { stages, current: finish ? stages.length : stages.indexOf(st) }; });
  const [voiceOut, setVoiceOut] = useState(false);
    const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!loading) return;
    setSecs(0);
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);
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
    const KB_HELP = "এই অ্যাপে সরাসরি মাইক চালু করা যাচ্ছে না। সহজ উপায়: লেখার ঘরে চাপ দিন, তারপর কিবোর্ডের মাইক (🎤) বোতাম চেপে বাংলায় বলুন — কিবোর্ড নিজেই লিখে দেবে। (Gboard-এ ভাষা হিসেবে বাংলা যোগ করে নিন।)";
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isWebView = /; wv\)|AppsGeyser|WebView/i.test(navigator.userAgent);
    if (!SR) return alert(KB_HELP);
    if (listening) return recRef.current?.stop();
    let rec: any;
    try { rec = new SR(); } catch { return alert(KB_HELP); }
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
      if (e?.error === "service-not-allowed" || (isWebView && e?.error === "not-allowed") || e?.error === "network" || e?.error === "audio-capture") alert(KB_HELP);
      else if (e?.error === "not-allowed") alert("মাইক্রোফোনের অনুমতি দিন: ব্রাউজারের ঠিকানার পাশে 🔒 চিহ্নে চাপ দিয়ে Microphone চালু করুন। না হলে কিবোর্ডের মাইক বোতাম ব্যবহার করুন।");
      else if (e?.error === "no-speech") alert("কোনো কথা শোনা যায়নি, আবার চেষ্টা করুন।");
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); alert(KB_HELP); }
  };
  const send = async () => {
    const img = image;
    const d = doc;
    const typed = input.trim() || (img ? "এই ছবিটি বিশ্লেষণ করুন।" : d ? "এই ফাইলটির সারসংক্ষেপ ও বিশ্লেষণ দিন।" : "");
    // Show/store only a short label; the full file text goes to the AI for this message only
    const text = d ? `${typed}\n\n[সংযুক্ত ফাইল: ${d.name}]` : typed;
    const apiText = d ? `${typed}\n\n=== সংযুক্ত ফাইল: ${d.name} ===\n${d.text.slice(0, 32000)}` : typed;
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
    const history: Msg[] = [...msgs.filter((m) => !m.error && m.content.trim()), { role: "user", content: text, ...(img ? { image: img } : {}) }];
    setMsgs([...msgs, { role: "user", content: text, ...(img ? { image: img } : {}) }, { role: "assistant", content: "" }]);
    setFlow({ stages: ["think"], current: 0 });
    setLoading(true);
    await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: img ? `[ছবি সংযুক্ত] ${text}` : text, user_id: user.id });
    let full = "";
    let failed = false;
    let wrote = false;
    const showErr = (msg: string) => { failed = true; setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full ? `${full}\n\n${msg}` : msg, error: true }]); };
    try {
      const { data: s } = await supabase.auth.getSession();
      abortRef.current = new AbortController();
      // টোকেন বাঁচাতে: শুধু শেষ ৮টি বার্তা; পুরোনো বড় বার্তা ছোট করে পাঠানো
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ messages: history.slice(-8).map((m, i, arr) => { const last = i === arr.length - 1; let content = (last ? apiText : m.content).replace(/!\[[^\]]*\]\(data:image[^)]+\)/g, "[ছবি]"); content = last ? content.slice(0, 36000) : content.length > 3000 ? content.slice(0, 2500) + "\n...[সংক্ষেপিত]" : content; return last ? { ...m, content } : { role: m.role, content }; }) }),
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
          if (j.error) { showErr(String(j.error)); return; }
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) {
            if (!wrote) { wrote = true; pushStage("write"); }
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
      if (e?.name !== "AbortError") showErr(`ত্রুটি: ${e?.message || "ত্রুটি হয়েছে"}। আবার চেষ্টা করুন।`);
    }
    setLoading(false);
    // ত্রুটি হলে কিছুই ডাটাবেজে সেভ হবে না — শুধু পর্দায় সতর্কবার্তা
    if (full && !failed) {
      // অসম্পূর্ণ কোড ব্লক বন্ধ করা, যাতে লাইভ লিংক কোডের ভেতরে না পড়ে
      if (((full.match(/```/g) || []).length) % 2 === 1) {
        full += "\n```";
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
      }
      // HTML, CSS, JS আলাদা ব্লকে থাকলেও একত্র করে একটি পেজ বানানো
      const grab = (lang: string) => [...full.matchAll(new RegExp("```(?:" + lang + ")\\s*\\n([\\s\\S]*?)```", "gi"))].map((m) => m[1]!).join("\n");
      let htmlCode: string | undefined = grab("html");
      const css = grab("css"), js = grab("javascript|js");
      if (htmlCode || (css && js)) {
        if (!/<html/i.test(htmlCode)) htmlCode = `<!DOCTYPE html>\n<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>\n${htmlCode}\n</body></html>`;
        if (css) htmlCode = /<\/head>/i.test(htmlCode) ? htmlCode.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`) : `<style>${css}</style>` + htmlCode;
        if (js) htmlCode = /<\/body>/i.test(htmlCode) ? htmlCode.replace(/<\/body>(?![\s\S]*<\/body>)/i, `<script>\n${js}\n</script>\n</body>`) : htmlCode + `<script>${js}</script>`;
      } else htmlCode = undefined;
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
    <div className="flex h-dvh w-full max-w-full overflow-hidden bg-background text-foreground">
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
          <div className="truncate px-3 text-xs text-muted-foreground">{user.email}</div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-sidebar-accent">
            <LogOut size={16} /> বের হোন
          </button>
        </div>
      </aside>
      {sidebar && <div className="fixed inset-0 z-20 bg-background/70 md:hidden" onClick={() => setSidebar(false)} />}
      <main className="pattern-bg flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="flex min-w-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-3 sm:px-4">
          <button className="md:hidden" onClick={() => setSidebar(!sidebar)} aria-label="মেনু"><Menu /></button>
          <span className="truncate font-display text-lg text-primary">আল আহসান এআই</span>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6">
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
                <div className={m.role === "user" ? "max-w-[85%] break-words rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground" : "prose-ai min-w-0 max-w-full flex-1 break-words"}>
                  {m.role === "user" ? (
                    <>
                      {m.image && <img src={m.image} alt="পাঠানো ছবি" className="mb-2 max-h-64 rounded-lg" />}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </>
                  ) : (
                    <>
                      {i === msgs.length - 1 && loading && (
  <LiveStatus label={liveLabel(msgs[i - 1]?.content ?? "", m.content, null, secs, !!msgs[i - 1]?.image)} />
)}
                
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
        <div className="border-t border-border/60 px-4 py-3 sm:px-6 sm:py-4">
        
          {(doc || docBusy || image) && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-xs text-muted-foreground">
              {image && <span className="rounded-md border border-border px-2 py-1">ছবি সংযুক্ত <button onClick={() => setImage(null)} className="ml-1 text-destructive">x</button></span>}
              {docBusy && <span>ফাইল পড়া হচ্ছে...</span>}
              {doc && <span className="rounded-md border border-border px-2 py-1">{doc.name} ({doc.text.length} অক্ষর) <button onClick={() => setDoc(null)} className="ml-1 text-destructive">x</button></span>}
            </div>
          )}
          <div className="mx-auto flex w-full max-w-3xl items-end gap-0.5 rounded-2xl border border-border bg-card p-1 sm:gap-2 sm:p-2 focus-within:border-primary/60">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ""; }} />
            <input ref={docRef} type="file" accept=".pdf,.docx,.txt,.md,.csv,.json,.html" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickDoc(f); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} className="shrink-0 rounded-xl p-2 text-primary hover:bg-primary/10 sm:p-3" aria-label="ছবি যুক্ত করুন" title="ছবি যুক্ত করুন"><ImagePlus size={20} /></button>
            <button onClick={() => docRef.current?.click()} className="shrink-0 rounded-xl p-2 text-primary hover:bg-primary/10 sm:p-3" aria-label="ফাইল যুক্ত করুন" title="PDF / Word / লেখা ফাইল"><Paperclip size={20} /></button>
            <button onClick={toggleMic} className={`shrink-0 rounded-xl p-2 sm:p-3 ${listening ? "animate-pulse bg-destructive text-destructive-foreground" : "text-primary hover:bg-primary/10"}`} aria-label="ভয়েস">
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={listening ? "শুনছি…" : "আপনার প্রশ্ন লিখুন…"}
              className="max-h-48 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 outline-none placeholder:text-muted-foreground"
            />
            {loading ? (
              <button onClick={() => abortRef.current?.abort()} className="shrink-0 rounded-xl bg-secondary p-2 sm:p-3" aria-label="থামান"><Square size={20} /></button>
            ) : (
              <button onClick={send} disabled={(!input.trim() && !image && !doc) || docBusy} className="shrink-0 rounded-xl bg-primary p-2 sm:p-3 text-primary-foreground disabled:opacity-40" aria-label="পাঠান"><Send size={20} /></button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

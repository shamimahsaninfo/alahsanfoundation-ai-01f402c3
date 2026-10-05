import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mic, MicOff, Send, Plus, Trash2, Volume2, VolumeX, LogOut, Shield, Menu, Square, Copy, Check, Search, Printer, Download, Maximize2, Code2, MonitorPlay, ExternalLink, ImagePlus, Sparkles, Loader2, Radio } from "lucide-react";

const STEPS = ["বোঝা", "পরিকল্পনা", "নির্মাণ", "যাচাই", "সংশোধন", "প্রিভিউ"];
function WorkflowStepper({ stage }: { stage: number }) {
  return (
    <div className="not-prose mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-wide">
      {STEPS.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 ${i < stage ? "text-primary" : i === stage ? "text-foreground" : "text-muted-foreground/50"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${i < stage ? "bg-primary" : i === stage ? "animate-pulse bg-primary" : "bg-muted-foreground/30"}`} />
            {s}
          </span>
          {i < STEPS.length - 1 && <span className={`h-px w-4 ${i < stage ? "bg-primary/60" : "bg-border"}`} />}
        </span>
      ))}
    </div>
  );
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


const THINKING_STEPS = [
  "ব্যবহারকারীর জিজ্ঞাসা ও প্রেক্ষাপট পর্যালোচনা করা হচ্ছে...",
  "জ্ঞানের ভাণ্ডার ও প্রামাণ্য তথ্য অনুসন্ধান চলছে...",
  "গভীর ভাবনাত্মক যুক্তি ও উত্তর কাঠামো তৈরি হচ্ছে...",
  "উত্তরের নির্ভুলতা ও প্রাঞ্জলতা যাচাই করা হচ্ছে...",
  "চূড়ান্ত উত্তর গুছিয়ে উপস্থাপন করা হচ্ছে...",
];

function GlowingThinkingCard({ elapsed }: { elapsed: number }) {
  const stepIdx = Math.min(Math.floor(elapsed / 2.5), THINKING_STEPS.length - 1);
  const activeStep = THINKING_STEPS[stepIdx];

  return (
    <div className="not-prose my-3 overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-indigo-500/10 p-4 shadow-md backdrop-blur-sm relative">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
              <Sparkles size={16} className="text-emerald-500 animate-spin [animation-duration:6s]" />
              <span>লাইভ প্রসেসিং চলছে</span>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            {elapsed} সে.
          </span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-background/70 px-3.5 py-2.5 shadow-inner">
          <p className="text-xs sm:text-sm font-medium text-foreground/90 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-teal-500 shrink-0" />
            <span className="truncate">{activeStep}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {THINKING_STEPS.map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                idx < stepIdx
                  ? "bg-emerald-500"
                  : idx === stepIdx
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse shadow-sm shadow-emerald-500/50"
                  : "bg-muted/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HtmlPreview({ code, streaming }: { code: string; streaming?: boolean }) {
  const [tab, setTab] = useState<"run" | "code">("run");
  const [ok, setOk] = useState(false);
  if (streaming) {
    return (
      <div className="not-prose my-3 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-primary"><GlowingThinkingCard elapsed={elapsed} /> ওয়েবসাইট তৈরি হচ্ছে… ({code.length} অক্ষর)</div>
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
      </div>
      {tab === "run" ? (
        <iframe title="ওয়েবসাইট প্রিভিউ" srcDoc={code} sandbox="allow-scripts allow-forms allow-modals allow-popups" className="h-[420px] w-full bg-white" />
      ) : (
        <pre className="max-h-[420px] overflow-auto p-3 text-xs"><code>{code}</code></pre>
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
    if ((/language-html/.test(className || "") || /<(html|!doctype|body)/i.test(text)) && text.length > 50) {
      return <HtmlPreview code={text} streaming={streaming} />;
    }
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

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[#*`_>|-]/g, " ").slice(0, 4000);
  const u = new SpeechSynthesisUtterance(clean);
  const bn = /[\u0980-\u09FF]/.test(clean);
  u.lang = bn ? "bn-BD" : "en-US";
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith(bn ? "bn" : "en"));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
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
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|bmp|heic|svg)$/i.test(file.name)) {
      return alert("অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন।");
    }
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * scale));
        c.height = Math.max(1, Math.round(im.height * scale));
        const ctx = c.getContext("2d");
        if (!ctx) return alert("ছবি প্রসেস করা যায়নি।");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        setImage(c.toDataURL("image/jpeg", 0.82));
      };
      im.onerror = () => {
        // Fallback for svg/direct image
        if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
          setImage(reader.result);
        } else {
          alert("ছবিটি খোলা যায়নি। অন্য ফরম্যাটের ছবি চেষ্টা করুন।");
        }
      };
      im.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<number | null>(null);
  const [voiceOut, setVoiceOut] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [cfg, setCfg] = useState<{ welcome_title?: string; welcome_subtitle?: string; suggestions?: string }>({});
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let t: any;
    if (loading) {
      setElapsed(0);
      t = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(t);
  }, [loading]);
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

  const toggleMic = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("আপনার ডিভাইসের ব্রাউজারে স্পিচ রিকগনিশন সক্রিয় নেই। দয়া করে Android Chrome বা কিবোর্ডের নিজস্ব মাইক আইকন ব্যবহার করুন।");
      return;
    }

    if (listening) {
      try {
        recRef.current?.stop();
      } catch {}
      setListening(false);
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          alert("মাইক্রোফোনের অনুমতি বন্ধ আছে। দয়া করে ব্রাউজার সেটিংসে গিয়ে Microphone পারমিশন অন করুন।");
          return;
        }
      }
    }

    try {
      const rec = new SR();
      rec.lang = "bn-BD";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      const baseText = input.trim();

      rec.onstart = () => {
        setListening(true);
      };

      rec.onresult = (e: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = 0; i < e.results.length; ++i) {
          const item = e.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interimChunk += item[0].transcript;
          }
        }
        const spoken = (finalChunk + " " + interimChunk).trim();
        if (spoken) {
          setInput(baseText ? `${baseText} ${spoken}` : spoken);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech error:", e?.error);
        if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
          alert("মাইক্রোফোনের অনুমতি প্রয়োজন। ব্রাউজারের অ্যাড্রেস বারের তালার চিহ্নে চাপ দিয়ে Microphone পারমিশন অন করুন।");
          setListening(false);
        } else if (e?.error === "network") {
          alert("ভয়েস সার্ভারে নেটওয়ার্ক সমস্যা হয়েছে। কিবোর্ডের নিজস্ব মাইক বোতাম দিয়েও কথা বলতে পারেন।");
          setListening(false);
        }
      };

      rec.onend = () => {
        setListening(false);
      };

      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err: any) {
      console.error("Mic error:", err);
      setListening(false);
    }
  };

  const send = async () => {
    const img = image;
    const text = input.trim() || (img ? "এই ছবিটি বিশ্লেষণ করুন।" : "");
    if (!text || loading) return;
    setInput("");
    setImage(null);
    let convId = active;
    if (!convId) {
      const { data, error } = await supabase.from("conversations").insert({ title: text.slice(0, 60), user_id: user.id }).select("id").single();
      if (error || !data) { setInput(text); alert(`কথোপকথন তৈরি করা যায়নি: ${error?.message ?? ""}`); return; }
      convId = data.id;
      setActive(convId);
    }
    const history: Msg[] = [...msgs, { role: "user", content: text, ...(img ? { image: img } : {}) }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setPost(null);
    setLoading(true);
    await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: img ? `[ছবি সংযুক্ত] ${text}` : text, user_id: user.id });

    let full = "";
    try {
      const { data: s } = await supabase.auth.getSession();
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ messages: history.slice(-40).map((m, i, arr) => (i === arr.length - 1 ? m : { role: m.role, content: m.content })) }),
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
          const delta = JSON.parse(d).choices?.[0]?.delta?.content;
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
    setPost(3);
    setLoading(false);
    if (full) {
      const htmlCode = full.match(/```html\s*\n([\s\S]*?)(?:```|$)/i)?.[1];
      if (htmlCode && /<html/i.test(htmlCode)) {
        setPost(4);
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
          } else {
            full += `\n\nলাইভ লিংক তৈরি করা যায়নি (${pr.status})। আবার চেষ্টা করুন।`;
            setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]);
          }
        } catch {}
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
    setPost(5);
    setTimeout(() => setPost(null), 1800);
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
        <div className="space-y-1 border-t border-border p-3 text-sm">
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
      <main className="pattern-bg flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <button className="md:hidden" onClick={() => setSidebar(!sidebar)} aria-label="মেনু"><Menu /></button>
          <span className="font-display text-lg text-primary">আল আহসান এআই</span>
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
                      {i === msgs.length - 1 && (loading || post !== null) && (
                        <WorkflowStepper stage={post ?? (!m.content ? 0 : m.content.length < 300 ? 1 : 2)} />
                      )}
                      {m.content ? (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={loading && i === msgs.length - 1 ? mdStreaming : mdDone}>{m.content}</ReactMarkdown>
                          <div className="mt-1 flex gap-3 text-muted-foreground">
                            <button onClick={() => copy(m.content, i)} className="flex items-center gap-1 text-xs hover:text-primary" aria-label="কপি">{copied === i ? <Check size={15} /> : <Copy size={15} />}{copied === i ? "কপি হয়েছে" : "কপি"}</button>
                            <button onClick={() => { if (speaking === i) { window.speechSynthesis?.cancel(); setSpeaking(null); } else { speak(m.content); setSpeaking(i); } }} className="flex items-center gap-1 text-xs hover:text-primary" aria-label="শুনুন">{speaking === i ? <><Square size={14} /> থামান</> : <><Volume2 size={15} /> শুনুন</>}</button>
                          </div>
                        </>
                      ) : (
                        <GlowingThinkingCard elapsed={elapsed} />
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
          {listening && (
            <div className="mx-auto max-w-3xl mb-2 flex items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs sm:text-sm text-destructive animate-pulse shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <Radio size={16} className="animate-spin [animation-duration:3s]" />
                <span>ভয়েস শুনছি... মুখে কথা বলুন (বাংলা বা ইংরেজি)</span>
              </div>
              <button onClick={() => recRef.current?.stop()} className="rounded-lg bg-destructive px-2.5 py-1 text-xs text-destructive-foreground font-semibold hover:opacity-90">
                শেষ করুন
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/60">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} className="rounded-xl p-3 text-primary hover:bg-primary/10" aria-label="ছবি যুক্ত করুন" title="ছবি যুক্ত করুন"><ImagePlus size={20} /></button>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";
import { GOOGLE_MODELS, LOVABLE_MODELS, OPENAI_MODELS, type Provider } from "@/lib/models";
import { Logo } from "@/components/Logo";
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "সেটিংস ও অ্যাডমিন প্যানেল — আল আহসান এআই" },
      { name: "description", content: "আল আহসান এআই-এর সব সেটিং: নির্দেশনা, মডেল, এপিআই কী, সীমা ও চ্যাট পেজ।" },
      { property: "og:title", content: "সেটিংস — আল আহসান এআই" },
      { property: "og:description", content: "এআই-এর সব কিছু এক জায়গা থেকে নিয়ন্ত্রণ।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});
type S = {
  admin_note: string; system_prompt: string; provider: Provider; model: string;
  hourly_limit: number; daily_limit: number; reasoning_effort: string;
  welcome_title: string; welcome_subtitle: string; suggestions: string;
  url_reader: boolean; site_builder: boolean; chat_enabled: boolean;
};
function AdminPage() {
  const { user } = Route.useRouteContext();
  const admin = useIsAdmin(user.id);
  const [s, setS] = useState<S | null>(null);
  const [gKey, setGKey] = useState("");
  const [oKey, setOKey] = useState("");
  const [show, setShow] = useState(false);
  const [pool, setPool] = useState<PoolKey[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!admin) return;
    supabase.from("ai_settings").select("*").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (data) return setS(data as unknown as S);
      setStatus(error ? `সেটিংস আনা যায়নি: ${error.message}` : "");
      setS({ admin_note: "", system_prompt: "", provider: "lovable", model: "", hourly_limit: 30, daily_limit: 200, reasoning_effort: "low", welcome_title: "", welcome_subtitle: "", suggestions: "", url_reader: true, site_builder: true, chat_enabled: true });
    });
    supabase.from("ai_keys").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setGKey(data.google_key); setOKey(data.openai_key);
        setPool(Array.isArray(data.key_pool) ? (data.key_pool as unknown as PoolKey[]) : []);
      }
    });
  }, [admin]);
  if (admin === null) return <div className="min-h-screen bg-background" />;
  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center">
        <div>
          <h1 className="font-display text-3xl">প্রবেশাধিকার নেই</h1>
          <Link to="/chat" className="mt-4 inline-block text-primary">চ্যাটে ফিরে যান</Link>
        </div>
      </div>
    );
  }
  if (!s) return <div className="min-h-screen bg-background p-8 text-muted-foreground">লোড হচ্ছে…</div>;
  const set = <K extends keyof S>(k: K, v: S[K]) => setS({ ...s, [k]: v });
  const listFor = (p: Provider) => (p === "google" ? GOOGLE_MODELS : p === "openai" ? OPENAI_MODELS : LOVABLE_MODELS);
  const models = listFor(s.provider);
  const save = async () => {
    setStatus("সংরক্ষণ হচ্ছে…");
    const r1 = await supabase.from("ai_settings").upsert({
      ...s,
      id: 1,
      hourly_limit: Math.max(1, s.hourly_limit || 1),
      daily_limit: Math.max(1, s.daily_limit || 1),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    const seen = new Set([gKey.trim(), oKey.trim()].filter(Boolean));
    const cleanPool = pool.filter((p) => p.key.trim()).map((p) => ({ ...p, name: p.name.trim() || p.provider, key: p.key.trim() }))
      .filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true))).slice(0, 2);
    setPool(cleanPool);
    const r2 = await supabase.from("ai_keys").upsert({ id: 1, google_key: gKey.trim(), openai_key: oKey.trim(), key_pool: cleanPool, updated_at: new Date().toISOString() }, { onConflict: "id" });
    const err = r1.error || r2.error;
    setStatus(err ? `ত্রুটি: ${err.message}` : "✓ সংরক্ষিত হয়েছে। এআই এখন থেকেই নতুন সেটিং অনুযায়ী চলবে।");
  };
  const card = "mt-6 rounded-2xl border border-border bg-card/80 p-6";
  const input = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary";
  const h2 = "font-display text-xl text-primary";
  const hint = "mt-1 text-sm text-muted-foreground";
  const Toggle = ({ k, label }: { k: "url_reader" | "site_builder" | "chat_enabled"; label: string }) => (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm">
      {label}
      <input type="checkbox" checked={s[k]} onChange={(e) => set(k, e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
    </label>
  );
  return (
    <div className="pattern-bg min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-3 py-8 pb-28 sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={40} />
            <div className="min-w-0">
              <h1 className="font-display text-3xl">সেটিংস</h1>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link to="/chat" className="flex items-center gap-1 text-primary"><ArrowLeft size={16} /> চ্যাট</Link>
        </div>
        <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          এখান থেকে এআই-এর আচরণ, মডেল, এপিআই কী, সীমা ও চ্যাট পেজের লেখা — সব বদলাতে পারবেন। বদলানোর পর নিচের "সংরক্ষণ করুন" চাপুন।
        </p>
        <section className={card}>
          <h2 className={h2}>১. এআই-কে নির্দেশনা (সর্বোচ্চ অগ্রাধিকার)</h2>
          <p className={hint}>এখানে যা লিখবেন, এআই সবার আগে সেটাই মানবে। যেমন: "সব উত্তর সংক্ষেপে দেবে", "নতুন তথ্য: আমাদের ফোন নম্বর …"।</p>
          <textarea value={s.admin_note} onChange={(e) => set("admin_note", e.target.value)} rows={8} className={`${input} mt-3`} />
        </section>
        <section className={card}>
          <h2 className={h2}>২. এআই-এর মূল পরিচয় ও দক্ষতা (ঐচ্ছিক)</h2>
          <p className={hint}>খালি রাখলে আগে থেকে তৈরি শক্তিশালী নির্দেশনা চলবে। এখানে লিখলে সেটি পুরোপুরি বদলে আপনার লেখা চলবে (ধৈর্যশীল ও বুদ্ধিমান ব্যবহার সবসময় বজায় থাকবে)।</p>
          <textarea value={s.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} rows={8} className={`${input} mt-3`}
            placeholder="যেমন: তুমি আল আহসান এআই, ছাত্রদের শিক্ষক…" />
        </section>
        <section className={card}>
          <h2 className={h2}>৩. এআই মোড, মডেল ও চিন্তার গভীরতা</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([["lovable", "বিল্ট-ইন"], ["google", "Google Gemini"], ["openai", "OpenAI"]] as const).map(([p, l]) => (
              <button key={p} onClick={() => setS({ ...s, provider: p, model: listFor(p)[0]?.id ?? "" })}
                className={`rounded-lg border px-3 py-3 text-sm ${s.provider === p ? "border-primary bg-primary/15 text-primary" : "border-border"}`}>{l}</button>
            ))}
          </div>
          <label className="mt-4 block text-sm text-muted-foreground">মডেল</label>
          <select value={s.model} onChange={(e) => set("model", e.target.value)} className={`${input} mt-1`}>
            {!models.some((m) => m.id === s.model) && s.model && <option value={s.model}>{s.model}</option>}
            {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <label className="mt-2 block text-xs text-muted-foreground">অথবা নিজে মডেলের নাম লিখুন</label>
          <input value={s.model} onChange={(e) => set("model", e.target.value)} className={`${input} mt-1 text-sm`} />
          <label className="mt-4 block text-sm text-muted-foreground">চিন্তার গভীরতা (বিল্ট-ইন GPT-6 Astra)</label>
          <select value={s.reasoning_effort} onChange={(e) => set("reasoning_effort", e.target.value)} className={`${input} mt-1`}>
            <option value="low">কম — দ্রুত উত্তর</option>
            <option value="medium">মাঝারি — ভারসাম্য</option>
            <option value="high">বেশি — গভীর চিন্তা</option>
            <option value="xhigh">সর্বোচ্চ — সবচেয়ে বুদ্ধিমান (ধীর)</option>
          </select>
        </section>
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className={h2}>৪. এপিআই কী</h2>
            <button onClick={() => setShow(!show)} className="flex items-center gap-1 text-sm text-muted-foreground">
              {show ? <EyeOff size={15} /> : <Eye size={15} />} {show ? "লুকান" : "দেখুন"}
            </button>
          </div>
          <p className={hint}>শুধু অ্যাডমিন দেখতে পান। Google বা OpenAI মোড বেছে নিলে এই কী ব্যবহার হবে। বিল্ট-ইন মোডে কী লাগে না।</p>
          <label className="mt-4 block text-sm text-muted-foreground">Google Gemini API Key</label>
          <input type={show ? "text" : "password"} value={gKey} onChange={(e) => setGKey(e.target.value)} className={`${input} mt-1`} placeholder="AIza…" />
          <label className="mt-3 block text-sm text-muted-foreground">OpenAI API Key</label>
          <input type={show ? "text" : "password"} value={oKey} onChange={(e) => setOKey(e.target.value)} className={`${input} mt-1`} placeholder="sk-…" />
        </section>
        <section className={card}>
          <h2 className={h2}>৫. সুবিধা চালু / বন্ধ</h2>
          <div className="mt-4 space-y-2">
            <Toggle k="chat_enabled" label="সবার জন্য চ্যাট চালু (বন্ধ করলে শুধু অ্যাডমিন চালাতে পারবেন)" />
            <Toggle k="url_reader" label="লিংক পড়া — ব্যবহারকারী লিংক দিলে এআই পেজটি পড়বে" />
            <Toggle k="site_builder" label="ওয়েবসাইট তৈরি ও লাইভ লিংক (/project1 …)" />
          </div>
        </section>
        <section className={card}>
          <h2 className={h2}>৬. ব্যবহারের সীমা</h2>
          <p className={hint}>প্রতিজন ব্যবহারকারী কতটি প্রশ্ন করতে পারবেন। অ্যাডমিনের সীমা নেই।</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="text-sm text-muted-foreground">প্রতি ঘণ্টায়
              <input type="number" min={1} value={s.hourly_limit} onChange={(e) => set("hourly_limit", +e.target.value)} className={`${input} mt-1`} />
            </label>
            <label className="text-sm text-muted-foreground">প্রতি দিনে
              <input type="number" min={1} value={s.daily_limit} onChange={(e) => set("daily_limit", +e.target.value)} className={`${input} mt-1`} />
            </label>
          </div>
        </section>
        <section className={card}>
          <h2 className={h2}>৭. চ্যাট পেজের লেখা</h2>
          <label className="mt-4 block text-sm text-muted-foreground">স্বাগত শিরোনাম</label>
          <input value={s.welcome_title} onChange={(e) => set("welcome_title", e.target.value)} className={`${input} mt-1`} />
          <label className="mt-3 block text-sm text-muted-foreground">স্বাগত বার্তা</label>
          <input value={s.welcome_subtitle} onChange={(e) => set("welcome_subtitle", e.target.value)} className={`${input} mt-1`} />
          <label className="mt-3 block text-sm text-muted-foreground">প্রস্তাবিত প্রশ্ন (প্রতি লাইনে একটি)</label>
          <textarea value={s.suggestions} onChange={(e) => set("suggestions", e.target.value)} rows={5} className={`${input} mt-1`} />
        </section>
        <KeyPool pool={pool} setPool={setPool} show={show} />
        <DriveMemory />
        <FatwaBank />
        <HealthCheck />
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button onClick={save} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
            <Save size={18} /> সংরক্ষণ করুন
          </button>
          <span className="text-sm text-muted-foreground">{status}</span>
        </div>
      </div>
    </div>
  );
}
function DriveMemory() {
  const [items, setItems] = useState<{ id: string; text: string }[] | null>(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const call = async (body: object) => {
    setErr("");
    const { data } = await supabase.auth.getSession();
    const r = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) return setErr(await r.text());
    const j = await r.json();
    if (j.items) setItems(j.items);
  };
  useEffect(() => { call({ action: "list" }); }, []);
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/80 p-6">
      <h2 className="font-display text-xl text-primary">৮. দীর্ঘমেয়াদী স্মৃতি (আপনার অ্যাকাউন্ট)</h2>
      <p className="mt-1 text-sm text-muted-foreground">এআই আপনার সম্পর্কে যা নিরাপদে মনে রাখে — যেকোনো ডিভাইস বা চ্যাট থেকে। ভুল কিছু থাকলে মুছে দিন।</p>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {!items && !err && <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে…</p>}
      <ul className="mt-3 space-y-2">
        {items?.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <span>{m.text}</span>
            <button onClick={() => call({ action: "delete", id: m.id })} className="text-destructive">মুছুন</button>
          </li>
        ))}
        {items?.length === 0 && <li className="text-sm text-muted-foreground">এখনো কোনো স্মৃতি নেই।</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="নতুন কিছু মনে রাখাতে লিখুন…" className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary" />
        <button onClick={() => { if (text.trim().length >= 3) { call({ action: "add", text }); setText(""); } }} className="rounded-lg bg-primary px-4 text-primary-foreground">যোগ</button>
      </div>
    </section>
  );
}
type FatwaRow = { id: string; title: string; source: string; reference: string; original_text: string; ruling: string; keywords: string };
const EMPTY_F = { title: "", source: "", reference: "", original_text: "", ruling: "", keywords: "" };
function FatwaBank() {
  const [rows, setRows] = useState<FatwaRow[] | null>(null);
  const [f, setF] = useState(EMPTY_F);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("fatwa_records").select("id,title,source,reference,original_text,ruling,keywords").order("created_at", { ascending: false });
    if (error) return setMsg(error.message);
    setRows(data as FatwaRow[]);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (f.title.trim().length < 2 || f.ruling.trim().length < 5) return setMsg("বিষয় ও ফতোয়া লেখা আবশ্যক।");
    const payload = { ...f, updated_at: new Date().toISOString() };
    const { error } = editId
      ? await supabase.from("fatwa_records").update(payload).eq("id", editId)
      : await supabase.from("fatwa_records").insert(payload);
    if (error) return setMsg(error.message);
    setMsg(editId ? "আপডেট হয়েছে।" : "সংরক্ষিত হয়েছে।");
    setF(EMPTY_F); setEditId(null); load();
  };
  const del = async (id: string) => {
    if (!confirm("এই ফতোয়াটি মুছবেন?")) return;
    const { error } = await supabase.from("fatwa_records").delete().eq("id", id);
    if (error) return setMsg(error.message);
    load();
  };
  const cls = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary";
  const shown = rows?.filter((r) => !q || (r.title + r.keywords + r.ruling).toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/80 p-6">
      <h2 className="font-display text-xl text-primary">ফতোয়া ভান্ডার (অনুমোদিত নলেজ বেস)</h2>
      <p className="mt-1 text-sm text-muted-foreground">এখানে যোগ করা ফতোয়া ও কিতাবের রেফারেন্স দেখে এআই ফিকহি প্রশ্নের উত্তর দেবে এবং হুবহু সূত্র উল্লেখ করবে।</p>
      <div className="mt-3 grid gap-2">
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="বিষয় / প্রশ্ন (যেমন: সফরে নামাজ কসর)" className={cls} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="কিতাব / ফতোয়া বোর্ড" className={cls} />
          <input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="খণ্ড, পৃষ্ঠা, হাদিস নম্বর" className={cls} />
        </div>
        <textarea value={f.original_text} onChange={(e) => setF({ ...f, original_text: e.target.value })} rows={3} placeholder="মূল এবারত (আরবি/উর্দু, ঐচ্ছিক)" className={cls} />
        <textarea value={f.ruling} onChange={(e) => setF({ ...f, ruling: e.target.value })} rows={5} placeholder="বাংলা ফতোয়া / সিদ্ধান্ত" className={cls} />
        <input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} placeholder="মূল শব্দ (কমা দিয়ে): সফর, কসর, নামাজ" className={cls} />
        <div className="flex items-center gap-2">
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">{editId ? "আপডেট করুন" : "ফতোয়া যোগ করুন"}</button>
          {editId && <button onClick={() => { setEditId(null); setF(EMPTY_F); }} className="rounded-lg border border-border px-4 py-2">বাতিল</button>}
          <span className="text-sm text-muted-foreground">{msg}</span>
        </div>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ভান্ডারে খুঁজুন…" className={`${cls} mt-4`} />
      {!rows && <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে…</p>}
      <ul className="mt-3 space-y-2">
        {shown?.map((r) => (
          <li key={r.id} className="rounded-lg border border-border px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold break-words">{r.title}</p>
                <p className="text-muted-foreground break-words">{r.source} {r.reference}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button onClick={() => { setEditId(r.id); setF({ title: r.title, source: r.source, reference: r.reference, original_text: r.original_text, ruling: r.ruling, keywords: r.keywords }); }} className="text-primary">সম্পাদনা</button>
                <button onClick={() => del(r.id)} className="text-destructive">মুছুন</button>
              </div>
            </div>
          </li>
        ))}
        {rows?.length === 0 && <li className="text-sm text-muted-foreground">এখনো কোনো ফতোয়া যোগ করা হয়নি।</li>}
      </ul>
    </section>
  );
}
type PoolKey = { name: string; provider: "google" | "openai" | "custom"; key: string; base_url?: string; model?: string; active: boolean };
function KeyPool({ pool, setPool, show }: { pool: PoolKey[]; setPool: (p: PoolKey[]) => void; show: boolean }) {
  const input = "w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const upd = (i: number, patch: Partial<PoolKey>) => setPool(pool.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/80 p-6">
      <h2 className="font-display text-xl text-primary">৪ক. সেকেন্ডারি ব্যাকআপ কী (Backup Key - Zero Downtime, সর্বোচ্চ ২টি)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        সর্বোচ্চ ২টি ব্যাকআপ কী রাখা যায়; একই কী দুবার থাকলে সংরক্ষণের সময় স্বয়ংক্রিয়ভাবে বাদ যাবে। মূল কী কাজ না করলে (লিমিট শেষ হলে) এআই নিজে থেকেই তালিকার পরের কী দিয়ে চেষ্টা করবে। "অন্য সেবা" দিয়ে Groq, DeepSeek, OpenRouter-এর মতো যেকোনো সেবা যোগ করা যায়। যোগ করার পর নিচে "সংরক্ষণ করুন" চাপুন।
      </p>
      <div className="mt-4 space-y-3">
        {pool.map((p, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex min-w-0 gap-2">
              <input value={p.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="নাম (যেমন: Google কী ২)" className={input} />
              <select value={p.provider} onChange={(e) => upd(i, { provider: e.target.value as PoolKey["provider"] })} className={`${input} max-w-[9rem]`}>
                <option value="google">Google</option>
                <option value="openai">OpenAI</option>
                <option value="custom">অন্য সেবা</option>
              </select>
            </div>
            <input type={show ? "text" : "password"} value={p.key} onChange={(e) => upd(i, { key: e.target.value })} placeholder="এপিআই কী" className={input} />
            {p.provider === "custom" && (
              <div className="flex gap-2">
                <input value={p.base_url ?? ""} onChange={(e) => upd(i, { base_url: e.target.value })} placeholder="ঠিকানা, যেমন https://api.groq.com/openai/v1" className={input} />
                <input value={p.model ?? ""} onChange={(e) => upd(i, { model: e.target.value })} placeholder="মডেলের নাম" className={input} />
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={p.active} onChange={(e) => upd(i, { active: e.target.checked })} /> চালু
              </label>
              <button onClick={() => setPool(pool.filter((_, j) => j !== i))} className="text-destructive">মুছুন</button>
            </div>
          </div>
        ))}
      </div>
      {pool.length < 2 && <button onClick={() => setPool([...pool, { name: "", provider: "google", key: "", active: true }])}
        className="mt-3 rounded-lg border border-primary px-4 py-2 text-sm text-primary">+ নতুন কী যোগ করুন</button>}
    </section>
  );
}
type Issue = { id: string; area: string; title: string; detail: string; fix?: string; fixLabel?: string };
type Scan = { issues: Issue[]; passed: string[]; at: string; repaired?: { ok: boolean; message: string } };
function HealthCheck() {
  const [res, setRes] = useState<Scan | null>(null);
  const [live, setLive] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    supabase.from("health_checks").select("results").order("id", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { const r = data?.results as any; if (r?.issues) setRes(r); });
  }, []);
  const run = async (fix?: string, label?: string) => {
    setNote(null);
    setLive(fix ? `"${label}" সমাধান করা হচ্ছে, তারপর আবার স্ক্যান চলবে…` : "পুরো সিস্টেম স্ক্যান চলছে — ডাটাবেস, এআই, ছবি, কী-পুল, ড্রাইভ, অ্যাডমিন…");
    try {
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/health", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` }, body: JSON.stringify(fix ? { fix } : {}) });
      if (!r.ok) throw new Error(await r.text());
      const j: Scan = await r.json();
      setRes(j);
      if (fix) {
        const still = j.issues.some((i) => i.fix === fix);
        setNote({ ok: !!j.repaired?.ok && !still, text: `${j.repaired?.message ?? ""}${still ? " — কিন্তু সমস্যাটি এখনো আছে" : " — যাচাই করে দেখা গেছে সমাধান হয়েছে"}` });
      } else setNote({ ok: j.issues.length === 0, text: j.issues.length ? `${j.issues.length}টি প্রকৃত সমস্যা পাওয়া গেছে` : "কোনো সমস্যা নেই — সব সচল" });
    } catch (e: any) { setNote({ ok: false, text: e?.message || "স্ক্যান ব্যর্থ" }); }
    setLive(null);
  };
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/80 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-primary">৯. মেগা ডায়াগনস্টিক সেন্টার</h2>
        <button onClick={() => run()} disabled={!!live} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">পুরো স্ক্যান করুন</button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{res ? `সর্বশেষ স্ক্যান: ${new Date(res.at).toLocaleString("bn-BD")}` : "এখনো স্ক্যান হয়নি।"}</p>
      {live && <p className="live-status mt-3 text-sm">{live}</p>}
      {note && !live && <p className={`mt-3 text-sm ${note.ok ? "text-primary" : "text-destructive"}`}>{note.ok ? "সফল: " : "ফলাফল: "}{note.text}</p>}
      {res && res.issues.length === 0 && <p className="mt-3 rounded-lg border border-primary/40 px-3 py-2 text-sm text-primary">কোনো সক্রিয় সমস্যা নেই।</p>}
      <ul className="mt-3 space-y-2">
        {res?.issues.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 px-3 py-2 text-sm">
            <span><span className="text-destructive">{c.area}:</span> <b>{c.title}</b><br /><span className="text-xs text-muted-foreground">{c.detail}</span></span>
            {c.fix ? (
              <button onClick={() => run(c.fix, c.title)} disabled={!!live} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-60">সমাধান করুন</button>
            ) : <span className="shrink-0 text-xs text-muted-foreground">হাতে ঠিক করতে হবে</span>}
          </li>
        ))}
      </ul>
      {res && res.passed.length > 0 && <p className="mt-3 text-xs text-muted-foreground">সচল: {res.passed.join(" · ")}</p>}
    </section>
  );
}

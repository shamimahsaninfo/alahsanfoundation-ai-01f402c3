import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Compass, MapPin, Navigation, RefreshCw } from "lucide-react";
import { Logo } from "@/components/Logo";
export const Route = createFileRoute("/_authenticated/salat")({
  head: () => ({
    meta: [
      { title: "নামাজের সময়, কিবলা ও নিকটস্থ মসজিদ — আল আহসান এআই" },
      { name: "description", content: "আপনার অবস্থান অনুযায়ী পাঁচ ওয়াক্ত নামাজের সময়, সেহরি-ইফতার, কিবলার দিক ও কাছের মসজিদ।" },
      { property: "og:title", content: "নামাজের সময় ও কিবলা — আল আহসান এআই" },
      { property: "og:description", content: "অবস্থানভিত্তিক নামাজের সময়সূচি, কিবলা ও নিকটস্থ মসজিদ।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalatPage,
});
type Pos = { lat: number; lng: number };
type Timings = Record<string, string>;
type Mosque = { name: string; lat: number; lng: number; dist: number };
const NAMES: [string, string][] = [
  ["Imsak", "সেহরির শেষ সময়"], ["Fajr", "ফজর"], ["Sunrise", "সূর্যোদয়"], ["Dhuhr", "যোহর"],
  ["Asr", "আসর"], ["Maghrib", "মাগরিব (ইফতার)"], ["Isha", "এশা"],
];
const CACHE = "alahsan-salat-cache";
const rad = (d: number) => (d * Math.PI) / 180;
function qibla({ lat, lng }: Pos): number {
  const k = { lat: 21.4225, lng: 39.8262 };
  const y = Math.sin(rad(k.lng - lng));
  const x = Math.cos(rad(lat)) * Math.tan(rad(k.lat)) - Math.sin(rad(lat)) * Math.cos(rad(k.lng - lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function distKm(a: Pos, b: Pos): number {
  const R = 6371, dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const bn = (s: string | number) => String(s).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]!);
function to12(t: string): string {
  const [h, m] = t.split(" ")[0]!.split(":").map(Number);
  const hh = ((h! + 11) % 12) + 1;
  return bn(`${hh}:${String(m).padStart(2, "0")}`) + (h! < 12 ? " পূর্বাহ্ণ" : " অপরাহ্ণ");
}
function SalatPage() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [times, setTimes] = useState<Timings | null>(null);
  const [mosques, setMosques] = useState<Mosque[] | null>(null);
  const [radius, setRadius] = useState(3);
  const [status, setStatus] = useState("");
  const [heading, setHeading] = useState<number | null>(null);
  const DHAKA: Pos = { lat: 23.8103, lng: 90.4125 };
  const loadFor = async (p: Pos, note = "") => {
    setPos(p);
    setStatus("নামাজের সময়সূচি সংগ্রহ করা হচ্ছে...");
    try {
      const r = await fetch(`https://api.aladhan.com/v1/timings?latitude=${p.lat}&longitude=${p.lng}&method=1&school=1`);
      const j = await r.json();
      const t = j?.data?.timings as Timings | undefined;
      if (!t) throw new Error();
      setTimes(t);
      if (!note) localStorage.setItem(CACHE, JSON.stringify({ pos: p, times: t, at: Date.now() }));
      setStatus(note);
    } catch { setStatus("নামাজের সময় আনা যায়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।"); }
    findMosques(p);
  };
  const DHAKA_NOTE = "অবস্থান পাওয়া যায়নি, তাই ঢাকা, বাংলাদেশের সময় ও কিবলা দেখানো হচ্ছে।";
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || "null");
      if (c?.pos) { setPos(c.pos); setTimes(c.times); setStatus("সংরক্ষিত সময়সূচি দেখানো হচ্ছে (অফলাইনেও কাজ করবে)।"); return; }
    } catch { /* ignore */ }
    loadFor(DHAKA, "ডিফল্ট হিসেবে ঢাকা, বাংলাদেশের সময় দেখানো হচ্ছে। নিজের এলাকার জন্য উপরের বোতাম চাপুন।");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const locate = () => {
    if (!navigator.geolocation) { void loadFor(DHAKA, DHAKA_NOTE); return; }
    setStatus("আপনার ভৌগোলিক অবস্থান শনাক্ত করা হচ্ছে...");
    navigator.geolocation.getCurrentPosition(
      (g) => loadFor({ lat: g.coords.latitude, lng: g.coords.longitude }),
      () => loadFor(DHAKA, DHAKA_NOTE),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  const findMosques = async (p: Pos, km = radius) => {
    setMosques(null);
    const m = km * 1000;
    const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${m},${p.lat},${p.lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:${m},${p.lat},${p.lng});node["building"="mosque"](around:${m},${p.lat},${p.lng});way["building"="mosque"](around:${m},${p.lat},${p.lng}););out center 60;`;
    const servers = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
    for (const url of servers) {
      try {
        const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q) });
        if (!r.ok) continue;
        const j = await r.json();
        const list: Mosque[] = (j.elements || []).map((e: any) => {
          const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
          return { name: e.tags?.["name:bn"] || e.tags?.name || "নামহীন মসজিদ", lat, lng, dist: distKm(p, { lat, lng }) };
        }).filter((x: Mosque) => x.lat && x.lng).sort((a: Mosque, b: Mosque) => a.dist - b.dist).slice(0, 20);
        setMosques(list);
        return;
      } catch { /* পরের সার্ভার */ }
    }
    setMosques([]);
  };
  const startCompass = async () => {
    const D = (window as any).DeviceOrientationEvent;
    if (D?.requestPermission) { try { if ((await D.requestPermission()) !== "granted") return; } catch { return; } }
    window.addEventListener("deviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation", (e: any) => {
      const h = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
      if (h != null) setHeading(h);
    }, true);
  };
  const q = pos ? qibla(pos) : null;
  const card = "mt-5 rounded-2xl border border-border bg-card/80 p-5";
  return (
    <div className="pattern-bg min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Logo size={36} /><h1 className="font-display text-2xl">নামাজ ও কিবলা</h1></div>
          <Link to="/chat" className="flex items-center gap-1 text-primary"><ArrowLeft size={16} /> চ্যাট</Link>
        </div>
        <button onClick={locate} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
          {pos ? <RefreshCw size={18} /> : <MapPin size={18} />} {pos ? "অবস্থান হালনাগাদ করুন" : "আমার অবস্থান শনাক্ত করুন"}
        </button>
        {status && <p className="mt-3 text-center text-sm"><span className={status.endsWith("...") ? "live-status" : "text-muted-foreground"}>{status}</span></p>}
        {times && (
          <section className={card}>
            <h2 className="font-display text-xl text-primary">আজকের সময়সূচি</h2>
            <p className="text-xs text-muted-foreground">হিসাব পদ্ধতি: করাচি বিশ্ববিদ্যালয়, হানাফি মাযহাব (আসর)। স্থানীয় মসজিদের সময়ের সাথে সামান্য পার্থক্য থাকতে পারে।</p>
            <div className="mt-3 divide-y divide-border">
              {NAMES.map(([k, l]) => times[k] && (
                <div key={k} className="flex justify-between py-2.5"><span>{l}</span><span className="font-medium">{to12(times[k]!)}</span></div>
              ))}
            </div>
          </section>
        )}
        {q != null && (
          <section className={card}>
            <h2 className="font-display text-xl text-primary">কিবলার দিক</h2>
            <p className="mt-1 text-sm text-muted-foreground">উত্তর দিক থেকে ঘড়ির কাঁটার দিকে {bn(q.toFixed(1))}°</p>
            <div className="relative mx-auto mt-4 h-48 w-48 rounded-full border-2 border-primary/40">
              <span className="absolute left-1/2 top-1 -translate-x-1/2 text-xs text-muted-foreground">উ</span>
              <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `rotate(${q - (heading ?? 0)}deg)` }}>
                <div className="absolute left-1/2 top-3 h-[42%] w-1 -translate-x-1/2 rounded-full bg-primary" />
                <Navigation className="absolute left-1/2 top-1 -translate-x-1/2 text-primary" size={20} />
              </div>
            </div>
            <button onClick={startCompass} className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Compass size={16} /> {heading == null ? "ফোনের কম্পাস চালু করুন" : "কম্পাস চালু আছে — ফোন সমতলে রাখুন"}</button>
          </section>
        )}
        {pos && (
          <section className={card}>
            <h2 className="font-display text-xl text-primary">নিকটস্থ মসজিদ</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {[3, 5, 10].map((k) => (
                <button key={k} onClick={() => { setRadius(k); findMosques(pos, k); }} className={`rounded-lg border px-3 py-1.5 text-sm ${radius === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{bn(k + " কিমি")}</button>
              ))}
              <a href={`https://www.google.com/maps/search/mosque/@${pos.lat},${pos.lng},15z`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-primary/40 px-3 py-1.5 text-sm text-primary">গুগল ম্যাপসে সব মসজিদ দেখুন</a>
            </div>
            {mosques === null ? <p className="mt-2 text-sm live-status">কাছের মসজিদ খোঁজা হচ্ছে...</p>
              : mosques.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">এই দূরত্বে মানচিত্রের তথ্যে মসজিদ পাওয়া যায়নি — দূরত্ব বাড়ান বা গুগল ম্যাপসে দেখুন।</p>
              : <div className="mt-2 divide-y divide-border">
                  {mosques.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <div><div>{m.name}</div><div className="text-xs text-muted-foreground">{bn(m.dist < 1 ? Math.round(m.dist * 1000) + " মিটার" : m.dist.toFixed(1) + " কিমি")}</div></div>
                      <a href={`https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${m.lat},${m.lng}&travelmode=walking`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-primary/40 px-3 py-1.5 text-sm text-primary">পথ দেখুন</a>
                    </div>
                  ))}
                </div>}
            <p className="mt-2 text-xs text-muted-foreground">তথ্যসূত্র: OpenStreetMap</p>
          </section>
        )}
      </div>
    </div>
  );
}

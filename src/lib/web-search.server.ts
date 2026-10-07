// Free live web lookup (no API key): DuckDuckGo HTML results + Google News RSS for news.
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36";

const LIVE_RE = /আজ|আজকে|এখন|বর্তমান|সর্বশেষ|লেটেস্ট|খবর|সংবাদ|দাম|দর|মূল্য|বাজার|রেট|আবহাওয়া|স্কোর|ফলাফল|কত টাকা|news|price|rate|latest|today|current|weather|score|live|trending/i;
const NEWS_RE = /খবর|সংবাদ|news|শিরোনাম|headline/i;

export function needsLiveSearch(q: string) {
  return LIVE_RE.test(q) && !/ওয়েবসাইট|website|কোড|code|html/i.test(q);
}

const strip = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

async function ddg(q: string) {
  const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=bd-bn`, {
    headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return [];
  const html = await r.text();
  const out: { title: string; url: string; snippet: string }[] = [];
  const re = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && out.length < 6) {
    let url = m[1] ?? "";
    const u = url.match(/uddg=([^&]+)/);
    if (u?.[1]) url = decodeURIComponent(u[1]);
    if (/duckduckgo\.com\/y\.js/.test(url)) continue; // ads
    out.push({ title: strip(m[2] ?? ""), url, snippet: strip(m[3] ?? "") });
  }
  return out;
}

async function news() {
  const r = await fetch("https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>/g)]
    .slice(0, 10)
    .map((x) => `- ${strip((x[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, ""))} (${x[2] ?? ""})`);
}

async function pageText(url: string) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), redirect: "follow" });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("html")) return "";
    const t = await r.text();
    return strip(t.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")).slice(0, 1800);
  } catch { return ""; }
}

export async function liveSearch(q: string): Promise<string> {
  const query = q.slice(0, 200);
  const [results, headlines] = await Promise.all([
    ddg(query).catch(() => []),
    NEWS_RE.test(q) ? news().catch(() => []) : Promise.resolve([] as string[]),
  ]);
  if (!results.length && !headlines.length) return "";
  const pages = await Promise.all(results.slice(0, 2).map((r) => pageText(r.url)));
  let out = "";
  if (headlines.length) out += `সর্বশেষ শিরোনাম (Google News বাংলাদেশ):\n${headlines.join("\n")}\n\n`;
  results.forEach((r, i) => {
    out += `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}\n`;
    if (pages[i]) out += `পেজের অংশ: ${pages[i]}\n`;
    out += "\n";
  });
  return out.slice(0, 9000);
}

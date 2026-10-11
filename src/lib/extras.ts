// Browser-only helpers: document text extraction, bookmarks, share cards.

export async function extractDocText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (/\.(txt|md|csv|json|html?|xml|js|ts|py|css)$/.test(name) || file.type.startsWith("text/")) {
    return await file.text();
  }
export type Bookmark = { id: string; content: string; at: number };
const BK = "alahsan-bookmarks";
export function loadBookmarks(): Bookmark[] {
  try { return JSON.parse(localStorage.getItem(BK) || "[]"); } catch { return []; }
}
export function saveBookmarks(b: Bookmark[]) {
  localStorage.setItem(BK, JSON.stringify(b.slice(0, 200)));
}

export function downloadShareCard(text: string) {
  const W = 1080, H = 1350, pad = 90;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--background").trim() || "#0f1a14";
  const fg = css.getPropertyValue("--foreground").trim() || "#f4efe0";
  const pr = css.getPropertyValue("--primary").trim() || "#c9a24a";
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = pr; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = pr; g.font = "600 44px 'Hind Siliguri', sans-serif"; g.textAlign = "center";
  g.fillText("আল আহসান এআই", W / 2, 140);
  g.fillStyle = fg; g.font = "400 38px 'Hind Siliguri', sans-serif"; g.textAlign = "left";
  const clean = text.replace(/```[\s\S]*?```/g, "").replace(/[#*_>`|]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
  const lines: string[] = [];
  for (const para of clean.split("\n")) {
    let cur = "";
    for (const w of para.split(/\s+/)) {
      const t = cur ? cur + " " + w : w;
      if (g.measureText(t).width > W - pad * 2 && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    lines.push(cur);
  }
  let y = 230;
  for (const l of lines) { if (y > H - 160) { g.fillText("...", pad, y); break; } g.fillText(l, pad, y); y += 58; }
  g.fillStyle = pr; g.font = "400 28px 'Hind Siliguri', sans-serif"; g.textAlign = "center";
  g.fillText("আল আহসান ফাউন্ডেশন বাংলাদেশ", W / 2, H - 90);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "al-ahsan-card.png";
  a.click();
}

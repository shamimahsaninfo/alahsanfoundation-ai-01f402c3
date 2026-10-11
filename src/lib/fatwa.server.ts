// Foundation-approved fatwa knowledge base retrieval (keyword scoring, server-only).
export type Fatwa = { title: string; source: string; reference: string; original_text: string; ruling: string; keywords: string };

const STOP = new Set(["কি", "কী", "কেন", "এবং", "আর", "এর", "করা", "হবে", "আছে", "না", "যে", "কিভাবে", "কীভাবে", "সম্পর্কে", "the", "is", "a", "of", "and", "what", "how"]);

export function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}

export function rankFatwas(question: string, rows: Fatwa[], limit = 4): Fatwa[] {
  const q = tokenize(question);
  if (!q.length) return [];
  return rows
    .map((r) => {
      const title = r.title.toLowerCase(), kw = r.keywords.toLowerCase(), body = (r.ruling + " " + r.original_text).toLowerCase();
      let score = 0;
      for (const w of q) {
        if (kw.includes(w)) score += 3;
        if (title.includes(w)) score += 3;
        if (body.includes(w)) score += 1;
      }
      return { r, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}

export async function findFatwas(question: string): Promise<Fatwa[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).from("fatwa_records").select("title,source,reference,original_text,ruling,keywords").limit(2000);
  if (error || !data) return [];
  return rankFatwas(question, data as any);
}

export function fatwaPrompt(items: Fatwa[]): string {
  if (!items.length) return "";
  return `\n\n=== ফাউন্ডেশনের অনুমোদিত ফতোয়া ভান্ডার (সর্বোচ্চ অগ্রাধিকার) ===\n${items
    .map((f, i) => `[${i + 1}] বিষয়: ${f.title}\nসূত্র: ${f.source || "উল্লেখ নেই"} ${f.reference}\n${f.original_text ? "মূল এবারত: " + f.original_text.slice(0, 1500) + "\n" : ""}ফতোয়া: ${f.ruling.slice(0, 3000)}`)
    .join("\n\n")}\n\nনির্দেশ: প্রশ্নটি এই ফতোয়াগুলোর সাথে মিললে এদের ভিত্তিতেই উত্তর দেবে, ভিন্নমত বানাবে না। ধাপে উত্তর সাজাবে: দলিল → ফিকহি বিশ্লেষণ → চূড়ান্ত সিদ্ধান্ত। শেষে "সূত্র (আল-আহসান ফাউন্ডেশন ফতোয়া ভান্ডার):" লিখে উপরের কিতাব ও পৃষ্ঠা হুবহু দেবে। এখানে নেই এমন রেফারেন্স বানাবে না।`;
}


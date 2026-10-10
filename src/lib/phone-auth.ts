const DOMAIN = "phone.alahsan.app";

/** বাংলাদেশি নম্বর (01XXXXXXXXX, +880, বাংলা সংখ্যা) যাচাই করে ৮৮ যুক্ত করে */
export function normalizePhone(raw: string): string | null {
  const en = raw.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[^\d]/g, "");
  let n = en;
  if (n.startsWith("880")) n = n.slice(2);
  else if (n.startsWith("88")) n = n.slice(2);
  if (!/^01[3-9]\d{8}$/.test(n)) return null;
  return "88" + n;
}

/** মোবাইল নম্বরকে ব্যাকএন্ড আইডিতে রূপান্তর করে */
export const phoneToEmail = (p: string) => `${p}@${DOMAIN}`;

/** ব্যবহারকারীকে প্রদর্শনের সময় নম্বরটি পরিষ্কার দেখায় */
export function displayAccount(email?: string | null): string {
  if (!email) return "";
  const m = new RegExp(`^88(\\d{11})@${DOMAIN.replace(/\./g, "\\.")}$`).exec(email);
  return m ? m[1]! : email;
}

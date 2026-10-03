## আল আহসান এআই — নতুন প্রজেক্ট চালু করার পরিকল্পনা

শামীম ভাই, হ্যাঁ চিনেছি — আগের সব কাজ (বাংলা অনুবাদ, ড্রাইভ মেমোরি, সত্যতা যাচাই ফিল্টার, সেটিংস পেজ) এই নতুন প্রজেক্টে চলে এসেছে।

### যা করা হবে
1. **ডাটাবেস সেটআপ পরিষ্কার রাখা** — যাচাই করেছি: কপি হয়ে আসা পুরোনো কোনো মাইগ্রেশন নেই, শুধু খালি তালিকা আছে। এটি নতুন প্রজেক্টের জন্য প্রস্তুত, কিছু বদলানো লাগবে না।
2. **গুগল ড্রাইভ যুক্ত করা** — একটি অনুমোদন কার্ড আসবে; আপনি আপনার ড্রাইভ বেছে নিলে এআই-এর স্থায়ী স্মৃতি আবার কাজ করবে।
3. **সেটিংস পেজ ঠিক করা** — যে অংশটি অনুপস্থিত থাকায় পেজ খুলছে না, সেই "ড্রাইভ মেমোরি" অংশটি যোগ করা হবে, যেখানে সংরক্ষিত তথ্যগুলো দেখা ও মোছা যাবে।
4. **পরীক্ষা** — সেটিংস পেজ খোলে কিনা এবং কোনো ত্রুটি নেই, তা যাচাই।

### Technical details
- `drizzle/migrations` contains only `meta/_journal.json`; no copied SQL files, so no rescaffold needed.
- Call `standard_connectors--connect` with `google_drive`; `drive-memory.server.ts` reads `GOOGLE_DRIVE_API_KEY`.
- Add a `DriveMemory` component in `src/routes/_authenticated/admin.tsx` that lists/deletes items via the existing `/api/memory` route (read it first to match its API).
- Check build-errors.log afterwards.

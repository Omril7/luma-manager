# Luma Manager — מנהל פיננסי לעסק

אפליקציית ניהול פיננסי לעסק עצמאי: הוצאות, הכנסות, תזרים מזומנים, לוח שנה ותמחור מוצרים.

## סטאק טכנולוגי

- **Next.js 14** (App Router, TypeScript strict)
- **Supabase** — Auth + Postgres + RLS
- **Tailwind CSS** + shadcn/ui (RTL)
- **Cloudinary** — אחסון קבלות ומסמכים
- **Nodemailer** — שליחת סיכום חודשי במייל
- **Recharts** — גרפים
- **react-big-calendar** — לוח שנה בעברית

## התקנה

```bash
npm install
cp .env.example .env.local
# מלא את הערכים ב־.env.local
npm run dev
```

## פקודות

```bash
npm run dev                   # שרת פיתוח
npm run build                 # בדיקת build לפרודקשן
npx supabase db push          # דחיפת migrations ל־Supabase
```

## מבנה הפיצ׳רים

| עמוד | תיאור |
|------|-------|
| `/expenses` | הוצאות — טפסים, תשלומים, קבלות, גרפים |
| `/income` | הכנסות — ידני + webhook חנות |
| `/dashboard` | תזרים מזומנים, תשלומי רשויות, עובר ושב |
| `/calendar` | לוח שנה עם אירועים חוזרים (RRULE) |
| `/pricing` | אשף תמחור מוצרים ב-4 שלבים |
| `/settings` | הגדרות: מע״מ, שכר, מייל, יתרת פתיחה |

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6" dir="rtl">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-2">הדף לא נמצא</h2>
      <p className="text-muted-foreground mb-6">הדף שחיפשת אינו קיים או הוסר.</p>
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        חזרה לדף הבית
      </Link>
    </div>
  )
}

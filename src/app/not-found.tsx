import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6" dir="rtl">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">הדף לא נמצא</h2>
      <p className="text-gray-500 mb-6">הדף שחיפשת אינו קיים או הוסר.</p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        חזרה לדף הבית
      </Link>
    </div>
  )
}

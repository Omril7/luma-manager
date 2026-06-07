'use client'

import { useState } from 'react'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

type Props = {
  onClose: () => void
  hasGmailConfig: boolean
}

export default function SendSummaryModal({ onClose, hasGmailConfig }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ vatRecognizedCount: number; personalCount: number; attachmentCount: number } | null>(null)

  async function handleSend() {
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      })
      const data = await res.json() as { success?: boolean; error?: string; stats?: typeof stats }
      if (!res.ok || data.error) {
        setError(data.error ?? 'שגיאה בשליחת המייל')
        setStatus('error')
      } else {
        setStats(data.stats ?? null)
        setStatus('success')
      }
    } catch {
      setError('שגיאת רשת — אנא נסה שוב')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">שליחת סיכום חודשי</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {!hasGmailConfig && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              לא הוגדר חשבון Gmail — אנא הגדר בעמוד ההגדרות לפני שליחה.
            </div>
          )}

          {status === 'success' ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl">✅</div>
              <p className="font-medium text-green-700">המייל נשלח בהצלחה!</p>
              {stats && (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>הוצאות עסקיות מוכרות מע&quot;מ: {stats.vatRecognizedCount}</li>
                  <li>הוצאות אישיות: {stats.personalCount}</li>
                  <li>קבלות מצורפות: {stats.attachmentCount}</li>
                </ul>
              )}
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                סגור
              </button>
            </div>
          ) : (
            <>
              {/* Month/year picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">חודש לדוח</label>
                <div className="flex gap-3">
                  <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    min={2020}
                    max={2099}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">מה ייכלל בדוח:</p>
                <p>• הוצאות עסקיות מקטגוריות מוכרות מע&quot;מ</p>
                <p>• הוצאות אישיות (לידיעה בלבד)</p>
                <p>• קבלות מצורפות כקבצים</p>
                <p>• הדוח יישלח אל כתובת ה-Gmail שהוגדרה בהגדרות</p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={status === 'sending' || !hasGmailConfig}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {status === 'sending' ? 'שולח...' : 'שלח'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  ביטול
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

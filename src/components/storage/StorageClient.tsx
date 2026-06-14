'use client'

import { useState } from 'react'
import CleanupModal from './CleanupModal'
import { Button } from '@/components/ui/button'
import type { MonthStats } from '@/app/(dashboard)/storage/actions'
import { Archive, FileArchive, DollarSign, Clock, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

type Tab = 'expenses' | 'income'

type Props = {
  stats: MonthStats[]
}

function MonthList({ stats, onCleanup }: { stats: MonthStats[]; onCleanup: (month: string) => void }) {
  if (stats.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
        <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>אין קבצים באחסון</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      {stats.map(({ month, active, archived }) => {
        const [yearStr, mmStr] = month.split('-')
        const monthName = MONTH_NAMES[parseInt(mmStr, 10) - 1]
        const total = active + archived
        const isClean = active === 0

        return (
          <div key={month} className="flex items-center justify-between px-4 py-3.5">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">{monthName} {yearStr}</p>
              <p className="text-xs text-muted-foreground">
                {total} {total === 1 ? 'קובץ' : 'קבצים'}
                {archived > 0 && active > 0 && ` · ${archived} בארכיון`}
                {isClean && total > 0 && ` · הכל בארכיון`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isClean ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Archive className="h-3 w-3" />
                  נוקה
                </span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {active} פעילים
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onCleanup(month)}
                  >
                    ניקוי
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IncomePlaceholder() {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center space-y-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
        <Clock className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="font-medium text-sm">בקרוב</p>
        <p className="text-xs text-muted-foreground mt-1">
          ניקוי קבצי הכנסות יהיה זמין לאחר אינטגרציית חנות ההזמנות.
        </p>
      </div>
    </div>
  )
}

export default function StorageClient({ stats }: Props) {
  const [tab, setTab] = useState<Tab>('expenses')
  const [cleanupTarget, setCleanupTarget] = useState<string | null>(null)

  const targetStats = cleanupTarget ? stats.find(s => s.month === cleanupTarget) : null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Mobile/tablet blocker */}
      <div className="lg:hidden rounded-xl border bg-card p-10 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Monitor className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-base">יש לפתוח במחשב</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            עמוד זה מוריד קובץ ZIP עם הקבלות.
            <br />
            כדי לשמור את הקובץ בצורה נוחה יש להיכנס מהמחשב הנייד או השולחני.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-col lg:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileArchive className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">איחסון קבצים</h1>
          <p className="text-sm text-muted-foreground">ניהול קבצים שמורים ב-Cloudinary</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex items-center bg-muted border border-border rounded-lg p-0.5 gap-0.5">
        <button
          onClick={() => setTab('expenses')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            tab === 'expenses'
              ? 'bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          הוצאות
        </button>
        <button
          onClick={() => setTab('income')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            tab === 'income'
              ? 'bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <DollarSign className="h-3.5 w-3.5" />
          הכנסות
        </button>
      </div>

      {/* Tab content */}
      {tab === 'expenses' && (
        <MonthList stats={stats} onCleanup={setCleanupTarget} />
      )}

      {tab === 'income' && (
        <IncomePlaceholder />
      )}
      </div>

      {cleanupTarget && targetStats && (
        <CleanupModal
          month={cleanupTarget}
          activeCount={targetStats.active}
          onClose={() => setCleanupTarget(null)}
        />
      )}
    </div>
  )
}

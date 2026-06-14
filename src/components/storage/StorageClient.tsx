'use client'

import { useState } from 'react'
import CleanupModal from './CleanupModal'
import { Button } from '@/components/ui/button'
import type { MonthStats } from '@/app/(dashboard)/storage/actions'
import type { CloudinaryUsage } from '@/lib/cloudinary'
import { Archive, FileArchive, DollarSign, Clock, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

type Tab = 'expenses' | 'income'

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-primary'
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function CloudinaryUsageCard({ usage }: { usage: CloudinaryUsage }) {
  const hasStorageLimit = usage.storage_limit > 0
  const storagePct = hasStorageLimit ? (usage.storage_bytes / usage.storage_limit) * 100 : 0

  const hasCredits = usage.credits_limit > 0
  const creditsPct = hasCredits ? (usage.credits_used / usage.credits_limit) * 100 : 0

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">שימוש ב-Cloudinary</p>
        {usage.plan && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {usage.plan}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">אחסון</p>
          <p className="text-sm font-semibold text-right" dir="ltr">{formatBytes(usage.storage_bytes)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">רוחב פס</p>
          <p className="text-sm font-semibold text-right" dir="ltr">{formatBytes(usage.bandwidth_bytes)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">קבצים</p>
          <p className="text-sm font-semibold text-right" dir="ltr">{usage.resources.toLocaleString()}</p>
        </div>
      </div>

      {hasStorageLimit && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">אחסון כולל</span>
            <span className="font-medium" dir="ltr">{formatBytes(usage.storage_bytes)} / {formatBytes(usage.storage_limit)}</span>
          </div>
          <ProgressBar pct={storagePct} />
        </div>
      )}

      {hasCredits && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">קרדיטים חודשיים</span>
            <span className="font-medium" dir="ltr">{usage.credits_used.toFixed(2)} / {usage.credits_limit}</span>
          </div>
          <ProgressBar pct={creditsPct} />
        </div>
      )}
    </div>
  )
}

type Props = {
  stats: MonthStats[]
  cloudinaryUsage: CloudinaryUsage | null
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

export default function StorageClient({ stats, cloudinaryUsage }: Props) {
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

        {/* Cloudinary usage */}
        {cloudinaryUsage && <CloudinaryUsageCard usage={cloudinaryUsage} />}

        {/* Tab switcher */}
        <div className="flex items-center bg-muted border border-border rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setTab('expenses')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
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
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
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

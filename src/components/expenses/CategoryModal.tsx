'use client'

import { useState, useTransition } from 'react'
import { createCategory, updateCategoryVat, deleteCategory } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Trash2, Tag, Plus } from 'lucide-react'

type Category = { id: string; name: string; is_vat_recognized: boolean }
type Props = { categories: Category[]; onClose: () => void }

export default function CategoryModal({ categories, onClose }: Props) {
  const [cats, setCats] = useState<Category[]>(categories)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!newName.trim()) return
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('is_vat_recognized', 'false')
    startTransition(async () => {
      const result = await createCategory(null, formData)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else {
        setCats(prev => [...prev, { id: crypto.randomUUID(), name: newName.trim(), is_vat_recognized: false }])
        setNewName('')
        setError('')
        toast.success('קטגוריה נוספה')
      }
    })
  }

  function handleToggleVat(cat: Category) {
    startTransition(async () => {
      await updateCategoryVat(cat.id, !cat.is_vat_recognized)
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, is_vat_recognized: !c.is_vat_recognized } : c))
    })
  }

  function handleDelete(catId: string) {
    startTransition(async () => {
      const result = await deleteCategory(catId)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else { setCats(prev => prev.filter(c => c.id !== catId)); toast.success('קטגוריה נמחקה') }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול קטגוריות</DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto pl-1">
          {cats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Tag className="h-8 w-8 opacity-30" />
              <p className="text-sm">אין קטגוריות עדיין</p>
            </div>
          )}

          {cats.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl px-3 py-2.5 transition-colors"
            >
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />

              <span className="text-sm font-medium flex-1 min-w-0 truncate">{cat.name}</span>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">מוכר מע&quot;מ</span>
                <Switch
                  checked={cat.is_vat_recognized}
                  onCheckedChange={() => handleToggleVat(cat)}
                  disabled={isPending}
                  aria-label={cat.is_vat_recognized ? 'הוצאה מוכרת מע"מ' : 'הוצאה אינה מוכרת מע"מ'}
                />
              </div>

              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={isPending}
                title="מחק קטגוריה"
                className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={e => { e.preventDefault(); handleAdd() }}
          className="flex gap-2 pt-2 border-t border-border"
        >
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">קטגוריה חדשה</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="למשל: ציוד משרדי"
              className="flex-1"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isPending || !newName.trim()} size="sm">
              <Plus className="h-4 w-4 ml-1" />
              הוסף
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

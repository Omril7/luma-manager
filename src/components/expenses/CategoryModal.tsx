'use client'

import { useState, useTransition } from 'react'
import { createCategory, updateCategoryVat, deleteCategory } from '@/app/(dashboard)/expenses/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {cats.length === 0 && <p className="text-sm text-muted-foreground py-2">אין קטגוריות עדיין</p>}
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-2 gap-2">
              <span className="text-sm flex-1">{cat.name}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={cat.is_vat_recognized}
                  onCheckedChange={() => handleToggleVat(cat)}
                  disabled={isPending}
                />
                מוכר מע&quot;מ
              </label>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={isPending}
                className="text-xs text-destructive hover:underline disabled:opacity-50"
              >
                מחק
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); handleAdd() }} className="flex gap-2 pt-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="שם קטגוריה חדשה"
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !newName.trim()}>הוסף</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

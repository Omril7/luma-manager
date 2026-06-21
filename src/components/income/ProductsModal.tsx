'use client'

import { useRef, useState, useTransition } from 'react'
import { createProduct, deleteProduct } from '@/app/(dashboard)/income/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Product = { id: string; name: string; description: string | null; default_work_hours: number }
type Props = { products: Product[]; onClose: () => void }

export default function ProductsModal({ products: initial, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workHours, setWorkHours] = useState(0)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd() {
    if (!name.trim()) return
    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('description', description.trim())
    formData.set('default_work_hours', String(workHours))
    startTransition(async () => {
      const result = await createProduct(null, formData)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else {
        setProducts(prev => [...prev, {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim() || null,
          default_work_hours: workHours,
        }])
        setName(''); setDescription(''); setWorkHours(0); setError('')
        toast.success('מוצר נוסף')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else { setProducts(prev => prev.filter(p => p.id !== id)); toast.success('מוצר נמחק') }
    })
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול מוצרים</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {products.length === 0 && <p className="text-sm text-muted-foreground py-2">אין מוצרים עדיין</p>}
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.default_work_hours > 0 ? `${p.default_work_hours} ש׳` : '—'}
                  {p.description ? ` · ${p.description}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className="text-xs text-destructive hover:underline disabled:opacity-50 shrink-0"
              >
                מחק
              </button>
            </div>
          ))}
        </div>

        <form ref={formRef} onSubmit={e => { e.preventDefault(); handleAdd() }} className="space-y-2 pt-2">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="שם מוצר *" />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="תיאור (אופציונלי)"
            />
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={workHours}
                onChange={e => setWorkHours(Number(e.target.value))}
                placeholder="שעות עבודה"
                className="pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">ש׳</span>
            </div>
          </div>
          <Button type="submit" disabled={isPending || !name.trim()} className="w-full">הוסף</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

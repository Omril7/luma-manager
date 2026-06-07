'use client'

import { useRef, useState, useTransition } from 'react'
import { createProduct, deleteProduct } from '@/app/(dashboard)/income/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Product = { id: string; name: string; description: string | null }
type Props = { products: Product[]; onClose: () => void }

export default function ProductsModal({ products: initial, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd() {
    if (!name.trim()) return
    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('description', description.trim())
    startTransition(async () => {
      const result = await createProduct(null, formData)
      if (result.error) { setError(result.error); toast.error(result.error) }
      else {
        setProducts(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), description: description.trim() || null }])
        setName(''); setDescription(''); setError('')
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
                {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
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
          <div className="flex gap-2">
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="תיאור (אופציונלי)"
              className="flex-1"
            />
            <Button type="submit" disabled={isPending || !name.trim()}>הוסף</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

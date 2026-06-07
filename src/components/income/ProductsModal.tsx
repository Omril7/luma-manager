'use client'

import { useRef, useState, useTransition } from 'react'
import { createProduct, deleteProduct } from '@/app/(dashboard)/income/actions'

type Product = {
  id: string
  name: string
  description: string | null
}

type Props = {
  products: Product[]
  onClose: () => void
}

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
      if (result.error) {
        setError(result.error)
      } else {
        setProducts(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), description: description.trim() || null }])
        setName('')
        setDescription('')
        setError('')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.error) setError(result.error)
      else setProducts(prev => prev.filter(p => p.id !== id))
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">ניהול מוצרים</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="divide-y divide-gray-100 mb-4 max-h-64 overflow-y-auto">
          {products.length === 0 && <p className="text-sm text-gray-400 py-2">אין מוצרים עדיין</p>}
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className="text-red-400 hover:text-red-600 text-sm px-1 shrink-0"
              >
                מחק
              </button>
            </div>
          ))}
        </div>

        <form ref={formRef} onSubmit={e => { e.preventDefault(); handleAdd() }} className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם מוצר *"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="תיאור (אופציונלי)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              הוסף
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

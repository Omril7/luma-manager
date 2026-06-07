'use client'

import { useRef, useState, useTransition } from 'react'
import { createCategory, updateCategoryVat, deleteCategory } from '@/app/(dashboard)/expenses/actions'

type Category = {
  id: string
  name: string
  is_vat_recognized: boolean
}

type Props = {
  categories: Category[]
  onClose: () => void
}

export default function CategoryModal({ categories, onClose }: Props) {
  const [cats, setCats] = useState<Category[]>(categories)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd() {
    if (!newName.trim()) return
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('is_vat_recognized', 'false')
    startTransition(async () => {
      const result = await createCategory(null, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setCats(prev => [...prev, { id: crypto.randomUUID(), name: newName.trim(), is_vat_recognized: false }])
        setNewName('')
        setError('')
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
      if (result.error) {
        setError(result.error)
      } else {
        setCats(prev => prev.filter(c => c.id !== catId))
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">ניהול קטגוריות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="divide-y divide-gray-100 mb-4 max-h-64 overflow-y-auto">
          {cats.length === 0 && <p className="text-sm text-gray-400 py-2">אין קטגוריות עדיין</p>}
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-2 gap-2">
              <span className="text-sm flex-1">{cat.name}</span>
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.is_vat_recognized}
                  onChange={() => handleToggleVat(cat)}
                  disabled={isPending}
                  className="accent-blue-600"
                />
                מוכר מע&quot;מ
              </label>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={isPending}
                className="text-red-400 hover:text-red-600 text-sm px-1"
                title="מחק קטגוריה"
              >
                מחק
              </button>
            </div>
          ))}
        </div>

        <form ref={formRef} onSubmit={e => { e.preventDefault(); handleAdd() }} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="שם קטגוריה חדשה"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            הוסף
          </button>
        </form>
      </div>
    </div>
  )
}

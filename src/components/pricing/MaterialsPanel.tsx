'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  createMaterial, createMaterialCategory,
  updateMaterialCategory, deleteMaterial, deleteMaterialCategory,
  type CreateMaterialInput,
} from '@/app/(dashboard)/pricing/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type DataTableColumn, type DataTablePagination } from '@/components/ui/data-table'
import { Plus, Trash2, Pencil, Check, X, Search, Settings2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

export interface MaterialCategory { id: string; name: string }

export interface Material {
  id: string
  name: string
  unit: string
  price: number
  category_id: string
  material_categories: { name: string } | null
}

interface Props {
  categories: MaterialCategory[]
  materials: Material[]
}

const PAGE_SIZE = 10

function ils(n: number) {
  return n.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
}

export default function MaterialsPanel({ categories, materials }: Props) {
  const [selectedCat, setSelectedCat]               = useState<string | null>(null)
  const [search, setSearch]                         = useState('')
  const [page, setPage]                             = useState(0)
  const [showAddMaterial, setShowAddMaterial]       = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [isPending, startTransition]                = useTransition()

  const [matName, setMatName]   = useState('')
  const [matUnit, setMatUnit]   = useState('')
  const [matPrice, setMatPrice] = useState('')
  const [matCatId, setMatCatId] = useState('')
  const [matError, setMatError] = useState('')

  const [editingCatId, setEditingCatId]     = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [newCatName, setNewCatName]         = useState('')
  const [catError, setCatError]             = useState('')

  useEffect(() => { setPage(0) }, [selectedCat, search])

  const filtered = materials
    .filter(m => !selectedCat || m.category_id === selectedCat)
    .filter(m => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        (m.material_categories?.name ?? '').toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q)
      )
    })

  const pagination: DataTablePagination = {
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length,
    onPageChange: setPage,
  }

  const columns: DataTableColumn<Material>[] = [
    {
      key: 'name',
      header: 'שם',
      cell: m => <span className="font-medium">{m.name}</span>,
      sortValue: m => m.name,
    },
    {
      key: 'unit',
      header: 'יחידה',
      className: 'text-muted-foreground',
      cell: m => m.unit,
    },
    {
      key: 'price',
      header: 'מחיר',
      className: 'tabular-nums',
      cell: m => ils(m.price),
      sortValue: m => m.price,
    },
    {
      key: 'category',
      header: 'קטגוריה',
      className: 'text-muted-foreground',
      cell: m => m.material_categories?.name ?? '—',
      sortValue: m => m.material_categories?.name ?? '',
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-10',
      mobileHidden: true,
      cell: m => (
        <Button
          variant="ghost" size="sm"
          onClick={() => handleDeleteMaterial(m.id)}
          disabled={isPending}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  function openAddMaterial() {
    setMatName(''); setMatUnit(''); setMatPrice('')
    setMatCatId(selectedCat ?? categories[0]?.id ?? '')
    setMatError('')
    setShowAddMaterial(true)
  }

  function handleAddMaterial() {
    const price = parseFloat(matPrice)
    if (!matName.trim() || !matUnit.trim() || !matCatId || isNaN(price) || price <= 0) {
      setMatError('יש למלא את כל השדות'); return
    }
    const input: CreateMaterialInput = { name: matName.trim(), unit: matUnit.trim(), price, category_id: matCatId }
    startTransition(async () => {
      const res = await createMaterial(input)
      if (res && 'error' in res && res.error) { setMatError(res.error); toast.error(res.error) }
      else { toast.success('חומר גלם נוסף'); setShowAddMaterial(false) }
    })
  }

  function handleDeleteMaterial(id: string) {
    if (!confirm('למחוק חומר גלם זה?')) return
    startTransition(async () => {
      const res = await deleteMaterial(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else toast.success('חומר גלם נמחק')
    })
  }

  function startEdit(cat: MaterialCategory) {
    setEditingCatId(cat.id); setEditingCatName(cat.name); setCatError('')
  }

  function handleSaveEdit() {
    if (!editingCatName.trim()) { setCatError('שם קטגוריה נדרש'); return }
    startTransition(async () => {
      const res = await updateMaterialCategory(editingCatId!, editingCatName.trim())
      if (res && 'error' in res && res.error) { setCatError(res.error); toast.error(res.error) }
      else { toast.success('קטגוריה עודכנה'); setEditingCatId(null) }
    })
  }

  function handleAddCategory() {
    if (!newCatName.trim()) { setCatError('שם קטגוריה נדרש'); return }
    startTransition(async () => {
      const res = await createMaterialCategory(newCatName.trim())
      if (res && 'error' in res && res.error) { setCatError(res.error); toast.error(res.error) }
      else { toast.success('קטגוריה נוספה'); setNewCatName(''); setCatError('') }
    })
  }

  function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`למחוק את הקטגוריה "${name}"? כל חומרי הגלם שבה יימחקו.`)) return
    startTransition(async () => {
      const res = await deleteMaterialCategory(id)
      if (res && 'error' in res && res.error) toast.error(res.error)
      else { toast.success('קטגוריה נמחקה'); if (selectedCat === id) setSelectedCat(null) }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-foreground">חומרי גלם</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingCatId(null); setNewCatName(''); setCatError(''); setShowManageCategories(true) }}>
            <Settings2 className="h-3.5 w-3.5 ml-1" />
            ניהול קטגוריות
          </Button>
          <Button size="sm" onClick={openAddMaterial} disabled={categories.length === 0}>
            <Plus className="h-3.5 w-3.5 ml-1" />
            חומר גלם
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם חומר, קטגוריה או יחידה..."
          className="pr-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" dir="rtl">
          <button
            onClick={() => setSelectedCat(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCat === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
          >
            הכל
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCat === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border border-border px-4 py-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">הוסף קטגוריה כדי להתחיל</p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={m => m.id}
            pagination={pagination}
            emptyMessage={selectedCat || search ? 'לא נמצאו תוצאות' : 'אין חומרי גלם עדיין'}
          />
        )}
      </div>

      {/* Add Material Dialog */}
      <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>הוסף חומר גלם</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>שם חומר גלם</Label>
              <Input value={matName} onChange={e => setMatName(e.target.value)} placeholder="למשל: בד כותנה" autoFocus />
            </div>
            <div className="space-y-1">
              <Label>יחידה</Label>
              <Input value={matUnit} onChange={e => setMatUnit(e.target.value)} placeholder="למשל: מטר, ק״ג, יחידה" />
            </div>
            <div className="space-y-1">
              <Label>מחיר ליחידה</Label>
              <div className="relative">
                <Input type="number" min={0} step="0.01" value={matPrice} onChange={e => setMatPrice(e.target.value)} placeholder="0.00" className="pl-8" />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₪</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label>קטגוריה</Label>
              <Select value={matCatId} onValueChange={setMatCatId}>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {matError && <p className="text-red-500 text-sm">{matError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMaterial(false)}>ביטול</Button>
            <Button onClick={handleAddMaterial} disabled={isPending}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={showManageCategories} onOpenChange={v => { if (!v) { setEditingCatId(null); setCatError('') } setShowManageCategories(v) }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>ניהול קטגוריות</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">אין קטגוריות עדיין</p>}
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                {editingCatId === cat.id ? (
                  <>
                    <Input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="flex-1 h-8 text-sm" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingCatId(null) }} />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" onClick={handleSaveEdit} disabled={isPending}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setEditingCatId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteCategory(cat.id, cat.name)} disabled={isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
          {catError && <p className="text-red-500 text-sm">{catError}</p>}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="שם קטגוריה חדשה..." className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
            <Button size="sm" onClick={handleAddCategory} disabled={isPending || !newCatName.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

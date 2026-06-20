'use client'

import PricingHistoryPanel, { type PricingRow } from '@/components/pricing/PricingHistoryPanel'
import MaterialsPanel, { type MaterialCategory, type Material } from '@/components/pricing/MaterialsPanel'

interface Props {
  pricings: PricingRow[]
  defaultHourlyRate: number
  materialCategories: MaterialCategory[]
  materials: Material[]
}

export default function PricingClient({ pricings, defaultHourlyRate, materialCategories, materials }: Props) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">תמחור מוצרים</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <PricingHistoryPanel
          pricings={pricings}
          defaultHourlyRate={defaultHourlyRate}
          materials={materials}
        />
        <MaterialsPanel categories={materialCategories} materials={materials} />
      </div>
    </div>
  )
}

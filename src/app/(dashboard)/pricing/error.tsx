'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <p className="text-gray-600">אירעה שגיאה בטעינת הדף</p>
      <Button onClick={reset}>נסה שוב</Button>
    </div>
  )
}

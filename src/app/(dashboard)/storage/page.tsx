import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStorageStats } from './actions'
import StorageClient from '@/components/storage/StorageClient'

export default async function StoragePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getStorageStats()

  return <StorageClient stats={stats} />
}

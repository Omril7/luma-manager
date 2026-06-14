import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStorageStats } from './actions'
import { getUsage } from '@/lib/cloudinary'
import StorageClient from '@/components/storage/StorageClient'

export default async function StoragePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, cloudinaryUsage] = await Promise.all([getStorageStats(), getUsage()])

  return <StorageClient stats={stats} cloudinaryUsage={cloudinaryUsage} />
}

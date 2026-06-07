import { NextRequest, NextResponse } from 'next/server'

// Stub — implemented in Phase 5
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ error: 'לא מומש עדיין' }, { status: 501 })
}

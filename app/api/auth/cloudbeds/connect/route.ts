import { NextResponse } from 'next/server'
import { getOAuthUrl } from '@/lib/cloudbeds'

export async function GET() {
  const url = getOAuthUrl()
  return NextResponse.redirect(url)
}

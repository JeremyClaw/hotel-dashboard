import { NextResponse } from 'next/server'

export async function GET() {
  const token   = process.env.TELEGRAM_BOT_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set in environment variables' }, { status: 500 })
  }
  if (!siteUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL not set in environment variables' }, { status: 500 })
  }

  const webhookUrl   = `${siteUrl}/api/telegram/webhook`
  const secretToken  = process.env.TELEGRAM_WEBHOOK_SECRET

  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  }
  if (secretToken) body.secret_token = secretToken

  const res  = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  const infoRes  = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  const infoData = await infoRes.json()

  return NextResponse.json({
    webhookUrl,
    setWebhookResult: data,
    webhookInfo: infoData.result,
  })
}

import crypto from 'node:crypto'
import OpenAI from 'openai'
import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

function cleanDomain(value: string) {
  return value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/[^a-z0-9.-]/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '')
}

function isDomain(value: string) {
  return value.length <= 253 && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value)
}

const vercelToken = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_ACCESS_TOKEN_2

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === 'create-checkout') {
      const domain = typeof body.domain === 'string' ? body.domain.toLowerCase() : ''
      if (!isDomain(domain)) return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 })
      if (!vercelToken) return NextResponse.json({ error: 'VERCEL_ACCESS_TOKEN is not configured.' }, { status: 500 })
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 500 })

      const priceResponse = await fetch(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`, { headers: { Authorization: `Bearer ${vercelToken}` }, cache: 'no-store' })
      const priceData = await priceResponse.json().catch(() => ({}))
      const numericPrice = Number(priceData.price ?? priceData.amount ?? priceData.purchasePrice)
      if (!priceResponse.ok || !Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 999) return NextResponse.json({ error: 'Unable to verify the current domain price.' }, { status: 400 })

      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
      const order = await razorpay.orders.create({ amount: Math.round(numericPrice * 100), currency: 'INR', receipt: `domain-${Date.now()}`, notes: { domain } })
      return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID })
    }

    if (body.action === 'verify-payment') {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, domain } = body
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || typeof domain !== 'string') return NextResponse.json({ error: 'Incomplete payment details.' }, { status: 400 })
      if (!/^[a-z0-9-]+\\.com$/.test(domain) || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
      if (expectedSignature !== razorpaySignature) return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
      if (!vercelToken) return NextResponse.json({ error: 'VERCEL_ACCESS_TOKEN is not configured.' }, { status: 500 })

      const registrationResponse = await fetch('https://api.vercel.com/v1/registrar/domains/register', { method: 'POST', headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, years: 1 }) })
      const registration = await registrationResponse.json().catch(() => ({}))
      if (!registrationResponse.ok) return NextResponse.json({ error: registration.error?.message || registration.message || 'Payment succeeded, but domain registration failed.' }, { status: 502 })
      return NextResponse.json({ success: true, domain, registration })
    }

    const promptValue = typeof body.prompt === 'string' ? body.prompt : body.message
    const prompt = typeof promptValue === 'string' ? promptValue.trim().slice(0, 500) : ''
    if (!prompt) return NextResponse.json({ error: 'Please describe your idea.' }, { status: 400 })
    const openAIKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_2
    if (!openAIKey || openAIKey === 'process.env.OPENAI_API_KEY' || openAIKey === '********') {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured. Add your OpenAI API key in the project Vars settings.' }, { status: 500 })
    }
    if (!vercelToken) return NextResponse.json({ error: 'VERCEL_ACCESS_TOKEN is not configured.' }, { status: 500 })

    const openai = new OpenAI({ apiKey: openAIKey })
    const completion = await openai.chat.completions.create({
      model: openAIKey ? 'gpt-4o-mini' : 'openai/gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: 'You generate brandable domain ideas across a variety of useful extensions. Return only a JSON array of 12 short domain strings, without markdown. Domains should be lowercase, easy to pronounce, use valid domain syntax, and reflect the user brief. Include a mix of relevant extensions such as .com, .io, .co, .app, .ai, .dev, or .xyz when appropriate.' },
        { role: 'user', content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message.content || '[]'
    const suggestions = JSON.parse(raw.replace(/```json|```/g, '').trim()) as unknown[]
    const domains = [...new Set(suggestions.map((value) => cleanDomain(String(value))).filter(isDomain))].slice(0, 12)
    if (!domains.length) return NextResponse.json({ error: 'No valid domain ideas were generated. Try a more specific prompt.' }, { status: 422 })

    const headers = { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' }
    const availabilityResponse = await fetch('https://api.vercel.com/v1/registrar/domains/availability', { method: 'POST', headers, body: JSON.stringify({ domains }) })
    if (!availabilityResponse.ok) throw new Error(`Vercel availability request failed (${availabilityResponse.status}).`)
    const availability = await availabilityResponse.json()
    const availabilityItems = Array.isArray(availability) ? availability : availability.domains || availability.results || []

    const results = await Promise.all(domains.map(async (domain) => {
      const item = availabilityItems.find((candidate: { domain?: string; name?: string }) => (candidate.domain || candidate.name) === domain)
      const available = Boolean(item?.available ?? item?.status === 'available')
      if (!available) return { domain, available: false }
      const priceResponse = await fetch(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`, { headers })
      const priceData = priceResponse.ok ? await priceResponse.json() : {}
      const price = Number(priceData.price ?? priceData.amount ?? priceData.purchasePrice)
      return { domain, available: true, price: Number.isFinite(price) ? price : undefined, currency: priceData.currency || 'USD' }
    }))

    const reply = results
      .map((result) => {
        if (!result.available) return `- **${result.domain}** — unavailable`

        const price = Number.isFinite(result.price)
          ? ` — ${result.currency} ${result.price?.toFixed(2)}/year`
          : ''

        return `- **${result.domain}** — available${price}`
      })
      .join('\n')

    return NextResponse.json({
      ok: true,
      type: 'chat',
      reply: `Here are domain ideas for your brief:\n\n${reply}`,
      results,
    })
  } catch (error) {
    console.error('[domains] request failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to search domains.' }, { status: 500 })
  }
}

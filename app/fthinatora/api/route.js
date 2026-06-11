import { NextResponse } from 'next/server'

const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const DEFAULT_TIMEOUT = 15000

if (!OPENAI_KEY) {
  console.warn('[fthinatora/api] Missing OPENAI_API_KEY')
}

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

// ─── OpenAI helper ────────────────────────────────────────────────────────────

async function askOpenAI(systemPrompt, userPrompt, maxTokens = 800) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    return JSON.parse(text)
  } finally {
    clearTimeout(timer)
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function handleSearch(searchParams) {
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ products: [] })

  const data = await askOpenAI(
    `Είσαι βοηθός σύγκρισης τιμών ελληνικών σούπερ μάρκετ. 
     Επίστρεψε ΜΟΝΟ έγκυρο JSON χωρίς markdown.`,
    `Βρες προϊόντα που ταιριάζουν με την αναζήτηση: "${q}"
     Επίστρεψε JSON με αυτή τη δομή:
     {
       "products": [
         { "id": "unique_id", "name": "Πλήρες όνομα προϊόντος", "category": "Κατηγορία", "brand": "Brand" }
       ]
     }
     Μέγιστο 8 προϊόντα. Τα ονόματα στα ελληνικά.`,
    400
  )

  return NextResponse.json({ products: data.products ?? [] })
}

// ─── Prices ───────────────────────────────────────────────────────────────────

async function handlePrices(searchParams) {
  const productId   = searchParams.get('productId')
  const productName = searchParams.get('productName') || productId

  if (!productId) return errorResponse('Λείπει το productId', 400)

  const data = await askOpenAI(
    `Είσαι ειδικός στις τιμές ελληνικών σούπερ μάρκετ.
     Δίνεις ρεαλιστικές ενδεικτικές τιμές βάσει γνώσης σου.
     Επίστρεψε ΜΟΝΟ έγκυρο JSON χωρίς markdown.`,
    `Δώσε ενδεικτικές τιμές για το προϊόν: "${productName}"
     στα παρακάτω ελληνικά σούπερ μάρκετ: Σκλαβενίτης, Lidl, ΑΒ Βασιλόπουλος, My Market, Μασούτης, Market In, Γαλαξίας.
     
     Επίστρεψε JSON:
     {
       "prices": [
         {
           "supermarketId": "sklavenitis",
           "supermarketName": "Σκλαβενίτης",
           "currentPrice": 2.49,
           "oldPrice": null,
           "isEuropean": false
         }
       ]
     }
     
     Κανόνες:
     - Οι τιμές να είναι ρεαλιστικές για την Ελλάδα
     - Κάποιες φορές βάλε oldPrice (παλιά τιμή) για να δείξεις έκπτωση
     - Ταξινόμησε από φθηνότερο προς ακριβότερο
     - isEuropean: false για όλα`,
    600
  )

  return NextResponse.json({ prices: data.prices ?? [] })
}

// ─── Offers ───────────────────────────────────────────────────────────────────

async function handleOffers(searchParams) {
  const data = await askOpenAI(
    `Είσαι ειδικός προσφορών ελληνικών σούπερ μάρκετ.
     Επίστρεψε ΜΟΝΟ έγκυρο JSON χωρίς markdown.`,
    `Δώσε 3 τυπικές προσφορές που βρίσκονται αυτή την εποχή στα ελληνικά σούπερ μάρκετ.
     
     Επίστρεψε JSON:
     {
       "offers": [
         {
           "id": "offer_1",
           "name": "Όνομα προϊόντος",
           "supermarketId": "sklavenitis",
           "supermarketName": "Σκλαβενίτης",
           "currentPrice": 4.99,
           "oldPrice": 6.90
         }
       ]
     }
     
     Χρησιμοποίησε διαφορετικά σούπερ μάρκετ για κάθε προσφορά.
     Supermarket IDs: sklavenitis, lidl, ab, mymarket, masoutis, marketin, galaxias`,
    400
  )

  return NextResponse.json({ offers: data.offers ?? [] })
}

// ─── Basket ───────────────────────────────────────────────────────────────────

async function handleBasket(req) {
  let body
  try { body = await req.json() } catch { return errorResponse('Μη έγκυρο JSON', 400) }

  const { items } = body
  if (!Array.isArray(items) || items.length === 0) return errorResponse('Λείπουν τα items', 400)

  const itemsList = items.map(i => `- ${i.name} x${i.quantity || 1}`).join('\n')

  const data = await askOpenAI(
    `Είσαι ειδικός σύγκρισης τιμών ελληνικών σούπερ μάρκετ.
     Επίστρεψε ΜΟΝΟ έγκυρο JSON χωρίς markdown.`,
    `Υπολόγισε το συνολικό κόστος αυτών των προϊόντων σε κάθε ελληνικό σούπερ μάρκετ:
     
     ${itemsList}
     
     Σούπερ μάρκετ: Σκλαβενίτης, Lidl, ΑΒ Βασιλόπουλος, My Market, Μασούτης, Market In, Γαλαξίας
     
     Επίστρεψε JSON:
     {
       "totals": {
         "sklavenitis": { "name": "Σκλαβενίτης", "total": 15.40 },
         "lidl":        { "name": "Lidl",         "total": 13.20 },
         "ab":          { "name": "ΑΒ Βασιλόπουλος", "total": 14.80 },
         "mymarket":    { "name": "My Market",    "total": 15.10 },
         "masoutis":    { "name": "Μασούτης",     "total": 13.90 },
         "marketin":    { "name": "Market In",    "total": 14.50 },
         "galaxias":    { "name": "Γαλαξίας",     "total": 15.80 }
       }
     }
     
     Οι τιμές να είναι ρεαλιστικές. Ταξινόμησε εσωτερικά από φθηνότερο.`,
    500
  )

  return NextResponse.json({ totals: data.totals ?? {} })
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function dispatch(req) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')

  try {
    if (action === 'search')  return await handleSearch(searchParams)
    if (action === 'prices')  return await handlePrices(searchParams)
    if (action === 'offers')  return await handleOffers(searchParams)
    if (action === 'basket')  return await handleBasket(req)
    if (action === 'status')  return NextResponse.json({ api: 'up', powered_by: 'openai' })
    return errorResponse('Άγνωστη action', 400)
  } catch (err) {
    console.error('[fthinatora/api]', err.message)
    return errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'Σφάλμα επικοινωνίας με την υπηρεσία'
        : err.message
    )
  }
}

export const GET  = dispatch
export const POST = dispatch
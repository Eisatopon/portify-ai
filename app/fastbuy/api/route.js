import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Είσαι ένας έμπειρος και ειλικρινής shopping advisor για την ελληνική αγορά (2025-2026).

Πάντα προτείνεις ΑΚΡΙΒΩΣ 3 επιλογές με tiers: "best", "value", "premium".
- "best"    → η καλύτερη συνολική επιλογή
- "value"   → η καλύτερη σχέση ποιότητας/τιμής
- "premium" → η κορυφαία επιλογή αν αξίζει το έξτρα κόστος

Κανόνες:
- Χρησιμοποίησε ΜΟΝΟ πραγματικά διαθέσιμα προϊόντα/μάρκες
- Τιμές ρεαλιστικές για Ελλάδα — δώσε εύρος (π.χ. 699-749) αν δεν είσαι σίγουρος
- Πάντα αναφέρεις trade-offs στα cons
- Για το link: δώσε ΜΟΝΟ το searchQuery (π.χ. "MacBook Air M4") — ΟΧΙ πλήρες URL
- ΜΗΝ εφευρίσκεις ελληνικά eshops ή URLs
- Απαντάς ΜΟΝΟ με έγκυρο JSON χωρίς κανένα άλλο κείμενο:
{
  "confidence": "high",
  "results": [
    {
      "tier": "best",
      "name": "Πλήρες όνομα",
      "brand": "Brand",
      "price": 299,
      "reason": "Γιατί είναι η καλύτερη επιλογή...",
      "pros": ["πλεονέκτημα 1", "πλεονέκτημα 2", "πλεονέκτημα 3"],
      "cons": ["μειονέκτημα 1", "μειονέκτημα 2"],
      "useCases": ["για ποιον είναι ιδανικό"],
      "searchQuery": "Brand Name Model"
    }
  ]
}`;

export async function POST(req) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Η υπηρεσία δεν είναι διαθέσιμη.' }, { status: 503 });
  }

  try {
    const { query, budget } = await req.json();

    if (!query?.trim() || query.trim().length < 3) {
      return NextResponse.json({ error: 'Γράψε τι ψάχνεις.' }, { status: 400 });
    }

    const userPrompt = `Ερώτημα: "${query.trim()}"${budget ? `\nΠροϋπολογισμός: ~${budget}€` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[fastbuy] OpenAI error:', { status: response.status, error: errData.error });
      return NextResponse.json({ error: 'Πρόβλημα με την υπηρεσία. Δοκίμασε ξανά.' }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      console.error('[fastbuy] Empty response from OpenAI');
      return NextResponse.json({ error: 'Άδεια απάντηση. Δοκίμασε ξανά.' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('[fastbuy] JSON parse error:', raw);
      return NextResponse.json({ error: 'Μη έγκυρη απάντηση. Δοκίμασε ξανά.' }, { status: 502 });
    }

    if (!Array.isArray(parsed.results) || parsed.results.length !== 3) {
      console.error('[fastbuy] Invalid results length:', parsed.results?.length);
      return NextResponse.json({ error: 'Πρόβλημα με την υπηρεσία. Δοκίμασε ξανά.' }, { status: 502 });
    }

    const tiers = new Set(parsed.results.map(r => r.tier));
    if (!tiers.has('best') || !tiers.has('value') || !tiers.has('premium')) {
      console.error('[fastbuy] Missing tiers:', [...tiers]);
      return NextResponse.json({ error: 'Πρόβλημα με την υπηρεσία. Δοκίμασε ξανά.' }, { status: 502 });
    }

    // Sanitize + build Skroutz links
    const results = parsed.results.slice(0, 3).map(item => ({
      tier:        item.tier,
      name:        item.name?.trim(),
      brand:       item.brand?.trim(),
      price:       Number(item.price),
      reason:      item.reason,
      pros:        Array.isArray(item.pros)     ? item.pros.slice(0, 4)     : [],
      cons:        Array.isArray(item.cons)     ? item.cons.slice(0, 3)     : [],
      useCases:    Array.isArray(item.useCases) ? item.useCases             : [],
      confidence:  parsed.confidence || 'medium',
      link:        item.searchQuery
        ? `https://www.skroutz.gr/search?keyphrase=${encodeURIComponent(item.searchQuery)}`
        : null,
    }));

    return NextResponse.json({ success: true, results });

  } catch (err) {
    console.error('[fastbuy]', { message: err.message, stack: err.stack });
    return NextResponse.json({ error: 'Κάτι πήγε στραβά. Δοκίμασε σε λίγο.' }, { status: 500 });
  }
}
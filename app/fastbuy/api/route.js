import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Είσαι ένας έμπειρος shopping advisor για την ελληνική αγορά (2025-2026).

ΥΠΟΧΡΕΩΤΙΚΟ: Επιστρέφεις ΠΑΝΤΑ ΑΚΡΙΒΩΣ 5 προϊόντα — ούτε λιγότερα, ούτε περισσότερα.
Κάθε προϊόν έχει ΔΙΑΦΟΡΕΤΙΚΟ tier από αυτή τη λίστα:
1. "budget"  → η πιο οικονομική επιλογή που αξίζει τα λεφτά της
2. "best"    → η καλύτερη συνολική επιλογή
3. "value"   → η καλύτερη σχέση ποιότητας/τιμής
4. "premium" → η κορυφαία επιλογή χωρίς συμβιβασμούς
5. "popular" → η πιο δημοφιλής επιλογή στην αγορά

Κανόνες:
- Χρησιμοποίησε ΜΟΝΟ πραγματικά προϊόντα/μάρκες
- Τιμές ρεαλιστικές για Ελλάδα
- Πάντα αναφέρεις trade-offs στα cons
- searchQuery: μόνο το όνομα του προϊόντος (π.χ. "Bosch WAN28281GR")
- Απαντάς ΜΟΝΟ με έγκυρο JSON:
{
  "results": [
    { "tier": "budget",  "name": "...", "brand": "...", "price": 299, "reason": "...", "pros": ["..."], "cons": ["..."], "useCases": ["..."], "searchQuery": "..." },
    { "tier": "best",    "name": "...", "brand": "...", "price": 499, "reason": "...", "pros": ["..."], "cons": ["..."], "useCases": ["..."], "searchQuery": "..." },
    { "tier": "value",   "name": "...", "brand": "...", "price": 399, "reason": "...", "pros": ["..."], "cons": ["..."], "useCases": ["..."], "searchQuery": "..." },
    { "tier": "premium", "name": "...", "brand": "...", "price": 799, "reason": "...", "pros": ["..."], "cons": ["..."], "useCases": ["..."], "searchQuery": "..." },
    { "tier": "popular", "name": "...", "brand": "...", "price": 449, "reason": "...", "pros": ["..."], "cons": ["..."], "useCases": ["..."], "searchQuery": "..." }
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
        max_tokens: 1600,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(25000),
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

    if (!Array.isArray(parsed.results) || parsed.results.length < 3) {
      console.error('[fastbuy] Invalid results length:', parsed.results?.length);
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
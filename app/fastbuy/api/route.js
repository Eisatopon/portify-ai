import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT_A = `Είσαι shopping advisor για την ελληνική αγορά (2025-2026).
Επιστρέφεις ΑΚΡΙΒΩΣ 3 προϊόντα με tiers: "budget", "best", "value".
- "budget"  → η πιο οικονομική επιλογή
- "best"    → η καλύτερη συνολική επιλογή
- "value"   → η καλύτερη σχέση ποιότητας/τιμής
Απαντάς ΜΟΝΟ με JSON: { "results": [ { "tier":"budget", "name":"...", "brand":"...", "price":299, "reason":"...", "pros":["..."], "cons":["..."], "useCases":["..."], "searchQuery":"..." }, ... ] }`;

const SYSTEM_PROMPT_B = `Είσαι shopping advisor για την ελληνική αγορά (2025-2026).
Επιστρέφεις ΑΚΡΙΒΩΣ 2 προϊόντα με tiers: "premium", "popular".
- "premium" → η κορυφαία επιλογή χωρίς συμβιβασμούς
- "popular" → η πιο δημοφιλής επιλογή στην αγορά
Απαντάς ΜΟΝΟ με JSON: { "results": [ { "tier":"premium", "name":"...", "brand":"...", "price":799, "reason":"...", "pros":["..."], "cons":["..."], "useCases":["..."], "searchQuery":"..." }, { "tier":"popular", "name":"...", "brand":"...", "price":449, "reason":"...", "pros":["..."], "cons":["..."], "useCases":["..."], "searchQuery":"..." } ] }`;

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

    const callOpenAI = async (systemPrompt, maxTokens) => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
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
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) throw new Error('Empty response');
      return JSON.parse(raw);
    };

    // Παράλληλα calls
    const [parsed1, parsed2] = await Promise.all([
      callOpenAI(SYSTEM_PROMPT_A, 1200),
      callOpenAI(SYSTEM_PROMPT_B, 800),
    ]);

    const results = [
      ...(Array.isArray(parsed1.results) ? parsed1.results : []),
      ...(Array.isArray(parsed2.results) ? parsed2.results : []),
    ];

    if (results.length < 3) {
      return NextResponse.json({ error: 'Πρόβλημα με την υπηρεσία. Δοκίμασε ξανά.' }, { status: 502 });
    }

    const sanitized = results.map(item => ({
      tier:        item.tier,
      name:        item.name?.trim(),
      brand:       item.brand?.trim(),
      price:       Number(item.price),
      reason:      item.reason,
      pros:        Array.isArray(item.pros)     ? item.pros.slice(0,4)  : [],
      cons:        Array.isArray(item.cons)     ? item.cons.slice(0,3)  : [],
      useCases:    Array.isArray(item.useCases) ? item.useCases         : [],
      link:        item.searchQuery
        ? `https://www.skroutz.gr/search?keyphrase=${encodeURIComponent(item.searchQuery)}`
        : null,
    }));

    return NextResponse.json({ success: true, results: sanitized });

  } catch (err) {
    console.error('[fastbuy]', { message: err.message, stack: err.stack });
    return NextResponse.json({ error: 'Κάτι πήγε στραβά. Δοκίμασε σε λίγο.' }, { status: 500 });
  }
}
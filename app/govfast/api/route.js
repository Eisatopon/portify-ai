import { NextResponse } from 'next/server';
import { SERVICES } from '@/src/data/govfastServices';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Είσαι βοηθός του GovFast. Απαντάς ΠΑΝΤΑ με έγκυρο JSON και ΤΙΠΟΤΑ ΑΛΛΟ.

ΥΠΟΧΡΕΩΤΙΚΟ FORMAT όταν βρεις σχετική διαδικασία:
{
  "found": true,
  "intro": "1 πρόταση εισαγωγής.",
  "goal": "1 πρόταση που περιγράφει τον στόχο.",
  "steps": ["Βήμα 1", "Βήμα 2", "Βήμα 3"],
  "requiredServices": ["id1", "id2"],
  "warnings": ["Προειδοποίηση 1"],
  "tip": "1 πρακτικό tip."
}

ΚΑΝΟΝΕΣ:
- Τα steps ΕΙΝΑΙ ΥΠΟΧΡΕΩΤΙΚΑ. Βάλε 3-5 βήματα ΠΑΝΤΑ.
- Τα warnings ΕΙΝΑΙ ΥΠΟΧΡΕΩΤΙΚΑ. Βάλε τουλάχιστον 1 ΠΑΝΤΑ.
- Επέλεξε ΜΟΝΟ IDs από τη λίστα υπηρεσιών που σου δίνω.
- ΜΗΝ προσθέτεις κείμενο εκτός JSON.

Αν δεν υπάρχει σχετική υπηρεσία:
{ "found": false, "message": "Σύντομη εξήγηση." }`;

export async function POST(req) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Λείπει το OPENAI_API_KEY.' }, { status: 500 });
  }

  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Γράψε την ερώτησή σου.' }, { status: 400 });
    }

    const servicesList = SERVICES.map(s =>
      `ID: ${s.id} | ${s.name} | ${s.desc} | Keywords: ${s.keywords?.join(', ')}`
    ).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Ερώτηση: "${query}"\n\nΔιαθέσιμες υπηρεσίες:\n${servicesList}` }
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Κενή απάντηση.');

    const parsed = JSON.parse(raw);

    if (!parsed.found) {
      return NextResponse.json({ found: false, message: parsed.message || 'Δεν βρέθηκε σχετική διαδικασία.' });
    }

    const services = (parsed.requiredServices || [])
      .map(id => SERVICES.find(s => s.id === id))
      .filter(Boolean);

    return NextResponse.json({
      found: true,
      intro: parsed.intro || '',
      goal: parsed.goal || '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      tip: parsed.tip || '',
      services,
    });

  } catch (err) {
    console.error('[govfast/api]', err.message);
    return NextResponse.json({ error: 'Πρόβλημα με την υπηρεσία.' }, { status: 500 });
  }
}
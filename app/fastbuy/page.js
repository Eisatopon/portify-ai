'use client';
import PortifyHeader from "@/src/ui/components/PortifyHeader";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const SUGGESTIONS = [
  { label:'💻 Laptop φοιτητή ~800€',        query:'Laptop για φοιτητή μέχρι 800€' },
  { label:'📱 Κινητό με κάμερα ~400€',       query:'Κινητό με καλή κάμερα μέχρι 400€' },
  { label:'🍳 Air fryer 4 άτομα',            query:'Air fryer για 4 άτομα' },
  { label:'🖥️ Monitor για εργασία',          query:'Monitor για εργασία από σπίτι' },
  { label:'🧺 Πλυντήριο ρούχων',            query:'Πλυντήριο ρούχων για 2 άτομα' },
  { label:'📺 Τηλεόραση 55" 4K',            query:'Τηλεόραση 55 ιντσών 4K' },
  { label:'☕ Καφετιέρα espresso',           query:'Καφετιέρα espresso μέχρι 200€' },
  { label:'🎧 Ακουστικά ANC',               query:'Ακουστικά με noise cancelling' },
];

const TIER_CONFIG = {
  best:    { label:'🥇 Καλύτερη Επιλογή', bg:'#f0ebff', color:'#5a2d9e', border:'#5a2d9e', borderWidth:2 },
  value:   { label:'💚 Value for Money',   bg:'#e8f7f0', color:'#1a6b4a', border:'#1a6b4a', borderWidth:2 },
  premium: { label:'⭐ Premium Choice',    bg:'#fff8e8', color:'#8a6000', border:'#e8c84a', borderWidth:1 },
};

const STORES = [
  { name:'Skroutz',   color:'#ff6600', url:(q)=>`https://www.skroutz.gr/search?keyphrase=${encodeURIComponent(q)}` },
  { name:'BestPrice', color:'#0066cc', url:(q)=>`https://www.bestprice.gr/search?q=${encodeURIComponent(q)}` },
  { name:'Amazon',    color:'#ff9900', url:(q)=>`https://www.amazon.de/s?k=${encodeURIComponent(q)}` },
];

// ─── PriceModal ───────────────────────────────────────────────────────────────

function PriceModal({ item, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const searchName = item.name || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:380, width:'100%' }} onClick={e=>e.stopPropagation()}>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Σύγκρινε τιμές για</div>
        <div className="text-lg font-black text-gray-900 mb-1 leading-tight">{item.name}</div>
        <div className="text-xs text-gray-400 mb-5">ενδεικτική τιμή ~{item.price}€ για Ελλάδα</div>

        <div className="flex flex-col gap-3 mb-4">
          {STORES.map(store => (
            <a
              key={store.name}
              href={store.url(searchName)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Αναζήτηση ${item.name} στο ${store.name}`}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 no-underline transition-all hover:bg-gray-50 hover:border-gray-400"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: store.color }} />
                <span className="font-bold text-sm text-gray-900">{store.name}</span>
              </div>
              <span className="text-xs text-gray-400">Δες τιμή →</span>
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(STORES[0].url(searchName));
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              } catch {
                setCopiedLink(false);
              }
            }}
            className="flex-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 bg-white cursor-pointer"
          >
            {copiedLink ? '✓ Αντιγράφηκε!' : '🔗 Αντίγραφο link'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 bg-white cursor-pointer"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FastBuyPage ──────────────────────────────────────────────────────────────

function FastBuyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery]       = useState(() => searchParams.get('q') || '');
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [copied, setCopied]     = useState(false);

  const abortRef = useRef(null);

  const displayQuery = useMemo(
    () => query.length > 60 ? query.slice(0,60) + '…' : query,
    [query]
  );

  const handleNewSearch = useCallback(() => {
    setResults(null);
    setQuery('');
    setError(null);
    router.push('/fastbuy');
  }, [router]);

  const handleSearch = useCallback(async (q) => {
    const searchQuery = (q || query)?.trim();
    if (!searchQuery) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setQuery(searchQuery);
    setLoading(true);
    setResults(null);
    setError(null);

    // Update URL
    router.push(`/fastbuy?q=${encodeURIComponent(searchQuery)}`, { scroll: false });

    try {
      const res = await fetch('/fastbuy/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (data.success) setResults(data.results || []);
      else setError(data.error || 'Κάτι πήγε στραβά.');
    } catch(err) {
      if (err.name === 'AbortError') return;
      setError('Πρόβλημα σύνδεσης. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  // Auto-search από URL param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== query) handleSearch(q);
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/fastbuy?q=${encodeURIComponent(query)}`;
    const text = `Βρήκα προτάσεις αγοράς για:\n"${query}"\n\nστο FastBuy του Portify 👉 ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen font-sans" style={{ background:'#e8e8e8' }}>
      <div className="mx-auto bg-white" style={{ maxWidth:1200 }}>
        <PortifyHeader serviceId="fastbuy" />

        {/* Search */}
        <div className="px-6 md:px-8 py-6 border-b border-gray-100" style={{ background:'#f7f5f0' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="π.χ. Ψυγείο για 4 άτομα, γραφείο εργασίας, laptop φοιτητή..."
                className="flex-1 bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-purple-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="text-white font-bold text-sm rounded-xl px-6 py-3 border-none cursor-pointer disabled:opacity-50 bg-[#5a2d9e] hover:bg-[#4a257f] active:scale-95 transition-all"
              >
                {loading ? 'Σκέφτομαι...' : 'Βρες →'}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SUGGESTIONS.map((s,i) => (
                <button
                  type="button"
                  key={i}
                  tabIndex={0}
                  onClick={() => handleSearch(s.query)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(s.query)}
                  className="text-sm bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-600 font-medium hover:text-purple-700 hover:border-purple-300 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 md:px-8 py-8">

          {/* Empty state */}
          {!loading && results === null && !error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500 text-base">Γράψε τι ψάχνεις και ο AI θα σου προτείνει τις καλύτερες επιλογές</p>
              <p className="text-gray-400 text-sm mt-2">Λειτουργεί για οποιαδήποτε κατηγορία προϊόντος</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
                  <div className="h-5 bg-gray-100 rounded w-48 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-24" />
                    <div className="h-6 bg-gray-100 rounded-full w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">😕</div>
              <div className="text-sm mb-2" style={{ color:'#e8380d' }}>⚠️ {error}</div>
              <p className="text-xs text-gray-400 mb-4">Δοκίμασε να το γράψεις πιο συγκεκριμένα (μάρκα + κατηγορία)</p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#5a2d9e] text-white border-none cursor-pointer"
                >
                  Δοκίμασε ξανά
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(query + ' αγορά Ελλάδα')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-500 no-underline hover:border-gray-400"
                >
                  🔍 Αναζήτηση στο Google
                </a>
              </div>
            </div>
          )}

          {/* No results */}
          {results !== null && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🤔</div>
              <div className="text-sm text-gray-500 mb-4">Δεν βρέθηκαν προτάσεις. Δοκίμασε πιο συγκεκριμένη αναζήτηση.</div>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(query + ' αγορά Ελλάδα')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-500 no-underline hover:border-gray-400"
              >
                🔍 Αναζήτηση στο Google
              </a>
            </div>
          )}

          {/* Results */}
          {results !== null && !loading && results.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-5">
                Προτάσεις για "{displayQuery}"
              </div>
              <div className="flex flex-col gap-4">
                {results.map((item, i) => {
                  const tier = TIER_CONFIG[item.tier] || TIER_CONFIG.premium;
                  return (
                    <div
                      key={i}
                      className="rounded-xl p-5"
                      style={{ border:`${tier.borderWidth}px solid ${tier.border}` }}
                    >
                      <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3" style={{ background:tier.bg, color:tier.color }}>
                        {tier.label}
                      </div>
                      <div className="text-lg font-black tracking-tight text-gray-900 mb-1">{item.name}</div>
                      <div className="text-sm text-gray-500 leading-relaxed mb-4">{item.reason}</div>

                      {/* Pros */}
                      {item.pros?.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Τι κάνει καλά</div>
                          <div className="flex flex-wrap gap-2">
                            {item.pros.slice(0,4).map((pro,j) => (
                              <span key={j} className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-full">✓ {pro}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cons */}
                      {item.cons?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Τι να προσέξεις</div>
                          <div className="flex flex-wrap gap-2">
                            {item.cons.slice(0,3).map((con,j) => (
                              <span key={j} className="text-xs bg-red-50 text-red-400 px-3 py-1 rounded-full">✗ {con}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-black text-gray-900 tracking-tight">~{item.price}€</div>
                          <div className="text-xs text-gray-300">ενδεικτική τιμή για Ελλάδα</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalItem(item)}
                          aria-label={`Βρες τιμή για ${item.name}`}
                          className="text-xs font-bold px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-[#5a2d9e] hover:text-white hover:border-[#5a2d9e] transition-colors"
                          style={{ color:'#5a2d9e', borderColor:'#5a2d9e' }}
                        >
                          Βρες τιμή →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6 justify-center">
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 bg-white cursor-pointer"
                >
                  {copied ? '✓ Αντιγράφηκε!' : '🔗 Μοιράσου τα αποτελέσματα'}
                </button>
                <button
                  type="button"
                  onClick={handleNewSearch}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 bg-white cursor-pointer"
                >
                  ← Νέα αναζήτηση
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-300 text-center">
                Οι τιμές είναι ενδεικτικές βάσει AI γνώσης. Επιβεβαίωσε πάντα στο κατάστημα.
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5" style={{ background:'#111' }}>
          <span className="text-xs font-bold tracking-widest" style={{ color:'#ffffff40' }}>PORTIFY.GR</span>
          <span className="font-black tracking-tight" style={{ fontSize:16, color:'#fff' }}>
            Faster than <span style={{ color:'#f5c842' }}>search.</span>
          </span>
        </div>
      </div>
      {modalItem && <PriceModal item={modalItem} onClose={() => setModalItem(null)} />}
    </main>
  );
}

export default function FastBuyPage() {
  return (
    <Suspense>
      <FastBuyPageInner />
    </Suspense>
  );
}
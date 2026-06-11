'use client'

import PortifyHeader from '@/src/ui/components/PortifyHeader'
import { memo } from 'react'
import { useProducts } from './hooks/useProducts'
import { useBasket } from './hooks/useBasket'
import { GREEK_SUPERMARKETS, EUROPEAN_SUPERMARKETS } from '@/src/data/supermarkets'

// ─── MarketChips ──────────────────────────────────────────────────────────────

const MarketChips = memo(function MarketChips() {
  return (
    <div className="chips">
      {GREEK_SUPERMARKETS.map((s) => (
        <span key={s.id} className="chip">
          <span className="chip-dot" style={{ background: s.color }} />
          {s.shortName}
        </span>
      ))}
      <div className="chips-divider">
        <div className="chips-divider-line" />
        <span className="chips-divider-label">Ενδεικτικές τιμές Ευρώπης</span>
        <div className="chips-divider-line" />
      </div>
      {EUROPEAN_SUPERMARKETS.map((s) => (
        <span key={s.id} className="chip chip-eu">
          {s.flag} {s.shortName}
        </span>
      ))}
    </div>
  )
})

// ─── SearchSection ────────────────────────────────────────────────────────────

function SearchSection({ query, setQuery, loading, onClear, results, onSelect, searchError }) {
  return (
    <div className="fthinatora-search-section">
      <div className="search-container">
        <div className="search-wrap">
          <i className="ti ti-search search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Πληκτρολόγησε προϊόν ή brand..."
            aria-label="Αναζήτηση προϊόντος"
            className="focus-ring"
          />
          {query && (
            <button className="btn-clear-input focus-ring" onClick={onClear} aria-label="Καθαρισμός">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          )}
          <button className="btn-search focus-ring" disabled={loading}>
            {loading ? 'Αναζήτηση...' : 'Σύγκριση →'}
          </button>
        </div>
        {searchError && <p className="search-error">{searchError}</p>}
        {results.length > 0 && (
          <ul className="search-dropdown" role="listbox">
            {results.map((product) => (
              <li key={product.id} role="option">
                <button
                  className="search-result-btn focus-ring"
                  onClick={() => onSelect(product)}
                >
                  <span className="result-name">{product.name}</span>
                  <span className="result-cat">{product.category}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── OffersStrip ──────────────────────────────────────────────────────────────

function OffersStrip({ offers, loadingOffers }) {
  if (loadingOffers) return (
    <div className="offers-strip">
      <div className="skeleton skeleton-title" />
      <div className="offers-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  )
  if (offers.length === 0) return null
  return (
    <div className="offers-strip">
      <div className="strip-title">
        <i className="ti ti-flame" aria-hidden="true" />
        Μεγαλύτερες μειώσεις σήμερα
      </div>
      <div className="offers-grid">
        {offers.slice(0, 3).map((offer, idx) => (
          <div key={offer.id} className="offer-card animate-slide-up" style={{ animationDelay: `${idx * 0.08}s` }}>
            {offer.oldPrice && (
              <span className="offer-discount">
                -{Math.round(((offer.oldPrice - offer.currentPrice) / offer.oldPrice) * 100)}%
              </span>
            )}
            <div className="offer-name">{offer.name}</div>
            <div className="offer-market">{offer.supermarketName}</div>
            <div className="offer-prices">
              {offer.oldPrice && <span className="offer-old">{offer.oldPrice.toFixed(2)}€</span>}
              <span className="offer-cur">{offer.currentPrice.toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PriceCard ────────────────────────────────────────────────────────────────

function PriceCard({ selected, prices, loadingPrices, priceError, onAddToBasket }) {
  if (!selected && !loadingPrices) return (
    <div className="empty-state">
      <i className="ti ti-search" aria-hidden="true" />
      <p>Αναζήτησε ένα προϊόν για να δεις τιμές</p>
    </div>
  )
  if (loadingPrices) return (
    <div className="price-card">
      {[1,2,3,4,5].map((i) => <div key={i} className="skeleton skeleton-row" />)}
    </div>
  )
  if (priceError) return (
    <div className="price-card"><p className="error-text">{priceError}</p></div>
  )

  const maxPrice = prices[prices.length - 1]?.currentPrice || 1
  const greekPrices = prices.filter((p) => !p.isEuropean)
  const euPrices    = prices.filter((p) => p.isEuropean)

  return (
    <div className="price-card animate-fade-in">
      <div className="card-head">
        <div>
          <div className="prod-name">{selected.name}</div>
          <div className="prod-cat">{selected.category}</div>
        </div>
        {prices[0] && <span className="best-badge">Φθηνότερο: {prices[0].supermarketName}</span>}
      </div>
      <div className="price-rows" aria-live="polite">
        {greekPrices.map((price, idx) => (
          <div key={price.supermarketId} className={`price-row-h ${idx === 0 ? 'best' : ''}`}>
            <span className="pr-rank">{idx + 1}</span>
            <span className="pr-name">{price.supermarketName}</span>
            <div className="pr-bar-wrap">
              <div className={`pr-bar ${idx === 0 ? 'best' : ''}`} style={{ width: `${(price.currentPrice / maxPrice) * 100}%` }} />
            </div>
            {price.oldPrice && <span className="pr-old">{price.oldPrice.toFixed(2)}€</span>}
            {price.oldPrice && <span className="pr-tag">-{Math.round(((price.oldPrice - price.currentPrice) / price.oldPrice) * 100)}%</span>}
            <span className="pr-price">{price.currentPrice.toFixed(2)}€</span>
          </div>
        ))}
        {euPrices.length > 0 && (
          <>
            <div className="prices-divider">
              <div className="prices-divider-line" />
              <span className="prices-divider-label">Ενδεικτικές τιμές Ευρώπης</span>
              <div className="prices-divider-line" />
            </div>
            {euPrices.map((price) => (
              <div key={price.supermarketId} className="price-row-h">
                <span className="pr-rank">—</span>
                <span className="pr-name">{price.flag} {price.supermarketName}</span>
                <div className="pr-bar-wrap">
                  <div className="pr-bar" style={{ width: `${(price.currentPrice / maxPrice) * 100}%` }} />
                </div>
                <span className="pr-note">ενδεικτική</span>
                <span className="pr-price">{price.currentPrice.toFixed(2)}€</span>
              </div>
            ))}
          </>
        )}
      </div>
      <button className="btn-add focus-ring" onClick={onAddToBasket}>
        + Προσθήκη στο Έξυπνο Καλάθι
      </button>
    </div>
  )
}

// ─── BasketPanel ──────────────────────────────────────────────────────────────

function BasketPanel({ basket }) {
  const {
    items, isEmpty, itemCount, isStale,
    rankedSupermarkets, savings, savingsPercent,
    hasTotals, loading, totalItemsValue,
    updateQuantity, clearBasket, compareBasket,
  } = basket

  const maxTotal = rankedSupermarkets[rankedSupermarkets.length - 1]?.total || 1

  return (
    <div className="basket-panel">
      <div className="basket-header">
        <h3>
          <i className="ti ti-shopping-cart" aria-hidden="true" />
          Έξυπνο Καλάθι
          {itemCount > 0 && <span className="basket-badge">{itemCount}</span>}
        </h3>
        {!isEmpty && (
          <button className="clear-link focus-ring" onClick={clearBasket}>Καθαρισμός</button>
        )}
      </div>
      {isEmpty && (
        <p className="basket-hint">
          <i className="ti ti-info-circle" aria-hidden="true" />
          Πρόσθεσε πολλά προϊόντα και δες πού κοστίζει λιγότερο το σύνολο
        </p>
      )}
      {isEmpty ? (
        <p className="basket-empty">Πρόσθεσε προϊόντα για σύγκριση τιμών</p>
      ) : (
        <>
          <div className="basket-items">
            {items.map((item) => (
              <div key={item.id} className="basket-item">
                <span className="item-name">{item.name}</span>
                <div className="stepper">
                  <button className="focus-ring" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Μείωση">−</button>
                  <span>{item.quantity}</span>
                  <button className="focus-ring" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Αύξηση">+</button>
                </div>
              </div>
            ))}
          </div>
          {totalItemsValue > 0 && (
            <div className="basket-subtotal">
              Εκτίμηση από φθηνότερο: <strong>~{totalItemsValue.toFixed(2)}€</strong>
            </div>
          )}
          <button className="btn-compare focus-ring" onClick={compareBasket} disabled={loading}>
            <i className="ti ti-chart-bar" aria-hidden="true" />
            {loading ? 'Σύγκριση...' : isStale ? '🔄 Ενημέρωση σύγκρισης' : 'Σύγκριση τιμών'}
          </button>
          {isStale && hasTotals && <p className="stale-notice">⚠️ Το καλάθι άλλαξε — πάτα ενημέρωση</p>}
        </>
      )}
      {hasTotals && !isStale && (
        <>
          <div className="savings-banner animate-fade-in">
            <div>
              <div className="sav-amt">{savings.toFixed(2)}€</div>
              <div className="sav-label">Εκτιμώμενη εβδομαδιαία εξοικονόμηση</div>
              <div className="sav-subtitle">σε σχέση με ακριβότερο supermarket</div>
            </div>
            <span className="sav-pct">-{savingsPercent}%</span>
          </div>
          <div className="ranked">
            {rankedSupermarkets.map((s, idx) => (
              <div key={s.id} className={`ranked-item ${idx === 0 ? 'cheapest' : ''}`}>
                <span className="r-rank">{idx + 1}</span>
                <span className="r-name">{s.flag && <span style={{ marginRight: 4 }}>{s.flag}</span>}{s.name}</span>
                <div className="r-bar-wrap">
                  <div className={`r-bar ${idx === 0 ? 'best' : ''}`} style={{ width: `${(s.total / maxTotal) * 100}%` }} />
                </div>
                <span className="r-total">{s.total.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── TrustSection ─────────────────────────────────────────────────────────────

const TrustSection = memo(function TrustSection() {
  return (
    <div className="trust-section">
      <div className="trust-title">Γιατί να εμπιστευτείς το Φθηνά Τώρα</div>
      <div className="trust-items">
        <div className="trust-item-card"><i className="ti ti-check" aria-hidden="true" />Δεδομένα από PosoKanei (Gov.gr)</div>
        <div className="trust-item-card"><i className="ti ti-check" aria-hidden="true" />Ενημέρωση κάθε πρωί στις 10:00</div>
        <div className="trust-item-card"><i className="ti ti-check" aria-hidden="true" />Σύγκριση 7 ελληνικών αλυσίδων</div>
        <div className="trust-item-card"><i className="ti ti-check" aria-hidden="true" />Χωρίς διαφημιζόμενες τιμές</div>
      </div>
      <p className="trust-gov">Δεν αποθηκεύουμε προσωπικά στοιχεία</p>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FthinaToraPage() {
  const products = useProducts()
  const basket   = useBasket()

  const {
    query, setQuery,
    results, selected,
    prices, offers,
    loading, loadingPrices, loadingOffers,
    searchError, priceError,
    selectProduct, clearSearch,
  } = products

  return (
    <main className="fthinatora-page animate-page-in">

      {/* PortifyHeader — nav + hero */}
      <PortifyHeader serviceId="fthinatora" />

      {/* Search bar — κάτω από το hero */}
      <SearchSection
        query={query}
        setQuery={setQuery}
        loading={loading}
        onClear={clearSearch}
        results={results}
        onSelect={selectProduct}
        searchError={searchError}
      />

      {/* Trust bar */}
      <div className="trust-bar">
        <div className="trust-item">
          <i className="ti ti-shopping-cart" aria-hidden="true" />
          <span><strong>7</strong> σούπερ μάρκετ</span>
        </div>
        <div className="trust-item">
          <span className="live-dot" aria-hidden="true" />
          <span>Ενημέρωση <strong>10:00</strong></span>
        </div>
        <div className="trust-item">
          <i className="ti ti-database" aria-hidden="true" />
          <span>Τιμές σε <strong>πραγματικό χρόνο</strong></span>
        </div>
      </div>

      {/* Market chips */}
      <MarketChips />

      {/* Steps */}
      <div className="steps-bar">
        <div className="step"><span className="step-num">1</span>Αναζήτησε προϊόν</div>
        <span className="step-arrow">→</span>
        <div className="step"><span className="step-num">2</span>Πρόσθεσε στο καλάθι</div>
        <span className="step-arrow">→</span>
        <div className="step"><span className="step-num">3</span>Δες πού συμφέρει</div>
      </div>

      {/* Offers */}
      <OffersStrip offers={offers} loadingOffers={loadingOffers} />

      {/* Main grid */}
      <div className="main-grid">
        <PriceCard
          selected={selected}
          prices={prices}
          loadingPrices={loadingPrices}
          priceError={priceError}
          onAddToBasket={() => selected && basket.addItem(selected)}
        />
        <BasketPanel basket={basket} />
      </div>

      {/* Trust section */}
      <TrustSection />

    </main>
  )
}
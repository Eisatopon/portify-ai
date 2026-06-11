const COUNTRY_FLAGS = {
  GR: '🇬🇷',
  DE: '🇩🇪',
  FR: '🇫🇷',
  CY: '🇨🇾',
};

const COUNTRY_LABELS = {
  GR: 'Ελλάδα',
  DE: 'Γερμανία',
  FR: 'Γαλλία',
  CY: 'Κύπρος',
};

export const logoPath = (file) => `/logos/${file}`;

const SUPERMARKETS = {
  greek: [
    {
      id: 'sklavenitis',
      category: 'supermarket',
      name: 'Σκλαβενίτης',
      shortName: 'Σκλαβενίτης',
      country: 'GR',
      currency: 'EUR',
      color: '#e8380d',
      logo: logoPath('sklavenitis.png'),
      url: 'https://www.sklavenitis.gr',
      active: true,
      priceType: 'live',
      priority: 1,
      coverage: 'national',
    },
    {
      id: 'lidl',
      category: 'supermarket',
      name: 'Lidl',
      shortName: 'Lidl',
      country: 'GR',
      currency: 'EUR',
      color: '#f5c842',
      logo: logoPath('lidl.png'),
      url: 'https://www.lidl-hellas.gr',
      active: true,
      priceType: 'live',
      priority: 2,
      coverage: 'national',
    },
    {
      id: 'ab',
      category: 'supermarket',
      name: 'ΑΒ Βασιλόπουλος',
      shortName: 'ΑΒ',
      country: 'GR',
      currency: 'EUR',
      color: '#e63946',
      logo: logoPath('ab.png'),
      url: 'https://www.ab.gr',
      active: true,
      priceType: 'live',
      priority: 3,
      coverage: 'national',
    },
    {
      id: 'mymarket',
      category: 'supermarket',
      name: 'My Market',
      shortName: 'My Market',
      country: 'GR',
      currency: 'EUR',
      color: '#1a4fa8',
      logo: logoPath('mymarket.png'),
      url: 'https://www.mymarket.gr',
      active: true,
      priceType: 'live',
      priority: 4,
      coverage: 'national',
    },
    {
      id: 'masoutis',
      category: 'supermarket',
      name: 'Μασούτης',
      shortName: 'Μασούτης',
      country: 'GR',
      currency: 'EUR',
      color: '#1a7a4a',
      logo: logoPath('masoutis.png'),
      url: 'https://www.masoutis.gr',
      active: true,
      priceType: 'live',
      priority: 5,
      coverage: 'national',
    },
    {
      id: 'marketin',
      category: 'supermarket',
      name: 'Market In',
      shortName: 'Market In',
      country: 'GR',
      currency: 'EUR',
      color: '#e67e22',
      logo: logoPath('marketin.png'),
      url: 'https://www.marketin.gr',
      active: true,
      priceType: 'live',
      priority: 6,
      coverage: 'regional',
    },
    {
      id: 'galaxias',
      category: 'supermarket',
      name: 'Γαλαξίας',
      shortName: 'Γαλαξίας',
      country: 'GR',
      currency: 'EUR',
      color: '#8e44ad',
      logo: logoPath('galaxias.png'),
      url: 'https://www.galaxias.gr',
      active: true,
      priceType: 'live',
      priority: 7,
      coverage: 'regional',
    },
  ],

  european: [
    {
      id: 'rewe',
      category: 'supermarket',
      name: 'Rewe',
      shortName: 'Rewe',
      country: 'DE',
      currency: 'EUR',
      color: '#cc0000',
      logo: logoPath('rewe.png'),
      url: 'https://www.rewe.de',
      active: true,
      priceType: 'estimated',
      priority: 8,
      coverage: 'national',
      note: 'Ενδεικτικές τιμές Γερμανίας',
    },
    {
      id: 'carrefour',
      category: 'supermarket',
      name: 'Carrefour',
      shortName: 'Carrefour',
      country: 'FR',
      currency: 'EUR',
      color: '#003da5',
      logo: logoPath('carrefour.png'),
      url: 'https://www.carrefour.fr',
      active: true,
      priceType: 'estimated',
      priority: 9,
      coverage: 'national',
      note: 'Ενδεικτικές τιμές Γαλλίας',
    },
    {
      id: 'alfamega',
      category: 'supermarket',
      name: 'Αλφαμέγα',
      shortName: 'Αλφαμέγα',
      country: 'CY',
      currency: 'EUR',
      color: '#0077b6',
      logo: logoPath('alfamega.png'),
      url: 'https://www.alfamega.com.cy',
      active: true,
      priceType: 'estimated',
      priority: 10,
      coverage: 'national',
      note: 'Ενδεικτικές τιμές Κύπρου',
    },
  ],
};

export const GREEK_SUPERMARKETS    = SUPERMARKETS.greek;
export const EUROPEAN_SUPERMARKETS = SUPERMARKETS.european;
export const ALL_SUPERMARKETS      = [...SUPERMARKETS.greek, ...SUPERMARKETS.european];

// O(1) lookup
const SUPERMARKET_MAP = new Map(ALL_SUPERMARKETS.map(s => [s.id, s]));

// ─── Lookups ──────────────────────────────────────────────────────────────────
export const getSupermarketById      = (id)      => SUPERMARKET_MAP.get(id);
export const getSupermarketColor     = (id)      => SUPERMARKET_MAP.get(id)?.color  || '#ccc';
export const getSupermarketLogo      = (id)      => SUPERMARKET_MAP.get(id)?.logo   || '/logos/default.png';

// ─── Filters ─────────────────────────────────────────────────────────────────
export const getActiveSupermarkets       = ()        => ALL_SUPERMARKETS.filter(s => s.active);
export const getSupermarketsByCountry    = (country) => ALL_SUPERMARKETS.filter(s => s.country === country);
export const getLivePriceSupermarkets    = ()        => ALL_SUPERMARKETS.filter(s => s.priceType === 'live');

export const LIVE_PRICE_SUPERMARKETS = getLivePriceSupermarkets();

// ─── Sorting ─────────────────────────────────────────────────────────────────
export const sortByPriority  = (list) => [...list].sort((a, b) => a.priority - b.priority);
export const sortByName      = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'el'));
export const sortByCoverage  = (list) => {
  const order = { national: 0, regional: 1 };
  return [...list].sort((a, b) => order[a.coverage] - order[b.coverage]);
};
export const getActiveSupermarketsSorted = () => sortByPriority(getActiveSupermarkets());

// ─── Flags & labels ───────────────────────────────────────────────────────────
export const getFlag         = (country) => COUNTRY_FLAGS[country]  ?? '🌍';
export const getCountryLabel = (country) => COUNTRY_LABELS[country] ?? country;

// ─── Validation (dev-time) ───────────────────────────────────────────────────
export function validateSupermarket(s) {
  const required = ['id', 'name', 'color', 'url'];
  const missing  = required.filter(field => !s[field]);
  if (missing.length > 0) {
    console.warn(`[supermarkets] Missing fields for ${s.id}: ${missing.join(', ')}`);
  }
  return missing.length === 0;
}

if (process.env.NODE_ENV === 'development') {
  ALL_SUPERMARKETS.forEach(validateSupermarket);
}

export default SUPERMARKETS;
'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HERO, SERVICES } from '@/src/core/config/uiConfig';

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const num = parseInt(value);
    if (isNaN(num)) { setDisplay(value + (suffix || "")); return; }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const duration = 1200;
        const steps = 40;
        const stepVal = num / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += stepVal;
          if (current >= num) {
            setDisplay(value + (suffix || ""));
            clearInterval(timer);
          } else {
            setDisplay(String(Math.floor(current)));
          }
        }, duration / steps);
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

// ─── Service Tile ─────────────────────────────────────────────────────────────

function ServiceTile({ service, tileRef, large, small, fullWidth }) {
  const nameParts = service.name.split('\n');
  const [news, setNews] = useState([]);
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (service.id !== 'molis-tora') return;
    fetch('/api/latest-news')
      .then(r => r.json())
      .then(data => setNews(data))
      .catch(() => {});
  }, [service.id]);

  useEffect(() => {
    if (service.id !== 'molis-tora' || news.length === 0) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % news.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [news, service.id]);

  if (service.comingSoon) {
    return (
      <div
        ref={tileRef}
        className="service-tile"
        style={{ gridArea: service.gridArea, background: service.bg, color: service.color, opacity: 0.55, cursor: 'default', position: 'relative' }}
      >
        <div className="service-tile-inner">
          <div>
            <div className="service-tile-name" style={{ fontSize: '1.3rem' }}>
              {nameParts.map((part, i) => (<span key={i}>{part}{i < nameParts.length - 1 && <br />}</span>))}
            </div>
            <div className="service-tile-cat" style={{ color: service.subColor }}>{service.category}</div>
          </div>
        </div>
        <div style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.25)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:99 }}>Σύντομα</div>
      </div>
    );
  }

  const currentNews = news[current];

  return (
    <Link
      href={service.href}
      ref={tileRef}
      className="service-tile focus-ring"
      style={{ gridArea: service.gridArea, background: service.bg, color: service.color }}
    >
      <div className="service-tile-inner">
        <div>
          <div className="service-tile-name"
            style={{
              fontSize: large ? 'clamp(1.8rem,3.5vw,2.6rem)' : small ? '1rem' : fullWidth ? 'clamp(1.5rem,3vw,2rem)' : '1.3rem',
            }}>
            {nameParts.map((part, i) => (
              <span key={i}>{part}{i < nameParts.length - 1 && <br />}</span>
            ))}
          </div>
          <div className="service-tile-cat" style={{ color: service.subColor }}>{service.category}</div>
          {service.description && !currentNews && (
            <div className="service-tile-desc" style={{ color: service.subColor }}>{service.description}</div>
          )}
        </div>
      </div>

      {service.id === 'molis-tora' && currentNews && (
        <div style={{
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.4s ease',
          position: 'absolute',
          bottom: 40,
          left: 24,
          right: 24,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: service.subColor, marginBottom: 4 }}>
            {currentNews.source}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: service.color, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {currentNews.title}
          </div>
        </div>
      )}

      <div className="service-tile-arrow" style={{ color: service.arrowColor }}>→</div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const tilesRef   = useRef([]);
  const whitesRef  = useRef([]);
  const statsRef   = useRef([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ease = 'cubic-bezier(.22,1,.36,1)';
    const allAnimated = [
      ...tilesRef.current,
      ...whitesRef.current,
    ];

    allAnimated.forEach(el => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
    });
    statsRef.current.forEach(el => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
    });

    setTimeout(() => {
      allAnimated.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => {
          el.style.transition = `transform .55s ${ease}, opacity .55s ${ease}`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 200 + i * 55);
      });
      statsRef.current.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => {
          el.style.transition = `transform .5s ${ease}, opacity .5s ${ease}`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 700 + i * 60);
      });
    }, 150);
  }, []);

  const whites = ['w1','w2','w3','wa','wb','wc','wd'];

  return (
    <main className="portify-home">
      <div className="portify-container">

        {/* Nav */}
        <nav className="portify-nav">
          <div className="portify-nav-logo">PORTIFY.GR</div>
          <div className="portify-nav-badge">BETA</div>
        </nav>

        {/* Hero */}
        <section className="portify-hero">
          <p className="portify-hero-eyebrow">{HERO.EYEBROW}</p>
          <h1 className="portify-hero-title">
            {HERO.TITLE}
            <br />
            <em className="portify-hero-em">{HERO.TITLE_EM}</em>
          </h1>
          <p className="portify-hero-sub">{HERO.SUBTITLE}</p>
        </section>

        {/* Mondrian Grid */}
        <div className="portify-mondrian">

          {SERVICES.map((service, i) => (
            <ServiceTile
              key={service.id}
              service={service}
              tileRef={el => tilesRef.current[i] = el}
              large={service.gridArea === 'molis'}
              small={service.gridArea === 'video'}
              fullWidth={service.gridArea === 'fthinatora'}
            />
          ))}

          {whites.map((area, i) => (
            <div
              key={area}
              ref={el => whitesRef.current[i] = el}
              className="white-tile"
              style={{ gridArea: area }}
            />
          ))}

        </div>

        {/* Stats */}
        <div className="portify-stats">
          {HERO.STATS.map((s, i) => (
            <div
              key={s.label}
              ref={el => statsRef.current[i] = el}
              className="portify-stat"
            >
              <div className="portify-stat-num">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <div className="portify-stat-label">{s.label}</div>
            </div>
          ))}
          <div
            ref={el => statsRef.current[3] = el}
            className="portify-stat portify-stat-dark"
          >
            <p>Faster than <span>search.</span></p>
          </div>
        </div>

      </div>

      <style jsx global>{`
        .portify-home {
          font-family: var(--font-inter), Inter, sans-serif;
          background: #e8e8e8;
          min-height: 100vh;
        }
        .portify-container {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
        }
        .portify-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          border-bottom: 1px solid #e8e8e8;
        }
        .portify-nav-logo {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #111;
        }
        .portify-nav-badge {
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #888;
          border: 1px solid #ddd;
          padding: 4px 10px;
          border-radius: 99px;
        }
        .portify-hero {
          background: #111;
          padding: clamp(40px,8vw,80px) clamp(20px,4vw,32px) clamp(36px,7vw,72px);
          text-align: center;
        }
        .portify-hero-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #f5c842;
          margin-bottom: 24px;
        }
        .portify-hero-title {
          font-size: clamp(36px,7vw,80px);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 0 0 16px;
        }
        .portify-hero-em {
          font-style: italic;
          font-weight: 400;
          color: #555;
          font-size: clamp(24px,4vw,52px);
        }
        .portify-hero-sub {
          font-size: 16px;
          color: #666;
          max-width: 400px;
          line-height: 1.6;
          margin: 0 auto;
        }

        /* ─── Mondrian Grid ─── */
        .portify-mondrian {
          display: grid;
          grid-template-columns: 2fr 0.45fr 1.2fr 1fr;
          grid-template-rows: 180px 140px 90px 150px;
          grid-template-areas:
            "molis w1  gov   buy"
            "molis w2  video w3"
            "wa    wb  wc    wd"
            "fthinatora fthinatora fthinatora fthinatora";
          border-left: 4px solid #111;
          border-top: 4px solid #111;
        }

        /* ─── Service Tiles ─── */
        .service-tile {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.5rem;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          border-right: 4px solid #111;
          border-bottom: 4px solid #111;
          will-change: transform, opacity;
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.2s cubic-bezier(0.4,0,0.2,1),
                      filter 0.2s ease;
        }
        .service-tile {
          perspective: 1200px;
        }
        .service-tile:hover {
          transform: perspective(1200px) rotateY(-18deg) translateX(6px);
          box-shadow: 12px 0 32px rgba(0,0,0,0.3);
          filter: brightness(0.95);
          z-index: 10;
          transform-origin: left center;
        }
        .service-tile:hover .service-tile-arrow {
          transform: translateX(6px);
        }
        .service-tile[style*="fthinatora"] {
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 2rem;
          padding: 1.5rem 2rem;
        }
        .service-tile-inner {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          position: relative;
          z-index: 1;
        }
        .service-tile-name {
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .service-tile-cat {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.9;
          margin-top: 6px;
        }
        .service-tile-desc {
          font-size: 13px;
          opacity: 0.85;
          margin-top: 5px;
          line-height: 1.4;
          font-weight: 500;
        }
        .service-tile-icon {
          display: none;
        }
        .service-tile-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: rgba(255,255,255,0.22);
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .service-tile-arrow {
          font-size: 1.3rem;
          align-self: flex-end;
          opacity: 0.55;
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
        }

        /* ─── White tiles ─── */
        .white-tile {
          background: #fff;
          background-image: radial-gradient(#d8d8d8 0.5px, transparent 0.5px);
          background-size: 16px 16px;
          border-right: 4px solid #111;
          border-bottom: 4px solid #111;
          will-change: transform, opacity;
        }

        /* ─── Stats ─── */
        .portify-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          border-left: 4px solid #111;
        }
        .portify-stat {
          background: #f7f5f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 28px 16px;
          border-right: 4px solid #111;
          border-bottom: 4px solid #111;
          will-change: transform, opacity;
        }
        .portify-stat-num {
          font-size: clamp(24px,3vw,36px);
          font-weight: 900;
          color: #111;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
        .portify-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          text-align: center;
        }
        .portify-stat-dark {
          background: #111;
          align-items: center;
          justify-content: center;
        }
        .portify-stat-dark p {
          font-size: clamp(18px,2.5vw,28px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          text-align: center;
          color: #fff;
        }
        .portify-stat-dark span { color: #f5c842; }

        /* ─── Responsive ─── */
        @media (max-width: 767px) {
          .portify-mondrian {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 180px 140px 140px 110px;
            grid-template-areas:
              "molis  molis"
              "gov    buy"
              "video  w1"
              "fthinatora fthinatora";
          }
          .portify-mondrian .white-tile:not([style*="w1"]) { display: none; }
          .portify-stats { grid-template-columns: 1fr 1fr; }
          .portify-nav { padding: 14px 20px; }
        }
      `}</style>
    </main>
  );
}
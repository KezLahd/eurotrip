"use client"

import Link from "next/link"
import { useEffect } from "react"
import styles from "./landing.module.css"

// Travel order: Athens → Paros → Cannes → Sorrento → Rome → London
// Rough geographic placement on a 360×360 canvas — readable, not atlas-accurate.
const CITIES: Array<{ name: string; x: number; y: number; labelDx: number; labelDy: number }> = [
  { name: "London",    x:  82, y:  64, labelDx: 10,  labelDy: -8  },
  { name: "Cannes",    x: 138, y: 178, labelDx: -66, labelDy:  4  },
  { name: "Rome",      x: 182, y: 212, labelDx:  12, labelDy:  0  },
  { name: "Sorrento",  x: 198, y: 238, labelDx:  12, labelDy: 14  },
  { name: "Athens",    x: 260, y: 228, labelDx:  12, labelDy:  0  },
  { name: "Paros",     x: 278, y: 258, labelDx:  12, labelDy: 10  },
]

// Trail in TRAVEL order: Athens → Paros → Cannes → Sorrento → Rome → London.
// Uses the same coords as CITIES.
const TRAIL_ORDER = ["Athens", "Paros", "Cannes", "Sorrento", "Rome", "London"] as const
const cityCoord = (name: (typeof TRAIL_ORDER)[number]) =>
  CITIES.find((c) => c.name === name)!
const trailPath = TRAIL_ORDER.map((c, i) => {
  const { x, y } = cityCoord(c)
  return `${i === 0 ? "M" : "L"} ${x} ${y}`
}).join(" ")

export default function Landing() {
  // Eurotrip's globals.css locks `html, body { overflow: hidden }` so the
  // itinerary app stays pinned. The landing needs normal scrolling, so
  // override while this component is mounted.
  useEffect(() => {
    const body = document.body
    const html = document.documentElement
    const prevBody = body.style.overflow
    const prevHtml = html.style.overflow
    const prevBodyBg = body.style.backgroundColor
    body.style.overflow = "auto"
    html.style.overflow = "auto"
    body.style.backgroundColor = "#CFE0F0"
    return () => {
      body.style.overflow = prevBody
      html.style.overflow = prevHtml
      body.style.backgroundColor = prevBodyBg
    }
  }, [])

  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden />

      <div className={styles.content}>
        {/* ─── Nav ────────────────────────────────── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Eurotrip<span className={styles.logoDot} />
          </Link>
          <div className={styles.navRight}>
            <a href="#about" className={styles.navLink}>
              About
            </a>
            <a
              href="https://github.com/KezLahd/eurotrip"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.navLink}
            >
              GitHub ↗
            </a>
            <Link href="/login" className={styles.signInBtn}>
              Sign in <span className={styles.arrow}>→</span>
            </Link>
          </div>
        </nav>

        {/* ─── Hero ───────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <span className={styles.pill}>
                <span className={styles.pillDot} />
                Family trip · 20 of us
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>Eurotrip</span>
              <span className={styles.pinkDot}>.</span>
            </h1>

            <p className={styles.heroTag}>
              A first user platform, built for a family trip through Europe.
              <br />
              Twenty people. Six stops. One app.
              <span className={styles.scribble}>bon voyage</span>
            </p>

            <div className={styles.ctas}>
              <Link href="/login" className={styles.btnPrimary}>
                Sign in <span className={styles.arrow}>→</span>
              </Link>
              <a
                href="https://github.com/KezLahd/eurotrip"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnGhost}
              >
                See it on GitHub
              </a>
            </div>
          </div>

          <div className={styles.heroRight}>
            <svg
              className={styles.map}
              viewBox="-20 -20 400 400"
              xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: "visible" }}
              aria-hidden
            >
              <defs>
                <linearGradient id="euTrail" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF1493" />
                  <stop offset="100%" stopColor="#6AB8FF" />
                </linearGradient>
              </defs>

              {/* concentric rings, centred-ish */}
              <circle cx="180" cy="180" r="164" fill="none" stroke="#FF1493" strokeOpacity="0.1" />
              <circle cx="180" cy="180" r="124" fill="none" stroke="#FF1493" strokeOpacity="0.18" />
              <circle cx="180" cy="180" r="84" fill="none" stroke="#FF1493" strokeOpacity="0.28" />

              {/* travel trail in order */}
              <path
                d={trailPath}
                fill="none"
                stroke="url(#euTrail)"
                strokeWidth="2"
                strokeDasharray="5 6"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* city pins + labels */}
              {CITIES.map(({ name, x, y, labelDx, labelDy }) => (
                <g key={name}>
                  <circle cx={x} cy={y} r="10" fill="#FF1493" fillOpacity="0.18" />
                  <circle cx={x} cy={y} r="5" fill="#FF1493" />
                  <text
                    x={x + labelDx}
                    y={y + labelDy}
                    fill="#0D0D0D"
                    fillOpacity="0.85"
                    fontFamily="'Caveat', 'Bradley Hand', cursive"
                    fontSize="20"
                    textAnchor={labelDx < 0 ? "end" : "start"}
                  >
                    {name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        {/* ─── About ──────────────────────────────── */}
        <section className={styles.section} id="about">
          <div className={styles.sectionHead}>
            <div className={styles.sectionNo}>01 / The story</div>
            <h2 className={styles.sectionTitle}>
              Mum had it in <em>Excel</em>. I turned it into an app.
            </h2>
          </div>
          <p className={styles.aboutText}>
            The trip started in a spreadsheet. Mum had done all the planning —
            flights, accommodation, day-by-day. The family kept messaging her:
            <em> &ldquo;when are we in Athens again?&rdquo;</em>,{" "}
            <em> &ldquo;what&apos;s the name of the hotel in Cannes?&rdquo;</em>,{" "}
            <em> &ldquo;can someone send me the flight booking reference?&rdquo;</em> —
            twenty times over. So I built this: a private, login-gated web app
            that turned the spreadsheet into something twenty people could all
            use at once.
            <br /><br />
            Every person saw <strong>their own flight tickets and booking
            references</strong>. The whole family shared a single day-by-day feed
            of activities with <strong>voting</strong>, so we knew what everyone
            wanted to do before we had the conversation. Nearby gyms, coffee
            shops, and shopping got surfaced per city, because at some point
            someone always wanted one of those and nobody wanted to open Google
            Maps again.
            <br /><br />
            It was my <strong>first real user platform</strong>. It serviced the
            whole family across a month of travel and built more hype for the
            trip than any WhatsApp group ever could.
          </p>
        </section>

        {/* ─── Features ───────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionNo}>02 / Inside</div>
            <h2 className={styles.sectionTitle}>
              What the <em>twenty of us</em> actually used.
            </h2>
          </div>
          <div className={styles.features}>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Personal travel docs</h3>
              <p className={styles.featureBody}>
                Each user saw their own flight tickets, accommodation booking
                references, transfers, and train reservations. No more "can
                someone forward me the email".
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Activity feed with voting</h3>
              <p className={styles.featureBody}>
                Twenty opinions about one afternoon in Paros — resolved before
                anyone had to be a mediator. Vote up, vote down, see what the
                group leaned toward.
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Nearby this city</h3>
              <p className={styles.featureBody}>
                Gyms, coffee shops, and shopping per city, so the person on
                holiday-but-still-training and the person who needed a flat white
                at 7am could both get on with their morning.
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Restaurants &amp; events</h3>
              <p className={styles.featureBody}>
                Special-occasion dinners and birthday bookings pinned to the
                days they happened on, so everyone knew to be ready on time in
                the right place in the right shirt.
              </p>
            </article>
          </div>

          <div className={styles.stackRow}>
            <span className={`${styles.stackPill} ${styles.accent}`}>NEXT.JS</span>
            <span className={styles.stackPill}>TYPESCRIPT</span>
            <span className={styles.stackPill}>SUPABASE</span>
            <span className={`${styles.stackPill} ${styles.accent}`}>SERVER ACTIONS</span>
            <span className={styles.stackPill}>PWA MANIFEST</span>
            <span className={styles.stackPill}>MIDDLEWARE AUTH</span>
          </div>
        </section>

        {/* ─── Cities / route ─────────────────────── */}
        <section className={styles.cities}>
          <div className={styles.citiesInner}>
            <span>athens</span>
            <span>→</span>
            <span>paros</span>
            <span>→</span>
            <span>cannes</span>
            <span>→</span>
            <span>sorrento</span>
            <span>→</span>
            <span>rome</span>
            <span>→</span>
            <span>london</span>
          </div>
        </section>

        {/* ─── Final CTA ──────────────────────────── */}
        <section className={styles.finalCta}>
          <h2 className={styles.finalTitle}>
            If you were on the trip, <em>you know the password.</em>
          </h2>
          <p className={styles.finalTag}>Otherwise, the code tells the story.</p>
          <div className={styles.ctas} style={{ justifyContent: "center" }}>
            <Link href="/login" className={styles.btnPrimary}>
              Sign in <span className={styles.arrow}>→</span>
            </Link>
            <a
              href="https://github.com/KezLahd/eurotrip"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnGhost}
            >
              GitHub ↗
            </a>
          </div>
        </section>

        {/* ─── Footer ─────────────────────────────── */}
        <footer className={styles.footer}>
          <span>Built by Kieran · For family · 2025</span>
          <span>
            Another{" "}
            <a
              href="https://instagram.com/kieranjxn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kez Curation ↗
            </a>
          </span>
        </footer>
      </div>
    </main>
  )
}

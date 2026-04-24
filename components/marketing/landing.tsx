"use client"

import Link from "next/link"
import { useEffect } from "react"
import styles from "./landing.module.css"

const CITIES = ["paris", "rome", "barcelona", "split", "lisbon", "mykonos", "amsterdam", "prague", "florence"]

export default function Landing() {
  // The app sets `html, body { overflow: hidden }` in globals.css to keep
  // the itinerary view locked in place. For the landing we want normal
  // scrolling, so override it while this component is mounted.
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
                For four mates · Private
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>Eurotrip</span>
              <span className={styles.pinkDot}>.</span>
            </h1>

            <p className={styles.heroTag}>
              A private itinerary app for four of us through Europe.
              <br />
              Not a product. Not for sale.
              <span className={styles.scribble}>just ours</span>
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
            <svg className={styles.map} viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <defs>
                <linearGradient id="euTrail" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF1493" />
                  <stop offset="100%" stopColor="#6AB8FF" />
                </linearGradient>
              </defs>
              <circle cx="180" cy="180" r="150" fill="none" stroke="#FF1493" strokeOpacity="0.15" />
              <circle cx="180" cy="180" r="110" fill="none" stroke="#FF1493" strokeOpacity="0.25" />
              <circle cx="180" cy="180" r="70" fill="none" stroke="#FF1493" strokeOpacity="0.4" />
              <path
                d="M 70 120 Q 130 80 180 110 Q 240 140 280 100 Q 310 180 260 230 Q 200 270 140 240 Q 80 210 70 120 Z"
                fill="none"
                stroke="url(#euTrail)"
                strokeWidth="2"
                strokeDasharray="4 6"
                opacity="0.8"
              />
              <g fill="#FF1493">
                <circle cx="70" cy="120" r="6" />
                <circle cx="180" cy="110" r="6" />
                <circle cx="280" cy="100" r="6" />
                <circle cx="260" cy="230" r="6" />
                <circle cx="140" cy="240" r="6" />
              </g>
              <path
                d="M 180 160 C 168 160 158 170 158 182 C 158 198 180 224 180 224 C 180 224 202 198 202 182 C 202 170 192 160 180 160 Z"
                fill="#FF1493"
              />
              <circle cx="180" cy="182" r="6" fill="#CFE0F0" />
            </svg>
          </div>
        </section>

        {/* ─── About ──────────────────────────────── */}
        <section className={styles.section} id="about">
          <div className={styles.sectionHead}>
            <div className={styles.sectionNo}>01 / What it is</div>
            <h2 className={styles.sectionTitle}>
              A trip app built for us, <em>by one of us</em>.
            </h2>
          </div>
          <p className={styles.aboutText}>
            Four mates, one Europe trip, one shared itinerary problem — the kind
            that lives in seventeen group-chat scroll-backs. So I built this. A
            PWA you can install on your phone, login-gated to the four of us,
            with every day of the trip, every booking, and a per-city shortlist
            of things to do when we don&apos;t know what to do.
            <br /><br />
            It&apos;s not a product. There&apos;s no public signup. If you&apos;re
            reading this and you weren&apos;t on the trip, the code on GitHub is
            a better time.
          </p>
        </section>

        {/* ─── Features ───────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionNo}>02 / Inside</div>
            <h2 className={styles.sectionTitle}>
              The things it <em>actually does</em>.
            </h2>
          </div>
          <div className={styles.features}>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Shared itinerary</h3>
              <p className={styles.featureBody}>
                Every day, every booking, every note. The four of us see the same
                plan in the same place.
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Activity shortlists</h3>
              <p className={styles.featureBody}>
                Per-city lists of things to do, so at midnight in Barcelona we
                don&apos;t have to open six tabs.
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Installable as a PWA</h3>
              <p className={styles.featureBody}>
                Works offline-ish. Which is relevant, because rural Croatia is
                relevant, because that&apos;s where reception goes to die.
              </p>
            </article>
            <article className={styles.feature}>
              <h3 className={styles.featureTitle}>Cinematic backgrounds</h3>
              <p className={styles.featureBody}>
                Full-bleed looping landscape clips. On a train into Rome, they do
                something. On the couch in Sydney, they&apos;re a dumb flourish.
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

        {/* ─── Cities ribbon ──────────────────────── */}
        <section className={styles.cities}>
          <div className={styles.citiesInner}>
            {CITIES.map((c) => (
              <span key={c}>{c}</span>
            ))}
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
          <span>Built by Kieran · For four mates · 2025</span>
          <span>
            <a href="https://kieranjackson.com" target="_blank" rel="noopener noreferrer">
              kieranjackson.com ↗
            </a>
          </span>
        </footer>
      </div>
    </main>
  )
}
